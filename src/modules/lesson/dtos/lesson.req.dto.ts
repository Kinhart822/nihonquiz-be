import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({
    description: 'Course ID',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId!: number;

  @ApiProperty({
    description: 'Lesson name',
    example: 'Lesson 1: Greetings',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Lesson description',
    example: 'Learn basic greetings in Japanese',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Order of the lesson',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({
    description: 'Course ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId?: number;

  @ApiPropertyOptional({
    description: 'Lesson name',
    example: 'Lesson 1: Greetings',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Lesson description',
    example: 'Learn basic greetings in Japanese',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Order of the lesson',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class LessonFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Search by lesson name',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
