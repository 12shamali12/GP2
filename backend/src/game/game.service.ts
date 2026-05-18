import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthUser } from "../auth/jwt-payload";
import { SubmitQuizAttemptDto } from "./dto";
import { QUIZ_QUESTIONS } from "./questions";

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  getQuestions() {
    return QUIZ_QUESTIONS.map(({ correctIndex: _omit, ...rest }) => rest);
  }

  async submitAttempt(user: AuthUser, dto: SubmitQuizAttemptDto) {
    if (user.role !== Role.DOCTOR) {
      throw new ForbiddenException(
        "Only doctors can submit quiz attempts.",
      );
    }
    if (dto.score > dto.total) {
      throw new BadRequestException(
        "score cannot be greater than total.",
      );
    }

    return this.prisma.quizAttempt.create({
      data: {
        doctorId: user.id,
        score: dto.score,
        total: dto.total,
      },
    });
  }

  async listMyAttempts(user: AuthUser) {
    if (user.role !== Role.DOCTOR) {
      throw new ForbiddenException(
        "Only doctors have quiz attempts.",
      );
    }
    return this.prisma.quizAttempt.findMany({
      where: { doctorId: user.id },
      orderBy: { completedAt: "desc" },
      take: 20,
    });
  }
}
