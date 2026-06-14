import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";
import { Role } from "@prisma/client";

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^07\d{8}$/, { message: "Phone must start with 07 and be 10 digits." })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  age?: number;

  @IsOptional()
  gender?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  doctorIdNumber?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email, phone, or username

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email, phone, or username

  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email, phone, or username

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^07\d{8}$/, { message: "Phone must start with 07 and be 10 digits." })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  doctorIdNumber?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
