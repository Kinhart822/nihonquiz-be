import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';

export class CreateMiniQuizDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  lessonId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  timeLimit?: number;
}

export class UpdateMiniQuizDto extends PartialType(CreateMiniQuizDto) {}

export class MiniQuizFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class SubmitMiniQuizDto {
  @ApiProperty({ description: 'Mapping of question ID to answer ID' })
  @IsNotEmpty()
  answers!: Record<number, number>;
}
