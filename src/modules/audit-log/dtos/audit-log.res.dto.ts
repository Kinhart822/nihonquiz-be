import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsIP,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { AuditLogStatus } from '@constants/audit.constant';
import { ApiProperty } from '@nestjs/swagger';
import { IsUnixTimestamp } from '@shared/decorators/field.decorator';

export class DeviceInfoDto {
  @ApiProperty({
    type: Object,
    description: 'Browser',
  })
  @Expose()
  browser!: any;

  @ApiProperty({
    type: Object,
    description: 'OS',
  })
  @Expose()
  os!: any;

  @ApiProperty({
    type: Object,
    description: 'Device',
  })
  @Expose()
  device!: any;
}

export class AuditLogResDto {
  @ApiProperty({
    type: Number,
    description: 'Log ID',
  })
  @Expose()
  id!: number;

  @ApiProperty({
    type: Number,
    description: 'User ID',
  })
  @Expose()
  userId!: number;

  @ApiProperty({
    type: String,
    description: 'Endpoint',
  })
  @Expose()
  endpoint!: string;

  @ApiProperty({
    type: Number,
    description: 'Timestamp',
  })
  @Expose()
  @IsUnixTimestamp()
  timestamp!: number;

  @ApiProperty({
    type: String,
    description: 'IP Address',
  })
  @Expose()
  @IsIP(4)
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    type: DeviceInfoDto,
    description: 'Device Info',
  })
  @Expose()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsOptional()
  deviceInfo?: DeviceInfoDto;

  @ApiProperty({
    type: String,
    description: 'Geolocation',
  })
  @Expose()
  @IsOptional()
  geolocation?: string;

  @ApiProperty({
    type: String,
    description: 'Note',
  })
  @Expose()
  @IsOptional()
  note?: string;

  @ApiProperty({
    type: Object,
    description: 'Details',
  })
  @Expose()
  @IsObject()
  details!: any;

  @ApiProperty({
    enum: AuditLogStatus,
    description: 'Status',
  })
  @Expose()
  @IsEnum(AuditLogStatus)
  status!: AuditLogStatus;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
