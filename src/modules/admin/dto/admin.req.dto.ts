import { Order } from '@constants/pagination.constant';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  EnumFieldOptional,
  StringField,
} from '@shared/decorators/field.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserFilterDto } from '../../user/dto/user.req.dto';

export class CreateDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @StringField()
  password!: string;

  @ApiProperty()
  @StringField()
  username!: string;

  @IsOptional()
  @ApiProperty()
  @StringField()
  description?: string;
}

export class EditDto {
  @IsOptional()
  @ApiProperty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ApiProperty()
  @StringField()
  password?: string;

  @IsOptional()
  @ApiProperty()
  @StringField()
  username?: string;

  @IsOptional()
  @ApiProperty()
  @StringField()
  description?: string;
}

export class CreateTeacherDto extends PartialType(CreateDto) {}
export class CreateAdminDto extends PartialType(CreateDto) {}

export class EditTeacherDto extends PartialType(EditDto) {}
export class EditAdminDto extends PartialType(EditDto) {}

export class ActionDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  reason?: string;
}

export class AccountHistoryFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by keyword in reason',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filter by type (REGISTER, SIGN_IN, BLOCKED, UNBLOCKED, DELETED)',
    required: false,
    type: String,
  })
  type?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filter by status (ACTIVE, INACTIVE, BLOCKED, DELETED)',
    required: false,
    type: String,
  })
  status?: string;

  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;
}

export class AdminFilterDto extends UserFilterDto {}

export class SystemNotificationDto {
  @ApiProperty({ description: 'Notification message content' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
