import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';

export class CreatePracticeTestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  timeLimit!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jlptLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePracticeTestDto extends PartialType(CreatePracticeTestDto) {}

export class PracticeTestFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jlptLevel?: string;
}

export class SubmitPracticeTestDto {
  @ApiProperty({
    description: 'A map of questionId to answerId',
    example: { 1: 3, 2: 4 },
  })
  @IsNotEmpty()
  answers!: Record<string, number>;
}
