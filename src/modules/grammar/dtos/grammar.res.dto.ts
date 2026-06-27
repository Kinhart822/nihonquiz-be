import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GrammarResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  lessonId!: number;

  @ApiProperty()
  @Expose()
  structure!: string;

  @ApiProperty()
  @Expose()
  meaning!: string;

  @ApiPropertyOptional()
  @Expose()
  explanation?: string;

  @ApiPropertyOptional()
  @Expose()
  example?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
