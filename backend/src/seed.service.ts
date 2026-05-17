import { PrismaService } from "./prisma.service";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Role, SupervisorStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const username = process.env.ADMIN_USERNAME?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();
    const email = process.env.ADMIN_EMAIL?.trim();
    const phone = process.env.ADMIN_PHONE?.trim();
    const name = process.env.ADMIN_NAME?.trim() || username;

    if (!username || !password || !email || !phone) {
      this.logger.warn(
        "ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL / ADMIN_PHONE not set — skipping admin seed. See backend/.env.example.",
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.upsert({
      where: { username },
      update: {
        email,
        phone,
        password: passwordHash,
        role: Role.ADMIN,
        supervisorStatus: SupervisorStatus.APPROVED,
        name: name!,
      },
      create: {
        username,
        email,
        phone,
        password: passwordHash,
        role: Role.ADMIN,
        supervisorStatus: SupervisorStatus.APPROVED,
        name: name!,
      },
    });
  }
}
