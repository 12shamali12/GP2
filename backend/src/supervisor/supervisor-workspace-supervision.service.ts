import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DoctorStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorWorkspaceSupervisionService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async searchDoctors(identifier: string, query: string) {
    const supervisor = await this.requireSupervisor(identifier);
    const term = query?.trim();
    if (!term) return [];

    const doctors = await this.prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        doctorStatus: DoctorStatus.APPROVED,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { username: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { doctorIdNumber: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        doctorIdNumber: true,
        groupMembership: {
          include: {
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

    const directAssignments = await this.prisma.supervisionAssignment.findMany({
      where: {
        supervisorId: supervisor.id,
        doctorId: { in: doctors.map((doctor) => doctor.id) },
        active: true,
      },
      select: { doctorId: true },
    });
    const assignedIds = new Set(directAssignments.map((item) => item.doctorId));

    return doctors.map((doctor) => ({
      ...doctor,
      alreadyAssignedToSupervisor: assignedIds.has(doctor.id),
    }));
  }

  async addSupervisionAssignment(
    supervisorIdentifier: string,
    doctorIdentifier: string,
    semesterLabel: string,
    note?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const doctor = await this.findUserByIdentifier(doctorIdentifier);
    if (doctor.role !== Role.DOCTOR || doctor.doctorStatus !== DoctorStatus.APPROVED) {
      throw new BadRequestException(
        "Doctor must be approved before supervision assignment.",
      );
    }

    const existing = await this.prisma.supervisionAssignment.findFirst({
      where: {
        supervisorId: supervisor.id,
        doctorId: doctor.id,
        semesterLabel,
      },
    });

    const assignment = existing
      ? await this.prisma.supervisionAssignment.update({
          where: { id: existing.id },
          data: {
            active: true,
            note: note ?? existing.note ?? null,
            removedAt: null,
          },
        })
      : await this.prisma.supervisionAssignment.create({
          data: {
            supervisorId: supervisor.id,
            doctorId: doctor.id,
            semesterLabel,
            note: note ?? null,
          },
        });

    await this.prisma.notification.create({
      data: {
        title: "Supervisor assigned",
        body: `${supervisor.name} added you under supervision for ${semesterLabel}.`,
        recipientId: doctor.id,
      },
    });

    return { message: "Doctor added under supervision.", assignment };
  }

  async removeSupervisionAssignment(id: string, supervisorIdentifier: string) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const assignment = await this.prisma.supervisionAssignment.findUnique({
      where: { id },
    });
    if (!assignment) throw new NotFoundException("Assignment not found.");
    if (assignment.supervisorId !== supervisor.id) {
      throw new ForbiddenException("You cannot remove this assignment.");
    }

    await this.prisma.supervisionAssignment.update({
      where: { id },
      data: {
        active: false,
        removedAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Supervisor assignment removed",
        body: `${supervisor.name} removed you from direct supervision.`,
        recipientId: assignment.doctorId,
      },
    });

    return { message: "Supervision assignment removed." };
  }

  async freezeDoctor(
    doctorId: string,
    supervisorIdentifier: string,
    blockedUntil: string,
    reason?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new NotFoundException("Doctor not found.");
    }
    await this.ensureSupervisorManagesDoctor(supervisor.id, doctorId);

    const until = new Date(blockedUntil);
    if (Number.isNaN(until.getTime()) || until <= new Date()) {
      throw new BadRequestException("blockedUntil must be in the future.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: doctorId },
        data: {
          blockedUntil: until,
          blockReason: reason ?? "Supervisor freeze applied.",
        },
      }),
      this.prisma.doctorFreeze.create({
        data: {
          doctorId,
          supervisorId: supervisor.id,
          blockedUntil: until,
          reason: reason ?? null,
        },
      }),
      this.prisma.notification.create({
        data: {
          title: "Account temporarily frozen",
          body: `Your account is frozen until ${until.toLocaleString()}${reason ? `: ${reason}` : "."}`,
          recipientId: doctorId,
        },
      }),
    ]);

    return { message: "Doctor account frozen until the selected date." };
  }

  async unfreezeDoctor(doctorId: string, supervisorIdentifier: string) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new NotFoundException("Doctor not found.");
    }
    await this.ensureSupervisorManagesDoctor(supervisor.id, doctorId);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: doctorId },
        data: {
          blockedUntil: null,
          blockReason: null,
          blocked: false,
        },
      }),
      this.prisma.notification.create({
        data: {
          title: "Account unfrozen",
          body: `${supervisor.name} restored your account access.`,
          recipientId: doctorId,
        },
      }),
    ]);

    return { message: "Doctor account unfrozen." };
  }

  async createTask(
    supervisorIdentifier: string,
    title: string,
    description: string,
    dueAt?: string,
    doctorId?: string,
    groupId?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    if (!doctorId && !groupId) {
      throw new BadRequestException("A task must target a doctor or a group.");
    }
    if (doctorId && groupId) {
      throw new BadRequestException(
        "Choose either a single doctor or a group for the task.",
      );
    }

    if (doctorId) {
      await this.ensureSupervisorManagesDoctor(supervisor.id, doctorId);
    }

    if (groupId) {
      const group = await this.prisma.doctorGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        throw new NotFoundException("Group not found.");
      }
    }

    const task = await this.prisma.supervisorTask.create({
      data: {
        supervisorId: supervisor.id,
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null,
        doctorId: doctorId ?? null,
        groupId: groupId ?? null,
      },
      include: {
        doctor: {
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
            members: {
              select: {
                doctorId: true,
              },
            },
          },
        },
      },
    });

    const recipientIds = new Set<string>();
    if (task.doctorId) recipientIds.add(task.doctorId);
    task.group?.members.forEach((member) => recipientIds.add(member.doctorId));
    if (recipientIds.size > 0) {
      await this.prisma.notification.createMany({
        data: Array.from(recipientIds).map((recipientId) => ({
          title: "New supervisor task",
          body: `${supervisor.name} assigned: ${title}`,
          recipientId,
        })),
      });
    }

    return { message: "Task created.", task };
  }
}
