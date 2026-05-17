import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ConversationKind,
  ConversationRoomAudience,
  DoctorStatus,
  Prisma,
  Role,
  SupervisorStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SendMessageDto, StartMessageDto } from "./dto";

const ROOM_DEFINITIONS = [
  {
    code: "all-users",
    title: "Whole platform",
    description: "A broadcast room for the full DentyHub community.",
    audience: ConversationRoomAudience.ALL_USERS,
  },
  {
    code: "students-supervisors",
    title: "Students and supervisors",
    description: "Shared discussion room for student doctors and supervisors.",
    audience: ConversationRoomAudience.STUDENTS_SUPERVISORS,
  },
  {
    code: "supervisors-only",
    title: "Supervisors room",
    description: "Internal coordination room for supervisors.",
    audience: ConversationRoomAudience.SUPERVISORS_ONLY,
  },
] as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async findUser(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
          { phone: identifier },
          { username: identifier },
          { doctorIdNumber: identifier },
        ],
      },
      include: {
        groupMembership: {
          select: {
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                semesterLabel: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private ensureChatEligibility(user: {
    role: Role;
    blocked: boolean;
    blockedUntil: Date | null;
    doctorStatus: DoctorStatus;
    supervisorStatus: SupervisorStatus;
  }) {
    if (user.blocked || (user.blockedUntil && user.blockedUntil > new Date())) {
      throw new UnauthorizedException("Account is blocked.");
    }
    if (user.role === Role.DOCTOR && user.doctorStatus !== DoctorStatus.APPROVED) {
      throw new UnauthorizedException("Doctor account is not approved.");
    }
    if (
      user.role === Role.SUPERVISOR &&
      user.supervisorStatus !== SupervisorStatus.APPROVED
    ) {
      throw new UnauthorizedException("Supervisor account is not approved.");
    }
  }

  private canDirectChat(
    sender: { id: string; role: Role },
    recipient: { id: string; role: Role },
  ) {
    if (sender.id === recipient.id) return false;
    if (sender.role === Role.PATIENT && recipient.role === Role.PATIENT) return false;
    return true;
  }

  private async getConversationForUsers(userIds: string[]) {
    return this.prisma.conversation.findFirst({
      where: {
        kind: ConversationKind.DIRECT,
        AND: [
          { participants: { some: { userId: userIds[0] } } },
          { participants: { some: { userId: userIds[1] } } },
          { participants: { every: { userId: { in: userIds } } } },
        ],
      },
      include: {
        participants: true,
      },
    });
  }

  private async ensureParticipants(conversationId: string, userIds: string[]) {
    if (!userIds.length) return;
    await this.prisma.conversationParticipant.createMany({
      data: userIds.map((userId) => ({ conversationId, userId })),
      skipDuplicates: true,
    });
  }

  private async cleanupOrphanConversations() {
    const orphans = await this.prisma.conversation.findMany({
      where: {
        kind: ConversationKind.DIRECT,
        participants: { none: {} },
      },
      select: { id: true },
    });
    const ids = orphans.map((item) => item.id);
    if (!ids.length) return 0;
    await this.prisma.message.deleteMany({
      where: { conversationId: { in: ids } },
    });
    await this.prisma.conversation.deleteMany({
      where: { id: { in: ids } },
    });
    return ids.length;
  }

  private async ensureCoreRooms() {
    for (const room of ROOM_DEFINITIONS) {
      await this.prisma.conversation.upsert({
        where: { code: room.code },
        update: {
          kind: ConversationKind.ROOM,
          title: room.title,
          description: room.description,
          audience: room.audience,
        },
        create: {
          kind: ConversationKind.ROOM,
          code: room.code,
          title: room.title,
          description: room.description,
          audience: room.audience,
        },
      });
    }
  }

  private async ensureGroupRoom(groupId: string, groupName: string) {
    const code = `group:${groupId}`;
    return this.prisma.conversation.upsert({
      where: { code },
      update: {
        kind: ConversationKind.ROOM,
        title: `${groupName} group`,
        description: `Private room for ${groupName}.`,
        audience: ConversationRoomAudience.GROUP,
        groupId,
      },
      create: {
        kind: ConversationKind.ROOM,
        code,
        title: `${groupName} group`,
        description: `Private room for ${groupName}.`,
        audience: ConversationRoomAudience.GROUP,
        groupId,
      },
    });
  }

  private async ensureRelevantRoomRecords(user: Awaited<ReturnType<ChatService["findUser"]>>) {
    await this.ensureCoreRooms();
    if (user.role === Role.DOCTOR && user.groupMembership?.group) {
      await this.ensureGroupRoom(
        user.groupMembership.group.id,
        user.groupMembership.group.name,
      );
    }
  }

  private roomWhereForUser(user: Awaited<ReturnType<ChatService["findUser"]>>): Prisma.ConversationWhereInput {
    if (user.role === Role.ADMIN) {
      return { kind: ConversationKind.ROOM };
    }
    if (user.role === Role.SUPERVISOR) {
      return {
        kind: ConversationKind.ROOM,
        OR: [
          { audience: ConversationRoomAudience.ALL_USERS },
          { audience: ConversationRoomAudience.STUDENTS_SUPERVISORS },
          { audience: ConversationRoomAudience.SUPERVISORS_ONLY },
        ],
      };
    }
    if (user.role === Role.DOCTOR) {
      return {
        kind: ConversationKind.ROOM,
        OR: [
          { audience: ConversationRoomAudience.ALL_USERS },
          { audience: ConversationRoomAudience.STUDENTS_SUPERVISORS },
          user.groupMembership?.groupId
            ? { groupId: user.groupMembership.groupId }
            : { id: "__never__" },
        ],
      };
    }
    return {
      kind: ConversationKind.ROOM,
      audience: ConversationRoomAudience.ALL_USERS,
    };
  }

  private async getOrCreateParticipant(
    conversationId: string,
    userId: string,
  ) {
    const existing = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (existing) return existing;
    return this.prisma.conversationParticipant.create({
      data: { conversationId, userId },
    });
  }

  private userCanAccessRoom(
    user: Awaited<ReturnType<ChatService["findUser"]>>,
    conversation: {
      audience: ConversationRoomAudience | null;
      groupId: string | null;
    },
  ) {
    if (user.role === Role.ADMIN) return true;
    if (conversation.audience === ConversationRoomAudience.ALL_USERS) return true;
    if (conversation.audience === ConversationRoomAudience.SUPERVISORS_ONLY) {
      return user.role === Role.SUPERVISOR;
    }
    if (conversation.audience === ConversationRoomAudience.STUDENTS_SUPERVISORS) {
      return user.role === Role.DOCTOR || user.role === Role.SUPERVISOR;
    }
    if (conversation.audience === ConversationRoomAudience.GROUP) {
      return user.role === Role.DOCTOR && user.groupMembership?.groupId === conversation.groupId;
    }
    return false;
  }

  private async ensureConversationAccess(
    conversationId: string,
    identifier: string,
  ) {
    const user = await this.findUser(identifier);
    this.ensureChatEligibility(user);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        group: {
          select: {
            id: true,
            name: true,
            semesterLabel: true,
          },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException("Conversation not found.");
    }

    if (conversation.kind === ConversationKind.DIRECT) {
      const participant = conversation.participants.find(
        (item) => item.userId === user.id,
      );
      if (!participant) {
        throw new UnauthorizedException("Not part of this conversation");
      }
      return { user, conversation, participant };
    }

    if (!this.userCanAccessRoom(user, conversation)) {
      throw new ForbiddenException("You cannot access this room.");
    }
    const participant = await this.getOrCreateParticipant(conversation.id, user.id);
    return { user, conversation, participant };
  }

  async listConversations(identifier: string) {
    await this.cleanupOrphanConversations();
    const user = await this.findUser(identifier);
    this.ensureChatEligibility(user);
    await this.ensureRelevantRoomRecords(user);

    const [directConversations, roomConversations] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          kind: ConversationKind.DIRECT,
          participants: { some: { userId: user.id } },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: { user: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: true,
            },
          },
        },
      }),
      this.prisma.conversation.findMany({
        where: this.roomWhereForUser(user),
        orderBy: { updatedAt: "desc" },
        include: {
          participants: true,
          group: {
            select: {
              id: true,
              name: true,
              semesterLabel: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: true,
            },
          },
        },
      }),
    ]);

    const directItems = await Promise.all(
      directConversations.map(async (conversation) => {
        const lastMessage = conversation.messages[0] || null;
        const participant = conversation.participants.find(
          (item) => item.userId === user.id,
        );
        const other = conversation.participants.find((item) => item.userId !== user.id);
        const unread = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: user.id },
            createdAt: {
              gt: participant?.lastReadAt || new Date(0),
            },
          },
        });
        return {
          id: conversation.id,
          kind: conversation.kind,
          unread,
          lastMessage,
          title: other?.user?.name || other?.user?.username || "Direct conversation",
          otherUser: other?.user || null,
          updatedAt: conversation.updatedAt,
        };
      }),
    );

    const roomItems = await Promise.all(
      roomConversations.map(async (conversation) => {
        const participant = await this.getOrCreateParticipant(conversation.id, user.id);
        const lastMessage = conversation.messages[0] || null;
        const unread = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: user.id },
            createdAt: {
              gt: participant.lastReadAt || new Date(0),
            },
          },
        });
        return {
          id: conversation.id,
          kind: conversation.kind,
          unread,
          lastMessage,
          title:
            conversation.title ||
            (conversation.group ? `${conversation.group.name} group` : "Shared room"),
          description: conversation.description,
          roomAudience: conversation.audience,
          group: conversation.group,
          updatedAt: conversation.updatedAt,
          otherUser: null,
        };
      }),
    );

    return [...roomItems, ...directItems]
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
      .map(({ updatedAt, ...item }) => item);
  }

  async unreadConversationsCount(identifier: string) {
    const list = await this.listConversations(identifier);
    return list.filter((item) => item.unread > 0).length;
  }

  async searchUsers(query: string, requesterIdentifier?: string) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const requester = requesterIdentifier
      ? await this.findUser(requesterIdentifier)
      : null;
    if (requester) {
      this.ensureChatEligibility(requester);
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed } },
          { username: { contains: trimmed, mode: "insensitive" } },
          { doctorIdNumber: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        doctorIdNumber: true,
      },
      take: 20,
      orderBy: [{ name: "asc" }],
    });

    return users.filter((candidate) => {
      if (requester && candidate.id === requester.id) return false;
      if (!requester) return true;
      if (requester.role === Role.PATIENT) {
        return candidate.role === Role.DOCTOR || candidate.role === Role.SUPERVISOR || candidate.role === Role.ADMIN;
      }
      return true;
    });
  }

  async startOrSend(dto: StartMessageDto) {
    const sender = await this.findUser(dto.senderIdentifier);
    const recipient = await this.findUser(dto.recipientIdentifier);
    this.ensureChatEligibility(sender);
    this.ensureChatEligibility(recipient);

    if (!this.canDirectChat(sender, recipient)) {
      throw new ForbiddenException("Direct messaging is not allowed for this pair.");
    }

    let conversation = await this.getConversationForUsers([sender.id, recipient.id]);
    if (!conversation) {
      const created = await this.prisma.conversation.create({
        data: {
          kind: ConversationKind.DIRECT,
          participants: {
            create: [{ userId: sender.id }, { userId: recipient.id }],
          },
        },
      });
      conversation = await this.prisma.conversation.findUnique({
        where: { id: created.id },
        include: { participants: true },
      });
    }

    if (!conversation) throw new NotFoundException("Conversation not created");

    await this.ensureParticipants(conversation.id, [sender.id, recipient.id]);

    if (dto.text?.trim()) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          text: dto.text.trim(),
        },
      });
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    return { conversationId: conversation.id };
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, imageUrl?: string) {
    if (!dto.text?.trim() && !imageUrl) {
      throw new BadRequestException("Message text or image is required.");
    }
    const { user, conversation } = await this.ensureConversationAccess(
      conversationId,
      dto.senderIdentifier,
    );

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        text: dto.text?.trim() || null,
        imageUrl: imageUrl || null,
      },
      include: { sender: true },
    });
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  async listMessages(conversationId: string, identifier: string) {
    const { participant } = await this.ensureConversationAccess(
      conversationId,
      identifier,
    );
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: true },
      take: 200,
    });
    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
    return messages;
  }

  async markRead(conversationId: string, identifier: string) {
    const { participant } = await this.ensureConversationAccess(
      conversationId,
      identifier,
    );
    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }
}
