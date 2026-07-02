import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { SystemConfigStatus } from '@constants/system-config.constant';

export class SystemConfigResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  key!: string;

  @ApiProperty()
  @Expose()
  value!: any;

  @ApiProperty({ enum: SystemConfigStatus })
  @Expose()
  status!: SystemConfigStatus;

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
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  deletedAt!: string;
}
