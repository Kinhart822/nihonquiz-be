import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CourseResDto {
  @ApiProperty({ description: 'Course ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Course name', example: 'N5 Vocabulary' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'Beginner vocabulary for N5',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Course thumbnail URL',
    example: 'https://example.com/thumbnail.png',
  })
  @Expose()
  thumbnail?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
