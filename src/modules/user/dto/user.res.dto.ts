import { AccessMethod, RoleUser, UserStatus } from '@constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class UserProfileResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  email!: string;

  @ApiProperty()
  @Expose()
  username!: string;

  @ApiProperty()
  @Expose()
  avatarUrl!: string;

  @ApiProperty()
  @Expose()
  backgroundUrl!: string;

  @ApiProperty()
  @Expose()
  description!: string;

  @ApiProperty({ enum: UserStatus })
  @Expose()
  status!: UserStatus;

  @ApiProperty({ enum: RoleUser })
  @Expose()
  role!: RoleUser;

  @ApiProperty({ enum: AccessMethod })
  @Expose()
  accessMethod!: AccessMethod;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  createdAt!: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  updatedAt!: string;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  deletedAt!: string;
}
