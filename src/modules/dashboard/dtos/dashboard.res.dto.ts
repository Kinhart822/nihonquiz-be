import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardResDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  totalTeachers!: number;

  @ApiProperty()
  totalClasses!: number;

  @ApiProperty()
  totalLessons!: number;

  @ApiProperty()
  totalAssignments!: number;

  @ApiProperty()
  totalTests!: number;
}

export class StudentDashboardResDto {
  @ApiProperty()
  learningProgress!: number;

  @ApiProperty()
  totalVocabulary!: number;

  @ApiProperty()
  totalGrammar!: number;

  @ApiProperty()
  totalKanji!: number;

  @ApiProperty()
  upcomingAssignments!: number;

  @ApiProperty()
  upcomingTests!: number;
}

export class TeacherDashboardResDto {
  @ApiProperty()
  totalClasses!: number;

  @ApiProperty()
  totalStudents!: number;

  @ApiProperty()
  pendingAssignments!: number;

  @ApiProperty()
  recentSubmissions!: number;
}
