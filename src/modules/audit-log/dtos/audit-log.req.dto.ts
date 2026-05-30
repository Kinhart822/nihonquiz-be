import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsIP,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { AuditLogStatus } from '@constants/audit.constant';
import { Order } from '@constants/pagination.constant';
import {
  EnumFieldOptional,
  IsUnixTimestamp,
  StringField,
  StringFieldOption,
} from '@shared/decorators/field.decorator';
import { ToArray } from '@shared/decorators/transform.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';

export class DeviceInfoDto {
  @IsObject()
  browser!: any;

  @IsObject()
  os!: any;

  @IsObject()
  device!: any;
}

export class CreateAuditLogDto {
  @IsNumber()
  userId!: number;

  @StringField()
  endpoint!: string;

  @IsUnixTimestamp()
  @IsOptional()
  timestamp: number = Math.floor(new Date().getTime() / 1000);

  @IsIP(4)
  @IsOptional()
  ipAddress?: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsOptional()
  deviceInfo?: DeviceInfoDto;

  @StringField()
  @IsOptional()
  geolocation?: string;

  @StringField()
  @IsOptional()
  note?: string;

  @IsObject()
  details!: any;

  @IsEnum(AuditLogStatus)
  status!: AuditLogStatus;
}

export class AuditLogFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by keyword in endpoint',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @ApiProperty({
    description:
      'List of audit log statuses to filter (IN_PROGRESS, PENDING, SUCCESS, FAILED)',
    example: ['IN_PROGRESS', 'PENDING', 'SUCCESS', 'FAILED'],
    required: false,
    isArray: true,
    enum: AuditLogStatus,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'statuses array cannot be empty' })
  @IsEnum(AuditLogStatus, { each: true })
  @ToArray()
  readonly statuses?: AuditLogStatus[];

  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;

  @StringFieldOption({ required: false, example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @StringFieldOption({ required: false, example: '2024-01-02T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
