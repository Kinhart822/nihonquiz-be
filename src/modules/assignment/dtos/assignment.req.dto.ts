import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PageOptionsDto } from '../../../shared/dtos/page-option.dto';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  classId!: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowResubmit?: boolean;
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

export class SubmitAssignmentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;
}

export class GradeAssignmentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  feedback?: string;
}

export class AssignmentFilterDto extends PageOptionsDto {}

export class ExtendDeadlineDto {
  @ApiProperty()
  @IsDateString()
  newDueDate!: string;
}
