import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { SupervisorModule } from "./supervisor/supervisor.module";
import { PrismaModule } from "./prisma.module";
import { SeedService } from "./seed.service";
import { AppointmentsModule } from "./appointments/appointments.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ChatModule } from "./chat/chat.module";
import { ProfilesModule } from "./profiles/profiles.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SupervisorModule,
    AppointmentsModule,
    NotificationsModule,
    ChatModule,
    ProfilesModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
