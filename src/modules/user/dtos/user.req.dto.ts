import { Order } from '@constants/pagination.constant';
import { UserStatus } from '@constants/user.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnumFieldOptional } from '@shared/decorators/field.decorator';
import { ToArray } from '@shared/decorators/transform.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by keyword in username or email',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @ApiProperty({
    description:
      'List of conversation statuses to filter (ACTIVE, INACTIVE, BLOCKED, DELETED)',
    example: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED'],
    required: false,
    isArray: true,
    enum: UserStatus,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'statuses array cannot be empty' })
  @IsEnum(UserStatus, { each: true })
  @ToArray()
  readonly statuses?: UserStatus[];

  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'New username (3-30 characters)',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must be at most 30 characters' })
  username?: string;

  @ApiPropertyOptional({
    description: 'New description/bio (max 500 characters)',
    example: 'Hello, I am using ChatApp!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'oldpass123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  oldPassword!: string;

  @ApiProperty({ description: 'New password', example: 'newpass123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}
