import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ArcadeController } from "./arcade.controller";
import { ArcadeService } from "./arcade.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ArcadeController],
  providers: [ArcadeService],
})
export class ArcadeModule {}
