import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { QuestionType } from '@constants/question.constant';

export class AnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  practiceTestId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  miniQuizId?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class QuestionFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  practiceTestId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  miniQuizId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}
