import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LessonResDto {
  @ApiProperty({ description: 'Lesson ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Course ID', example: 1 })
  @Expose()
  courseId!: number;

  @ApiProperty({ description: 'Lesson name', example: 'Lesson 1: Greetings' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Lesson description',
    example: 'Learn basic greetings in Japanese',
  })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Order of the lesson', example: 1 })
  @Expose()
  order!: number;

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
