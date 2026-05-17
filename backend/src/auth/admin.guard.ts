import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import type { Request } from "express";
import type { AuthUser } from "./jwt-payload";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException("Authentication required.");
    }
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only the admin can perform this action.");
    }
    return true;
  }
}
