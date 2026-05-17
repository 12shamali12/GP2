import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminGuard } from "./admin.guard";

function makeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

describe("AdminGuard", () => {
  const guard = new AdminGuard();

  it("rejects requests without an authenticated user", () => {
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it("rejects authenticated non-admin roles", () => {
    expect(() =>
      guard.canActivate(
        makeContext({ id: "u1", username: "alice", role: Role.SUPERVISOR }),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(
        makeContext({ id: "u2", username: "bob", role: Role.DOCTOR }),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(
        makeContext({ id: "u3", username: "pat", role: Role.PATIENT }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows ADMIN role through", () => {
    expect(
      guard.canActivate(
        makeContext({ id: "admin-1", username: "prof.shamali", role: Role.ADMIN }),
      ),
    ).toBe(true);
  });
});
