import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto';
import { Prisma, Role, SupervisorStatus, DoctorStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private signToken(user: { id: string; username: string; role: Role }) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return this.jwt.sign(payload);
  }

  async registerOptions() {
    const semesters = await this.prisma.semester.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        label: true,
        sortOrder: true,
        endsOn: true,
      },
    });
    return { semesters };
  }

  private async findAdmin() {
    return this.prisma.user.findFirst({ where: { role: Role.ADMIN } });
  }

  async profile(identifier: string) {
    if (!identifier) throw new BadRequestException('Identifier is required.');
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
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        doctorIdNumber: true,
        bio: true,
        role: true,
        supervisorStatus: true,
        doctorStatus: true,
        avatar: true,
        gender: true,
        blockedUntil: true,
        blockReason: true,
        semester: {
          select: {
            id: true,
            label: true,
            sortOrder: true,
            endsOn: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }

  async register(dto: RegisterDto) {
    const {
      email,
      phone,
      username,
      password,
      name,
      age,
      gender,
      avatar,
      doctorIdNumber,
      semesterId,
    } = dto;
    const requestedRole = dto.role ?? Role.PATIENT;

    if (!phone) {
      throw new BadRequestException('Phone is required.');
    }
    if (requestedRole !== Role.PATIENT && !email) {
      throw new BadRequestException(
        'Email is required for doctors and supervisors.',
      );
    }
    if (requestedRole === Role.DOCTOR && !doctorIdNumber) {
      throw new BadRequestException(
        'Doctor ID number is required for doctors.',
      );
    }
    if (requestedRole === Role.DOCTOR && !semesterId) {
      throw new BadRequestException('Semester is required for doctors.');
    }

    if (semesterId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: semesterId },
        select: { id: true, active: true },
      });
      if (!semester || !semester.active) {
        throw new BadRequestException('Selected semester was not found.');
      }
    }

    const orFilters: Prisma.UserWhereInput[] = [{ username }];
    if (email) orFilters.push({ email });
    if (phone) orFilters.push({ phone });
    if (doctorIdNumber) orFilters.push({ doctorIdNumber });

    const conflict = await this.prisma.user.findFirst({
      where: { OR: orFilters },
    });
    if (conflict) {
      throw new BadRequestException(
        'User already exists with that email/phone/username.',
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const isSupervisor = requestedRole === Role.SUPERVISOR;
    const isDoctor = requestedRole === Role.DOCTOR;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        username,
        password: hashed,
        name,
        age: age ?? null,
        gender: gender ?? null,
        doctorIdNumber: doctorIdNumber ?? null,
        role: requestedRole,
        semesterId:
          requestedRole === Role.DOCTOR ? semesterId ?? null : null,
        supervisorStatus: isSupervisor
          ? SupervisorStatus.PENDING
          : SupervisorStatus.NONE,
        doctorStatus: isDoctor ? DoctorStatus.PENDING : DoctorStatus.NONE,
        avatar: avatar ?? null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        name: true,
        age: true,
        gender: true,
        role: true,
        supervisorStatus: true,
        doctorStatus: true,
        avatar: true,
        bio: true,
        semester: {
          select: {
            id: true,
            label: true,
            sortOrder: true,
            endsOn: true,
          },
        },
        createdAt: true,
      },
    });

    if (isSupervisor) {
      const admin = await this.findAdmin();
      await this.prisma.supervisorRequest.create({
        data: {
          applicantId: user.id,
          reviewerId: admin?.id,
          status: SupervisorStatus.PENDING,
        },
      });
      if (admin) {
        await this.prisma.notification.create({
          data: {
            title: 'Supervisor approval needed',
            body: `${user.name} (${user.username}) requested supervisor access.`,
            recipientId: admin.id,
          },
        });
      }
    }

    if (isDoctor) {
      const admin = await this.findAdmin();
      await this.prisma.doctorRequest.create({
        data: {
          applicantId: user.id,
          reviewerId: admin?.id,
          status: DoctorStatus.PENDING,
        },
      });
      if (admin) {
        await this.prisma.notification.create({
          data: {
            title: 'Doctor approval needed',
            body: `${user.name} (${user.username}) requested doctor access.`,
            recipientId: admin.id,
          },
        });
      }
    }

    return {
      message:
        isSupervisor || isDoctor
          ? `${isSupervisor ? 'Supervisor' : 'Doctor'} request submitted and pending approval.`
          : 'Registration successful.',
      user,
    };
  }

  async login(dto: LoginDto) {
    const { identifier, password } = dto;
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
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');

    const blockedUntilActive = user.blockedUntil && user.blockedUntil > new Date();

    if (user.blocked || blockedUntilActive) {
      throw new UnauthorizedException('Account is blocked.');
    }

    if (
      user.role === Role.SUPERVISOR &&
      user.supervisorStatus !== SupervisorStatus.APPROVED
    ) {
      throw new UnauthorizedException(
        user.supervisorStatus === SupervisorStatus.PENDING
          ? 'Supervisor approval pending.'
          : 'Supervisor request was rejected.',
      );
    }
    if (
      user.role === Role.DOCTOR &&
      user.doctorStatus !== DoctorStatus.APPROVED
    ) {
      throw new UnauthorizedException(
        user.doctorStatus === DoctorStatus.PENDING
          ? 'Doctor approval pending.'
          : 'Doctor request was rejected.',
      );
    }

    const token = this.signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        supervisorStatus: user.supervisorStatus,
        doctorStatus: user.doctorStatus,
        avatar: user.avatar,
        gender: user.gender,
        blockedUntil: user.blockedUntil,
        blockReason: user.blockReason,
        bio: user.bio,
        semester: user.semesterId
          ? await this.prisma.semester.findUnique({
              where: { id: user.semesterId },
              select: {
                id: true,
                label: true,
                sortOrder: true,
                endsOn: true,
              },
            })
          : null,
      },
    };
  }

  async resendSupervisorRequest(dto: LoginDto) {
    const { identifier, password } = dto;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { username: identifier },
        ],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');
    if (user.role !== Role.SUPERVISOR) {
      throw new BadRequestException(
        'Only supervisor accounts can resend requests.',
      );
    }
    if (user.supervisorStatus !== SupervisorStatus.REJECTED) {
      throw new BadRequestException('Request is not rejected; cannot resend.');
    }

    const admin = await this.findAdmin();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { supervisorStatus: SupervisorStatus.PENDING },
      }),
      this.prisma.supervisorRequest.create({
        data: {
          applicantId: user.id,
          reviewerId: admin?.id,
          status: SupervisorStatus.PENDING,
        },
      }),
      admin
        ? this.prisma.notification.create({
            data: {
              title: 'Supervisor approval needed (resend)',
              body: `${user.name} (${user.username}) re-requested supervisor access.`,
              recipientId: admin.id,
            },
          })
        : this.prisma.notification.create({
            data: {
              title: 'Supervisor request resubmitted',
              body: 'Your request is pending approval.',
              recipientId: user.id,
            },
          }),
    ]);

    return { message: 'Supervisor request resubmitted and pending approval.' };
  }

  async resendDoctorRequest(dto: LoginDto) {
    const { identifier, password } = dto;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { username: identifier },
        ],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');
    if (user.role !== Role.DOCTOR) {
      throw new BadRequestException(
        'Only doctor accounts can resend requests.',
      );
    }
    if (user.doctorStatus !== DoctorStatus.REJECTED) {
      throw new BadRequestException('Request is not rejected; cannot resend.');
    }

    const admin = await this.findAdmin();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { doctorStatus: DoctorStatus.PENDING },
      }),
      this.prisma.doctorRequest.create({
        data: {
          applicantId: user.id,
          reviewerId: admin?.id,
          status: DoctorStatus.PENDING,
        },
      }),
      admin
        ? this.prisma.notification.create({
            data: {
              title: 'Doctor approval needed (resend)',
              body: `${user.name} (${user.username}) re-requested doctor access.`,
              recipientId: admin.id,
            },
          })
        : this.prisma.notification.create({
            data: {
              title: 'Doctor request resubmitted',
              body: 'Your request is pending approval.',
              recipientId: user.id,
            },
          }),
    ]);

    return { message: 'Doctor request resubmitted and pending approval.' };
  }

  async changePassword(dto: ChangePasswordDto) {
    const { identifier, currentPassword, newPassword } = dto;
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
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('Current password is incorrect.');

    const rules = [
      { test: /.{8,}/, msg: 'Password must be at least 8 characters.' },
      { test: /[0-9]/, msg: 'Password must have a number.' },
      { test: /[A-Z]/, msg: 'Password must have an uppercase letter.' },
      { test: /[a-z]/, msg: 'Password must have a lowercase letter.' },
      { test: /[^A-Za-z0-9]/, msg: 'Password must have a special character.' },
    ];
    for (const r of rules) {
      if (!r.test.test(newPassword)) {
        throw new BadRequestException(r.msg);
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    await this.prisma.notification.create({
      data: {
        title: 'Password updated',
        body: 'Your password was changed successfully.',
        recipientId: user.id,
      },
    });
    return { message: 'Password updated successfully.' };
  }

  async updateProfile(dto: UpdateProfileDto) {
    const { identifier, name, phone, avatar } = dto;
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
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const data: Prisma.UserUpdateInput = {};
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;
    if (dto.doctorIdNumber !== undefined)
      data.doctorIdNumber = dto.doctorIdNumber;
    if (dto.bio !== undefined) data.bio = dto.bio || null;

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        doctorStatus: true,
        supervisorStatus: true,
        avatar: true,
        gender: true,
        bio: true,
        semester: {
          select: {
            id: true,
            label: true,
            sortOrder: true,
            endsOn: true,
          },
        },
      },
    });

    await this.prisma.notification.create({
      data: {
        title: 'Profile updated',
        body: 'Your profile details were updated.',
        recipientId: user.id,
      },
    });

    return { message: 'Profile updated.', user: updated };
  }
}
