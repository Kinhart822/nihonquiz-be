import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { QuestionType } from '@constants/question.constant';

export class AnswerResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  content!: string;

  @ApiProperty()
  @Expose()
  isCorrect!: boolean;
}

export class QuestionResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiPropertyOptional()
  @Expose()
  practiceTestId!: number | null;

  @ApiPropertyOptional()
  @Expose()
  miniQuizId!: number | null;

  @ApiProperty()
  @Expose()
  content!: string;

  @ApiProperty({ enum: QuestionType })
  @Expose()
  type!: QuestionType;

  @ApiProperty()
  @Expose()
  score!: number;

  @ApiPropertyOptional()
  @Expose()
  explanation!: string | null;

  @ApiProperty({ type: [AnswerResDto] })
  @Expose()
  @Type(() => AnswerResDto)
  answers!: AnswerResDto[];

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}
