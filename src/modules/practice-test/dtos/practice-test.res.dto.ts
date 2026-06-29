import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class PracticeTestResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  title!: string;

  @ApiPropertyOptional()
  @Expose()
  description!: string | null;

  @ApiProperty()
  @Expose()
  timeLimit!: number;

  @ApiPropertyOptional()
  @Expose()
  jlptLevel!: string | null;

  @ApiProperty()
  @Expose()
  isActive!: boolean;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}

export class TestAttemptResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  practiceTestId!: number;

  @ApiProperty()
  @Expose()
  score!: number;

  @ApiProperty()
  @Expose()
  totalScore!: number;

  @ApiProperty()
  @Expose()
  completedAt!: Date;

  @ApiProperty()
  @Expose()
  details!: Record<string, any>;
}

export class UserBriefDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiPropertyOptional()
  @Expose()
  email!: string;

  @ApiPropertyOptional()
  @Expose()
  username!: string | null;

  @ApiPropertyOptional()
  @Expose()
  avatarUrl!: string | null;
}

export class StudentResultResDto extends TestAttemptResDto {
  @ApiProperty({ type: UserBriefDto })
  @Expose()
  @Type(() => UserBriefDto)
  user!: UserBriefDto;
}

export class PracticeTestAnalyticsResDto {
  @ApiProperty()
  @Expose()
  averageScore!: number;

  @ApiProperty()
  @Expose()
  highestScore!: number;

  @ApiProperty()
  @Expose()
  lowestScore!: number;

  @ApiProperty()
  @Expose()
  totalAttempts!: number;
}
