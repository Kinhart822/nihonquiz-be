import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AssignmentResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  title!: string;

  @ApiProperty()
  @Expose()
  description!: string;

  @ApiProperty()
  @Expose()
  dueDate!: Date;

  @ApiProperty()
  @Expose()
  classId!: number;

  @ApiProperty()
  @Expose()
  allowResubmit!: boolean;

  @ApiProperty()
  @Expose()
  isClosed!: boolean;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}

export class AssignmentSubmissionResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  assignmentId!: number;

  @ApiProperty()
  @Expose()
  studentId!: number;

  @ApiProperty()
  @Expose()
  content!: string;

  @ApiProperty()
  @Expose()
  fileUrl!: string;

  @ApiProperty()
  @Expose()
  score!: number;

  @ApiProperty()
  @Expose()
  feedback!: string;

  @ApiProperty()
  @Expose()
  gradedAt!: Date;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}

export class AssignmentStatsResDto {
  @ApiProperty()
  @Expose()
  totalStudents!: number;

  @ApiProperty()
  @Expose()
  onTimeCount!: number;

  @ApiProperty()
  @Expose()
  lateCount!: number;

  @ApiProperty()
  @Expose()
  missingCount!: number;
}
