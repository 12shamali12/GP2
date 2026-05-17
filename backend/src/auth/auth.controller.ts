import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("profile")
  profile(@Query("identifier") identifier: string) {
    return this.authService.profile(identifier);
  }

  @Get("register-options")
  registerOptions() {
    return this.authService.registerOptions();
  }

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("resend-supervisor-request")
  resendSupervisor(@Body() dto: LoginDto) {
    return this.authService.resendSupervisorRequest(dto);
  }

  @Post("resend-doctor-request")
  resendDoctor(@Body() dto: LoginDto) {
    return this.authService.resendDoctorRequest(dto);
  }

  @Post("change-password")
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  @Post("update-profile")
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(dto);
  }
}
