import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsEnum,
} from 'class-validator';
import { PageOptionsDto } from '../../../shared/dtos/page-option.dto';
import { ClassStudentStatus, DayOfWeek } from '@constants/class.constant';

export class CreateClassDto {
  @ApiProperty({ description: 'Class Name', example: 'Math 101' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Class Description',
    example: 'Basic math class',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateClassDto {
  @ApiPropertyOptional({ description: 'Class Name', example: 'Math 101' })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Class Description',
    example: 'Basic math class',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignTeacherDto {
  @ApiProperty({ description: 'Teacher ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  teacherId!: number;
}

export class EnrollStudentDto {
  @ApiProperty({ description: 'Student ID', example: 2 })
  @IsInt()
  @IsNotEmpty()
  studentId!: number;
}

export class JoinClassDto {
  @ApiProperty({ description: 'Class Code', example: 'AB1234' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class CreateClassAnnouncementDto {
  @ApiProperty({
    description: 'Announcement title',
    example: 'Important Notice',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @ApiProperty({
    description: 'Announcement content',
    example: 'Tomorrow class is cancelled.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class CreateClassScheduleDto {
  @ApiProperty({ description: 'Day of week', enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  endTime!: string;

  @ApiPropertyOptional({
    description: 'Room or Meet URL',
    example: 'https://meet.google.com/abc',
  })
  @IsString()
  @IsOptional()
  roomUrl?: string;
}

export class ClassFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by class name or code' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class ClassStudentFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by class name or code' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by student status',
    enum: ClassStudentStatus,
  })
  @IsEnum(ClassStudentStatus)
  @IsOptional()
  status?: ClassStudentStatus;
}

export class GetMyClassesQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search by class name or code' })
  @IsString()
  @IsOptional()
  search?: string;
}
