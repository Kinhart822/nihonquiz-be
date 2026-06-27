import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const mockService = {
      getAdminDashboardStats: jest.fn(),
      getStudentDashboardStats: jest.fn(),
      getTeacherDashboardStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminDashboardStats', () => {
    it('should call getAdminDashboardStats on service', async () => {
      /*
       * Flow: Get Admin Dashboard Stats
       * 1. Mock service.getAdminDashboardStats to return mock stats.
       * 2. Call controller.getAdminDashboardStats with user object.
       * 3. Verify service is called with user ID and result is returned.
       */
      const mockResult = { totalUsers: 1500 };
      service.getAdminDashboardStats.mockResolvedValue(mockResult as any);

      const result = await controller.getAdminDashboardStats({ id: 1 } as any);
      expect(service.getAdminDashboardStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStudentDashboardStats', () => {
    it('should call getStudentDashboardStats on service', async () => {
      /*
       * Flow: Get Student Dashboard Stats
       * 1. Mock service.getStudentDashboardStats to return mock stats.
       * 2. Call controller.getStudentDashboardStats with user object.
       * 3. Verify service is called with user ID and result is returned.
       */
      const mockResult = { learningProgress: 75 };
      service.getStudentDashboardStats.mockResolvedValue(mockResult as any);

      const result = await controller.getStudentDashboardStats({
        id: 1,
      } as any);
      expect(service.getStudentDashboardStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getTeacherDashboardStats', () => {
    it('should call getTeacherDashboardStats on service', async () => {
      /*
       * Flow: Get Teacher Dashboard Stats
       * 1. Mock service.getTeacherDashboardStats to return mock stats.
       * 2. Call controller.getTeacherDashboardStats with user object.
       * 3. Verify service is called with user ID and result is returned.
       */
      const mockResult = { totalClasses: 5 };
      service.getTeacherDashboardStats.mockResolvedValue(mockResult as any);

      const result = await controller.getTeacherDashboardStats({
        id: 1,
      } as any);
      expect(service.getTeacherDashboardStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});
