import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { AuthModule } from "../auth/auth.module";
import { SmileStreakController } from "./smile-streak.controller";
import { SmileStreakService } from "./smile-streak.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SmileStreakController],
  providers: [SmileStreakService],
})
export class SmileStreakModule {}
