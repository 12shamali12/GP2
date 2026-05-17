import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { DoctorStatus, Role, SupervisorStatus } from "@prisma/client";
import { SupervisorAdminService } from "./supervisor-admin.service";
import { PrismaService } from "../prisma.service";

describe("SupervisorAdminService", () => {
  let service: SupervisorAdminService;
  let prisma: {
    user: any;
    supervisorRequest: any;
    doctorRequest: any;
    notification: any;
    $transaction: jest.Mock;
  };

  const admin = {
    id: "admin-1",
    username: "prof.shamali",
    role: Role.ADMIN,
    password: "irrelevant",
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      supervisorRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      doctorRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      notification: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupervisorAdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SupervisorAdminService);
  });

  describe("requireAdmin (via listPending)", () => {
    it("rejects when adminId is missing", async () => {
      await expect(service.listPending("" as unknown as string)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("rejects when the user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.listPending("ghost")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("rejects when the user is not an admin", async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...admin,
        role: Role.DOCTOR,
      });
      await expect(service.listPending(admin.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("allows the call and returns supervisor requests for a valid admin", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.supervisorRequest.findMany.mockResolvedValue([{ id: "req-1" }]);

      const result = await service.listPending(admin.id);

      expect(result).toEqual([{ id: "req-1" }]);
      expect(prisma.supervisorRequest.findMany).toHaveBeenCalledWith({
        where: { status: SupervisorStatus.PENDING },
        orderBy: { createdAt: "asc" },
        include: { applicant: true },
      });
    });
  });

  describe("setBlocked", () => {
    it("blocks a user and reports it", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.user.update.mockResolvedValue({});

      const result = await service.setBlocked("user-9", true, admin.id);

      expect(result).toEqual({ message: "User blocked" });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-9" },
        data: { blocked: true },
      });
    });

    it("refuses non-admin callers", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...admin, role: Role.SUPERVISOR });

      await expect(
        service.setBlocked("user-9", true, admin.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("decideDoctor", () => {
    const pendingRequest = {
      id: "req-1",
      status: DoctorStatus.PENDING,
      applicantId: "applicant-1",
      applicant: { id: "applicant-1", name: "Bob", username: "bob" },
    };

    it("approves a pending doctor request and stores reviewerId = admin.id", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.doctorRequest.findUnique.mockResolvedValue(pendingRequest);

      const result = await service.decideDoctor("req-1", true, undefined, admin.id);

      expect(result).toEqual({ message: "Approved" });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      const operations = prisma.$transaction.mock.calls[0][0];
      expect(operations).toHaveLength(3);

      expect(prisma.doctorRequest.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: expect.objectContaining({
          status: DoctorStatus.APPROVED,
          reviewerId: admin.id,
        }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "applicant-1" },
        data: { doctorStatus: DoctorStatus.APPROVED },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: "applicant-1",
          title: "Doctor request approved",
        }),
      });
    });

    it("rejects with a custom note and writes it to the notification body", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.doctorRequest.findUnique.mockResolvedValue(pendingRequest);

      const result = await service.decideDoctor(
        "req-1",
        false,
        "Need better photo on the ID.",
        admin.id,
      );

      expect(result).toEqual({ message: "Rejected" });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: "applicant-1",
          title: "Doctor request rejected",
          body: "Need better photo on the ID.",
        }),
      });
    });

    it("404s an unknown request", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.doctorRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.decideDoctor("nope", true, undefined, admin.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("refuses to re-decide a request that's already approved", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.doctorRequest.findUnique.mockResolvedValue({
        ...pendingRequest,
        status: DoctorStatus.APPROVED,
      });

      await expect(
        service.decideDoctor("req-1", true, undefined, admin.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("decide (supervisor approval)", () => {
    it("approves a pending supervisor request", async () => {
      prisma.user.findUnique.mockResolvedValue(admin);
      prisma.supervisorRequest.findUnique.mockResolvedValue({
        id: "sup-req-1",
        status: SupervisorStatus.PENDING,
        applicantId: "sup-1",
        applicant: { id: "sup-1", name: "Carol", username: "carol" },
      });

      const result = await service.decide("sup-req-1", true, undefined, admin.id);

      expect(result).toEqual({ message: "Approved" });
      expect(prisma.supervisorRequest.update).toHaveBeenCalledWith({
        where: { id: "sup-req-1" },
        data: expect.objectContaining({
          status: SupervisorStatus.APPROVED,
          reviewerId: admin.id,
        }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "sup-1" },
        data: { supervisorStatus: SupervisorStatus.APPROVED },
      });
    });
  });
});
