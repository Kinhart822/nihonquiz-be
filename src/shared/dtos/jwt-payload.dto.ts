import { RoleUser, UserStatus } from '@constants/user.constant';
import { IsEmail, IsEnum, IsInt, IsOptional } from 'class-validator';

export class JwtPayloadDto {
  @IsInt()
  id!: number;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(RoleUser)
  role?: RoleUser;
}
