import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AccountHistoryResDto {
  @ApiProperty({
    type: Number,
    description: 'User ID',
  })
  @Expose({ name: 'id' })
  userId!: number;

  @ApiProperty({
    type: String,
    description: 'Reason',
  })
  @Expose()
  reason!: string;

  @ApiProperty({
    type: String,
    description: 'Status',
  })
  @Expose()
  status!: string;

  @ApiProperty({
    type: Number,
    description: 'User ID',
  })
  @Expose()
  actionBy!: number;

  @ApiProperty({
    type: String,
    description: 'Type',
  })
  @Expose()
  type!: string;
}
