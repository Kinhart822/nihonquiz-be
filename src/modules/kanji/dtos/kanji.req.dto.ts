import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class KanjiFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class CreateKanjiDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  character!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  onyomi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kunyomi?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  meaning!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  examples?: string;
}

export class UpdateKanjiDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  character?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  onyomi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kunyomi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  meaning?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  examples?: string;
}
