import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { DoctorStatus, Role, SupervisorStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: { user: any; supervisorRequest: any; doctorRequest: any; notification: any; semester: any };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      supervisorRequest: { create: jest.fn() },
      doctorRequest: { create: jest.fn() },
      notification: { create: jest.fn() },
      semester: { findMany: jest.fn(), findUnique: jest.fn() },
    };
    jwt = { sign: jest.fn().mockReturnValue("signed.jwt.token") };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe("login", () => {
    const baseUser = {
      id: "user-1",
      username: "alice",
      name: "Alice",
      email: "alice@example.com",
      phone: "0790000001",
      password: "",
      role: Role.PATIENT,
      supervisorStatus: SupervisorStatus.NONE,
      doctorStatus: DoctorStatus.NONE,
      avatar: null,
      gender: "female",
      blocked: false,
      blockedUntil: null,
      blockReason: null,
      bio: null,
      semesterId: null,
    };

    it("issues a JWT and returns the user on a valid login", async () => {
      const passwordHash = await bcrypt.hash("Correct1!", 4);
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, password: passwordHash });

      const result = await service.login({
        identifier: "alice",
        password: "Correct1!",
      });

      expect(result.token).toBe("signed.jwt.token");
      expect(result.user.id).toBe("user-1");
      expect(result.user.role).toBe(Role.PATIENT);
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: "user-1",
        username: "alice",
        role: Role.PATIENT,
      });
    });

    it("rejects unknown identifiers", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ identifier: "nobody", password: "x" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("rejects the wrong password", async () => {
      const passwordHash = await bcrypt.hash("Correct1!", 4);
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, password: passwordHash });

      await expect(
        service.login({ identifier: "alice", password: "Wrong1!" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("rejects blocked accounts", async () => {
      const passwordHash = await bcrypt.hash("Correct1!", 4);
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        password: passwordHash,
        blocked: true,
      });

      await expect(
        service.login({ identifier: "alice", password: "Correct1!" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a supervisor whose request is still pending", async () => {
      const passwordHash = await bcrypt.hash("Correct1!", 4);
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        password: passwordHash,
        role: Role.SUPERVISOR,
        supervisorStatus: SupervisorStatus.PENDING,
      });

      await expect(
        service.login({ identifier: "alice", password: "Correct1!" }),
      ).rejects.toThrow(/pending/i);
    });

    it("rejects a doctor whose request was rejected", async () => {
      const passwordHash = await bcrypt.hash("Correct1!", 4);
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        password: passwordHash,
        role: Role.DOCTOR,
        doctorStatus: DoctorStatus.REJECTED,
      });

      await expect(
        service.login({ identifier: "alice", password: "Correct1!" }),
      ).rejects.toThrow(/reject/i);
    });

    it("treats a future blockedUntil as blocked", async () => {
      const passwordHash = await bcrypt.hash("Correct1!", 4);
      const futureBlock = new Date(Date.now() + 24 * 60 * 60 * 1000);
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        password: passwordHash,
        blockedUntil: futureBlock,
      });

      await expect(
        service.login({ identifier: "alice", password: "Correct1!" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("registerOptions", () => {
    it("returns active semesters ordered by sortOrder", async () => {
      const semesters = [
        { id: "s1", label: "Year 4 — S1", sortOrder: 1, endsOn: null },
      ];
      prisma.semester.findMany.mockResolvedValue(semesters);

      const result = await service.registerOptions();

      expect(result).toEqual({ semesters });
      expect(prisma.semester.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: { id: true, label: true, sortOrder: true, endsOn: true },
      });
    });
  });

  describe("changePassword", () => {
    it("rejects when the current password is wrong", async () => {
      const passwordHash = await bcrypt.hash("OldPass1!", 4);
      prisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        username: "alice",
        password: passwordHash,
      });

      await expect(
        service.changePassword({
          identifier: "alice",
          currentPassword: "WrongOld!",
          newPassword: "NewPass1!",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a weak new password (missing special char)", async () => {
      const passwordHash = await bcrypt.hash("OldPass1!", 4);
      prisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        username: "alice",
        password: passwordHash,
      });

      await expect(
        service.changePassword({
          identifier: "alice",
          currentPassword: "OldPass1!",
          newPassword: "WeakPass1",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
