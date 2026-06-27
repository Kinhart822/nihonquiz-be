import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VocabularyResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  lessonId!: number;

  @ApiProperty()
  @Expose()
  word!: string;

  @ApiPropertyOptional()
  @Expose()
  reading?: string;

  @ApiProperty()
  @Expose()
  meaning!: string;

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
