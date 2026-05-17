import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DoctorStatus,
  GroupJoinRequestStatus,
  PartnerRequestStatus,
  Role,
  SlotStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorGroupsService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async listGroups(adminId: string) {
    await this.requireAdmin(adminId);
    const groups = await this.prisma.doctorGroup.findMany({
      orderBy: [{ active: "desc" }, { semesterLabel: "asc" }, { name: "asc" }],
      include: {
        members: {
          orderBy: { doctor: { name: "asc" } },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                doctorIdNumber: true,
              },
            },
          },
        },
        supervisors: {
          orderBy: { supervisor: { name: "asc" } },
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        },
        joinRequests: {
          where: { status: GroupJoinRequestStatus.PENDING },
          include: {
            applicant: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        partnerPairs: {
          include: {
            doctorOne: {
              select: {
                id: true,
                name: true,
                username: true,
                doctorIdNumber: true,
              },
            },
            doctorTwo: {
              select: {
                id: true,
                name: true,
                username: true,
                doctorIdNumber: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        partnerRequests: {
          where: { status: PartnerRequestStatus.PENDING },
          orderBy: [{ sender: { name: "asc" } }, { receiver: { name: "asc" } }],
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                doctorIdNumber: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                doctorIdNumber: true,
              },
            },
          },
        },
        posts: {
          take: 4,
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        rotationAssignments: {
          orderBy: [{ assignmentDate: "asc" }, { plan: { label: "asc" } }],
          include: {
            plan: {
              select: {
                id: true,
                label: true,
                startsOn: true,
                endsOn: true,
                shift: {
                  select: {
                    id: true,
                    name: true,
                    startsAt: true,
                    endsAt: true,
                  },
                },
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
            shift: {
              select: {
                id: true,
                name: true,
                startsAt: true,
                endsAt: true,
              },
            },
          },
        },
      },
    });

    return groups.map((group) => {
      const planSummary = this.summarizeGroupPlans(group.rotationAssignments);

      return {
        ...group,
        assignedPlans: planSummary.assignedPlans,
        currentPlan: planSummary.currentPlan,
        nextPlans: planSummary.nextPlans,
      };
    });
  }

  async createGroup(
    name: string,
    description: string | undefined,
    semesterLabel: string,
    adminId: string,
  ) {
    const admin = await this.requireAdmin(adminId);
    const group = await this.prisma.doctorGroup.create({
      data: {
        name,
        description: description ?? null,
        semesterLabel,
        createdById: admin.id,
      },
    });
    return { message: "Group created.", group };
  }

  async updateGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      semesterLabel?: string;
      active?: boolean;
    },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const group = await this.prisma.doctorGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
        ...(data.semesterLabel !== undefined
          ? { semesterLabel: data.semesterLabel }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return { message: "Group updated.", group };
  }

  async deleteGroup(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const group = await this.prisma.doctorGroup.findUnique({
      where: { id },
      include: {
        rotationAssignments: { select: { id: true }, take: 1 },
      },
    });
    if (!group) {
      throw new NotFoundException("Group not found.");
    }
    if (group.rotationAssignments.length) {
      throw new BadRequestException(
        "This group already has published plan assignments. Remove those assignments before deleting the group.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const members = await tx.doctorGroupMember.findMany({
        where: { groupId: id },
        select: { doctorId: true },
      });

      await tx.groupJoinRequest.deleteMany({ where: { groupId: id } });
      await tx.partnerRequest.deleteMany({ where: { groupId: id } });
      await tx.partnerPair.deleteMany({ where: { groupId: id } });
      await tx.groupPost.deleteMany({ where: { groupId: id } });
      await tx.supervisorTask.deleteMany({ where: { groupId: id } });
      await tx.doctorGroupSupervisor.deleteMany({ where: { groupId: id } });
      await tx.doctorGroupMember.deleteMany({ where: { groupId: id } });
      await tx.doctorGroup.delete({ where: { id } });

      if (members.length) {
        await tx.notification.createMany({
          data: members.map((member) => ({
            title: "Group deleted",
            body: `${group.name} was removed from the semester workspace.`,
            recipientId: member.doctorId,
          })),
        });
      }
    });

    return { message: "Group deleted." };
  }

  async addDoctorToGroup(
    groupId: string,
    doctorId: string,
    note: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const [group, doctor] = await Promise.all([
      this.prisma.doctorGroup.findUnique({ where: { id: groupId } }),
      this.prisma.user.findUnique({ where: { id: doctorId } }),
    ]);
    if (!group) throw new NotFoundException("Group not found.");
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new BadRequestException("Doctor not found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.assignDoctorToGroupTx(tx, groupId, doctorId, note);
      await tx.notification.create({
        data: {
          title: "Group assignment updated",
          body: `You were assigned to ${group.name}.`,
          recipientId: doctorId,
        },
      });
    });

    return { message: "Doctor assigned to group." };
  }

  async removeDoctorFromGroup(
    groupId: string,
    doctorId: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const group = await this.prisma.doctorGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException("Group not found.");

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorGroupMember.deleteMany({
        where: { groupId, doctorId },
      });
      await this.clearDoctorPartneringTx(tx, doctorId);
      await tx.availabilitySlot.deleteMany({
        where: {
          doctorId,
          autoGenerated: true,
          status: SlotStatus.OPEN,
          startTime: { gte: new Date() },
          rotationAssignment: {
            groupId,
          },
        },
      });
      await tx.notification.create({
        data: {
          title: "Group assignment removed",
          body: `You were removed from ${group.name}.`,
          recipientId: doctorId,
        },
      });
    });
    return { message: "Doctor removed from group." };
  }

  async addSupervisorToGroup(
    groupId: string,
    supervisorId: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const [group, supervisor] = await Promise.all([
      this.prisma.doctorGroup.findUnique({ where: { id: groupId } }),
      this.prisma.user.findUnique({ where: { id: supervisorId } }),
    ]);
    if (!group) throw new NotFoundException("Group not found.");
    if (!supervisor || supervisor.role !== Role.SUPERVISOR) {
      throw new BadRequestException("Supervisor not found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.assignSupervisorToGroupTx(tx, groupId, supervisorId);
      await tx.notification.create({
        data: {
          title: "Group supervision assigned",
          body: `You were added as a supervisor to ${group.name}.`,
          recipientId: supervisorId,
        },
      });
    });

    return { message: "Supervisor assigned to group." };
  }

  async removeSupervisorFromGroup(
    groupId: string,
    supervisorId: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const group = await this.prisma.doctorGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException("Group not found.");

    await this.prisma.doctorGroupSupervisor.deleteMany({
      where: { groupId, supervisorId },
    });
    await this.prisma.notification.create({
      data: {
        title: "Group supervision removed",
        body: `You were removed from ${group.name}.`,
        recipientId: supervisorId,
      },
    });
    return { message: "Supervisor removed from group." };
  }

  async listGroupJoinRequests(adminId: string) {
    await this.requireAdmin(adminId);
    return this.prisma.groupJoinRequest.findMany({
      where: { status: GroupJoinRequestStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        group: true,
      },
    });
  }

  async decideGroupJoinRequest(
    id: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    const admin = await this.requireAdmin(adminId);
    const request = await this.prisma.groupJoinRequest.findUnique({
      where: { id },
      include: { applicant: true, group: true },
    });
    if (!request) throw new NotFoundException("Join request not found.");
    if (request.status !== GroupJoinRequestStatus.PENDING) {
      throw new BadRequestException("Join request already processed.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupJoinRequest.update({
        where: { id },
        data: {
          status: approve
            ? GroupJoinRequestStatus.APPROVED
            : GroupJoinRequestStatus.REJECTED,
          reviewerId: admin.id,
          decidedAt: new Date(),
          note: note ?? request.note ?? null,
        },
      });

      if (approve) {
        if (request.applicant.role !== Role.DOCTOR) {
          throw new BadRequestException("Only student doctors can join groups.");
        }
        await this.assignDoctorToGroupTx(tx, request.groupId, request.applicantId, note);
      }

      await tx.notification.create({
        data: {
          title: approve ? "Group request approved" : "Group request rejected",
          body: approve
            ? `You were added to ${request.group.name}.`
            : note ?? `Your request to join ${request.group.name} was rejected.`,
          recipientId: request.applicantId,
        },
      });
    });

    return {
      message: approve ? "Join request approved." : "Join request rejected.",
    };
  }

  async createPartnerRequest(
    senderIdentifier: string,
    receiverIdentifier: string,
    note?: string,
  ) {
    const sender = await this.requireDoctor(senderIdentifier);
    const receiver = await this.findUserByIdentifier(receiverIdentifier);
    if (receiver.role !== Role.DOCTOR || receiver.doctorStatus !== DoctorStatus.APPROVED) {
      throw new BadRequestException("Partner must be an approved doctor.");
    }
    if (sender.id === receiver.id) {
      throw new BadRequestException("You cannot partner with yourself.");
    }

    const [senderMembership, receiverMembership, senderPair, receiverPair] =
      await Promise.all([
        this.prisma.doctorGroupMember.findUnique({ where: { doctorId: sender.id } }),
        this.prisma.doctorGroupMember.findUnique({ where: { doctorId: receiver.id } }),
        this.prisma.partnerPair.findFirst({
          where: {
            OR: [{ doctorOneId: sender.id }, { doctorTwoId: sender.id }],
          },
        }),
        this.prisma.partnerPair.findFirst({
          where: {
            OR: [{ doctorOneId: receiver.id }, { doctorTwoId: receiver.id }],
          },
        }),
      ]);

    if (
      !senderMembership ||
      !receiverMembership ||
      senderMembership.groupId !== receiverMembership.groupId
    ) {
      throw new BadRequestException("Partners must belong to the same group.");
    }
    if (senderPair || receiverPair) {
      throw new BadRequestException(
        "Both doctors must be free before creating a partnership.",
      );
    }

    const existingPending = await this.prisma.partnerRequest.findFirst({
      where: {
        groupId: senderMembership.groupId,
        status: PartnerRequestStatus.PENDING,
        OR: [
          { senderId: sender.id, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: sender.id },
        ],
      },
    });
    if (existingPending) {
      throw new BadRequestException(
        "A pending partner request already exists for this pair.",
      );
    }

    const request = await this.prisma.partnerRequest.create({
      data: {
        groupId: senderMembership.groupId,
        senderId: sender.id,
        receiverId: receiver.id,
        note: note ?? null,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Partner request received",
        body: `${sender.name} wants to partner with you for the semester.`,
        recipientId: receiver.id,
      },
    });
    await this.notifyAdmins(
      "Partner request awaiting review",
      `${sender.name} requested to partner with ${receiver.name}.`,
    );

    return { message: "Partner request sent.", request };
  }

  async decidePartnerRequestByAdmin(
    requestId: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    const admin = await this.requireAdmin(adminId);
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true,
        group: true,
      },
    });
    if (!request) throw new NotFoundException("Partner request not found.");
    if (request.status !== PartnerRequestStatus.PENDING) {
      throw new BadRequestException("Partner request already processed.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerRequest.update({
        where: { id: requestId },
        data: {
          status: approve
            ? PartnerRequestStatus.ACCEPTED
            : PartnerRequestStatus.REJECTED,
          decidedAt: new Date(),
          note: note ?? request.note ?? null,
        },
      });

      if (approve) {
        const existingPair = await tx.partnerPair.findFirst({
          where: {
            OR: [
              { doctorOneId: request.senderId },
              { doctorTwoId: request.senderId },
              { doctorOneId: request.receiverId },
              { doctorTwoId: request.receiverId },
            ],
          },
        });
        if (existingPair) {
          throw new BadRequestException("One of these doctors is already partnered.");
        }

        await tx.partnerPair.create({
          data: {
            groupId: request.groupId,
            doctorOneId: request.senderId,
            doctorTwoId: request.receiverId,
            note: request.note ?? null,
          },
        });

        await tx.partnerRequest.updateMany({
          where: {
            status: PartnerRequestStatus.PENDING,
            OR: [
              { senderId: request.senderId },
              { receiverId: request.senderId },
              { senderId: request.receiverId },
              { receiverId: request.receiverId },
            ],
          },
          data: {
            status: PartnerRequestStatus.CANCELLED,
            decidedAt: new Date(),
          },
        });
      }

      await tx.notification.create({
        data: {
          title: approve ? "Partnership confirmed" : "Partner request declined",
          body: approve
            ? `Admin approved your partner request with ${request.receiver.name}.`
            : note ?? `Admin declined your partner request with ${request.receiver.name}.`,
          recipientId: request.senderId,
        },
      });
      await tx.notification.create({
        data: {
          title: approve ? "Partnership confirmed" : "Partner request declined",
          body: approve
            ? `Admin approved your partner request with ${request.sender.name}.`
            : note ?? `Admin declined your partner request with ${request.sender.name}.`,
          recipientId: request.receiverId,
        },
      });
    });

    return {
      message: approve
        ? "Partner request approved by admin."
        : "Partner request rejected by admin.",
      reviewerId: admin.id,
    };
  }

  async removePartnershipByAdmin(
    pairId: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const pair = await this.prisma.partnerPair.findUnique({
      where: { id: pairId },
      include: {
        doctorOne: true,
        doctorTwo: true,
      },
    });
    if (!pair) {
      throw new NotFoundException("No active partner pairing found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerPair.delete({
        where: { id: pair.id },
      });
      await tx.notification.create({
        data: {
          title: "Partner pairing removed",
          body: "Admin removed your current partner pairing.",
          recipientId: pair.doctorOneId,
        },
      });
      await tx.notification.create({
        data: {
          title: "Partner pairing removed",
          body: "Admin removed your current partner pairing.",
          recipientId: pair.doctorTwoId,
        },
      });
    });

    return { message: "Partner pairing removed by admin." };
  }

  async createGroupJoinRequest(
    applicantIdentifier: string,
    groupId: string,
    note?: string,
  ) {
    const applicant = await this.findUserByIdentifier(applicantIdentifier);
    if (applicant.role !== Role.DOCTOR) {
      throw new ForbiddenException(
        "Only student doctors can request group access.",
      );
    }

    const group = await this.prisma.doctorGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException("Group not found.");

    const existingMembership = await this.prisma.doctorGroupMember.findUnique({
      where: { doctorId: applicant.id },
    });
    if (existingMembership) {
      throw new BadRequestException(
        "A doctor can only belong to one group at a time.",
      );
    }

    const pending = await this.prisma.groupJoinRequest.findFirst({
      where: {
        applicantId: applicant.id,
        groupId,
        status: GroupJoinRequestStatus.PENDING,
      },
    });
    if (pending) {
      throw new BadRequestException(
        "A pending request already exists for this group.",
      );
    }

    const request = await this.prisma.groupJoinRequest.create({
      data: {
        applicantId: applicant.id,
        groupId,
        note: note ?? null,
      },
    });
    await this.notifyAdmins(
      "Group join request submitted",
      `${applicant.name} requested to join ${group.name}.`,
    );

    return { message: "Group request submitted.", request };
  }

  async createGroupPost(
    groupId: string,
    authorIdentifier: string,
    title: string | undefined,
    body: string,
  ) {
    const author = await this.findUserByIdentifier(authorIdentifier);
    const group = await this.prisma.doctorGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException("Group not found.");

    if (author.role === Role.DOCTOR) {
      const membership = await this.prisma.doctorGroupMember.findUnique({
        where: { doctorId: author.id },
      });
      if (!membership || membership.groupId !== groupId) {
        throw new ForbiddenException("Doctors can only post inside their own group.");
      }
    } else if (author.role === Role.SUPERVISOR) {
      const supervisorLink = await this.prisma.doctorGroupSupervisor.findFirst({
        where: { groupId, supervisorId: author.id },
      });
      if (!supervisorLink) {
        throw new ForbiddenException(
          "You can only post inside groups you supervise.",
        );
      }
    } else if (author.role !== Role.ADMIN) {
      throw new ForbiddenException("This role cannot post in group feeds.");
    }

    const post = await this.prisma.groupPost.create({
      data: {
        groupId,
        authorId: author.id,
        title: title ?? null,
        body,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            semesterLabel: true,
          },
        },
      },
    });

    const groupMembers = await this.prisma.doctorGroup.findUnique({
      where: { id: groupId },
      include: {
        members: { select: { doctorId: true } },
        supervisors: { select: { supervisorId: true } },
      },
    });

    const recipients = new Set<string>();
    groupMembers?.members.forEach((member) => recipients.add(member.doctorId));
    groupMembers?.supervisors.forEach((member) =>
      recipients.add(member.supervisorId),
    );
    recipients.delete(author.id);

    if (recipients.size > 0) {
      await this.prisma.notification.createMany({
        data: Array.from(recipients).map((recipientId) => ({
          title: `New post in ${group.name}`,
          body: `${author.name} shared an update in the group feed.`,
          recipientId,
        })),
      });
    }

    return { message: "Post created.", post };
  }
}
