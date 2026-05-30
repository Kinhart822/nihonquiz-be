import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class RegisterResDto {
  @ApiProperty({
    type: Number,
    description: 'User ID',
  })
  @Expose({ name: 'id' })
  userId!: number;

  @ApiProperty({
    type: String,
    description: 'Username',
  })
  @Expose()
  username!: string;

  @ApiProperty({
    type: String,
    description: 'Email',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    type: String,
    description: 'Status',
  })
  @Expose()
  status!: string;

  @Exclude()
  role!: string;

  @Exclude()
  password!: string;

  @Exclude()
  accessMethod!: string;
}

export class LoginResDto {
  @ApiProperty({
    type: String,
    description: 'Access token',
  })
  accessToken!: string;

  @ApiProperty({
    type: String,
    description: 'Refresh token',
  })
  refreshToken!: string;

  @ApiProperty({
    type: String,
    description: 'User ID',
  })
  userId!: number;
}

export class RefreshTokenResDto {
  @ApiProperty({
    type: String,
    description: 'Access token',
  })
  accessToken!: string;

  @ApiProperty({
    type: String,
    description: 'Refresh token',
  })
  refreshToken!: string;
}
