import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class KanjiResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  character!: string;

  @ApiPropertyOptional()
  @Expose()
  onyomi?: string;

  @ApiPropertyOptional()
  @Expose()
  kunyomi?: string;

  @ApiProperty()
  @Expose()
  meaning!: string;

  @ApiPropertyOptional()
  @Expose()
  examples?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
