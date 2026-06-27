import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminDashboardStats', () => {
    it('should return mock admin stats', async () => {
      /*
       * Flow: Get Admin Dashboard Stats
       * 1. Call service.getAdminDashboardStats with user ID.
       * 2. Verify it returns mock admin statistics.
       */
      const result = await service.getAdminDashboardStats(1);
      expect(result).toBeDefined();
      expect(result.totalUsers).toBe(1500);
    });
  });

  describe('getStudentDashboardStats', () => {
    it('should return mock student stats', async () => {
      /*
       * Flow: Get Student Dashboard Stats
       * 1. Call service.getStudentDashboardStats with user ID.
       * 2. Verify it returns mock student statistics.
       */
      const result = await service.getStudentDashboardStats(1);
      expect(result).toBeDefined();
      expect(result.learningProgress).toBe(75);
    });
  });

  describe('getTeacherDashboardStats', () => {
    it('should return mock teacher stats', async () => {
      /*
       * Flow: Get Teacher Dashboard Stats
       * 1. Call service.getTeacherDashboardStats with user ID.
       * 2. Verify it returns mock teacher statistics.
       */
      const result = await service.getTeacherDashboardStats(1);
      expect(result).toBeDefined();
      expect(result.totalClasses).toBe(5);
    });
  });
});
