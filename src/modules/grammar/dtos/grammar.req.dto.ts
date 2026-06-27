import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GrammarFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class CreateGrammarDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  lessonId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  structure!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  meaning!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  example?: string;
}

export class UpdateGrammarDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  structure?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  meaning?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  example?: string;
}
