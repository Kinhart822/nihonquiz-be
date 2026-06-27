import { DayOfWeek } from '@constants/class.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { UserResDto } from '../../user/dtos/user.res.dto';

export class ClassResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty({ required: false })
  @Expose()
  description!: string | null;

  @ApiProperty()
  @Expose()
  code!: string;

  @ApiProperty()
  @Expose()
  isActive!: boolean;

  @ApiProperty({ required: false })
  @Expose()
  teacherId!: number | null;

  @ApiProperty({ required: false })
  @Expose()
  courseId!: number | null;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  createdAt!: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  updatedAt!: string;
}

export class ClassAnnouncementResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  classId!: number;

  @ApiProperty()
  @Expose()
  title!: string;

  @ApiProperty()
  @Expose()
  content!: string;

  @ApiProperty()
  @Expose()
  authorId!: number;

  @ApiProperty({ type: () => UserResDto })
  @Expose()
  @Type(() => UserResDto)
  author!: UserResDto;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  createdAt!: string;
}

export class ClassScheduleResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  classId!: number;

  @ApiProperty({ enum: DayOfWeek })
  @Expose()
  dayOfWeek!: DayOfWeek;

  @ApiProperty()
  @Expose()
  startTime!: string;

  @ApiProperty()
  @Expose()
  endTime!: string;

  @ApiProperty({ required: false })
  @Expose()
  roomUrl!: string | null;
}

export class ClassStudentResDto {
  @ApiProperty()
  @Expose()
  studentId!: number;

  @ApiProperty()
  @Expose()
  status!: string;

  @ApiProperty({ type: () => UserResDto })
  @Expose()
  @Type(() => UserResDto)
  student!: UserResDto;
}

export class ClassMembersListResDto {
  @ApiProperty({ type: () => UserResDto, nullable: true })
  @Expose()
  @Type(() => UserResDto)
  teacher!: UserResDto | null;

  @ApiProperty()
  @Expose()
  students!: any;
}
