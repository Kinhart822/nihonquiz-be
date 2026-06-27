import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course name',
    example: 'N5 Vocabulary',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'Beginner vocabulary for N5',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: 'Course name',
    example: 'N5 Vocabulary',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'Beginner vocabulary for N5',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CourseFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Search by course name',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
