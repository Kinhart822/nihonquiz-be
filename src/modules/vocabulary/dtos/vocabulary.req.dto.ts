import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VocabularyFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class CreateVocabularyDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  lessonId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  word!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reading?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  meaning!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  example?: string;
}

export class UpdateVocabularyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  word?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reading?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  meaning?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  example?: string;
}
