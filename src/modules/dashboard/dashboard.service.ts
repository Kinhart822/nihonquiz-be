import { Injectable } from '@nestjs/common';
import {
  AdminDashboardResDto,
  StudentDashboardResDto,
  TeacherDashboardResDto,
} from './dtos/dashboard.res.dto';

@Injectable()
export class DashboardService {
  constructor() {}

  // ==================== ADMIN ====================
  async getAdminDashboardStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adminId: number,
  ): Promise<AdminDashboardResDto> {
    await Promise.resolve();
    return {
      totalUsers: 1500,
      totalTeachers: 50,
      totalClasses: 120,
      totalLessons: 450,
      totalAssignments: 1200,
      totalTests: 300,
    };
  }

  // ==================== STUDENT ====================
  async getStudentDashboardStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    studentId: number,
  ): Promise<StudentDashboardResDto> {
    await Promise.resolve();
    return {
      learningProgress: 75,
      totalVocabulary: 1200,
      totalGrammar: 150,
      totalKanji: 400,
      upcomingAssignments: 3,
      upcomingTests: 1,
    };
  }

  // ==================== TEACHER ====================
  async getTeacherDashboardStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    teacherId: number,
  ): Promise<TeacherDashboardResDto> {
    await Promise.resolve();
    return {
      totalClasses: 5,
      totalStudents: 150,
      pendingAssignments: 25,
      recentSubmissions: 40,
    };
  }
}
