import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}
