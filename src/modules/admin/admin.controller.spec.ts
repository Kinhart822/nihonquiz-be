import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockAdminService = {
      getAccountHistoryList: jest.fn(),
      getAccountHistoryInfo: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      deleteUser: jest.fn(),
      getAdminList: jest.fn(),
      getAdminInfo: jest.fn(),
      createAdmin: jest.fn(),
      updateAdmin: jest.fn(),
      deleteAdmin: jest.fn(),
      getAdminDashboardStats: jest.fn(),
      sendSystemNotification: jest.fn(),
    };

    const mockAuditLogService = {
      getAuditLogs: jest.fn(),
      getAuditLogInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Account History', () => {
    it('should call getAccountHistoryList', async () => {
      /*
       * Flow: Get Account History List
       * 1. Mock getAccountHistoryList to return a paginated list.
       * 2. Call controller with query parameters.
       * 3. Verify service is called with the correct parameters.
       */
      adminService.getAccountHistoryList.mockResolvedValue({} as any);
      const result = await controller.getAccountHistoryList({ skip: 0 } as any);
      expect(adminService.getAccountHistoryList).toHaveBeenCalledWith({
        skip: 0,
      });
      expect(result).toEqual({});
    });

    it('should call getAccountHistoryInfo', async () => {
      /*
       * Flow: Get Account History Details
       * 1. Mock getAccountHistoryInfo to return details.
       * 2. Call controller with history ID.
       * 3. Verify service is called with correct ID.
       */
      adminService.getAccountHistoryInfo.mockResolvedValue({} as any);
      const result = await controller.getAccountHistoryInfo(1);
      expect(adminService.getAccountHistoryInfo).toHaveBeenCalledWith(1);
      expect(result).toEqual({});
    });
  });

  describe('Audit Logs', () => {
    it('should call getAuditLogs', async () => {
      /*
       * Flow: Get Audit Logs
       * 1. Mock getAuditLogs to return a paginated list.
       * 2. Call controller with query parameters.
       * 3. Verify auditLogService is called with correct DTO.
       */
      auditLogService.getAuditLogs.mockResolvedValue({} as any);
      const result = await controller.getAuditLogs({ skip: 0 } as any);
      expect(auditLogService.getAuditLogs).toHaveBeenCalledWith({ skip: 0 });
      expect(result).toEqual({});
    });

    it('should call getAuditLogInfo', async () => {
      /*
       * Flow: Get Audit Log Details
       * 1. Mock getAuditLogInfo to return details.
       * 2. Call controller with audit log ID.
       * 3. Verify auditLogService is called with correct ID.
       */
      auditLogService.getAuditLogInfo.mockResolvedValue({} as any);
      const result = await controller.getAuditLogInfo(1);
      expect(auditLogService.getAuditLogInfo).toHaveBeenCalledWith(1);
      expect(result).toEqual({});
    });
  });

  describe('User Management', () => {
    const mockUser = { id: 1 };

    it('should call blockUser', async () => {
      /*
       * Flow: Block User
       * 1. Mock blockUser to return true.
       * 2. Call controller with target user ID and action DTO.
       * 3. Verify adminService is called with admin ID, user ID, and reason.
       */
      adminService.blockUser.mockResolvedValue(true);
      const result = await controller.blockUser(mockUser as any, 2, {
        reason: 'spam',
      });
      expect(adminService.blockUser).toHaveBeenCalledWith(1, 2, {
        reason: 'spam',
      });
      expect(result).toBe(true);
    });

    it('should call unblockUser', async () => {
      /*
       * Flow: Unblock User
       * 1. Mock unblockUser to return true.
       * 2. Call controller with target user ID and action DTO.
       * 3. Verify adminService is called with admin ID, user ID, and reason.
       */
      adminService.unblockUser.mockResolvedValue(true);
      const result = await controller.unblockUser(mockUser as any, 2, {
        reason: 'forgiven',
      });
      expect(adminService.unblockUser).toHaveBeenCalledWith(1, 2, {
        reason: 'forgiven',
      });
      expect(result).toBe(true);
    });

    it('should call deleteUser', async () => {
      /*
       * Flow: Delete User
       * 1. Mock deleteUser to return true.
       * 2. Call controller with target user ID and action DTO.
       * 3. Verify adminService is called with admin ID, user ID, and reason.
       */
      adminService.deleteUser.mockResolvedValue(true);
      const result = await controller.deleteUser(mockUser as any, 2, {
        reason: 'spam',
      });
      expect(adminService.deleteUser).toHaveBeenCalledWith(1, 2, {
        reason: 'spam',
      });
      expect(result).toBe(true);
    });
  });

  describe('Admin Management', () => {
    it('should call getAdminList', async () => {
      /*
       * Flow: Get Admin List
       * 1. Mock getAdminList to return a paginated list.
       * 2. Call controller with query DTO.
       * 3. Verify adminService is called with correct DTO.
       */
      adminService.getAdminList.mockResolvedValue({} as any);
      const result = await controller.getAdminList({ skip: 0 } as any);
      expect(adminService.getAdminList).toHaveBeenCalledWith({ skip: 0 });
      expect(result).toEqual({});
    });

    it('should call getAdminInfo', async () => {
      /*
       * Flow: Get Admin Info
       * 1. Mock getAdminInfo to return admin details.
       * 2. Call controller with admin ID.
       * 3. Verify adminService is called with correct ID.
       */
      adminService.getAdminInfo.mockResolvedValue({} as any);
      const result = await controller.getAdminInfo(1);
      expect(adminService.getAdminInfo).toHaveBeenCalledWith(1);
      expect(result).toEqual({});
    });

    it('should call createAdmin', async () => {
      /*
       * Flow: Create Admin
       * 1. Mock createAdmin to return new admin ID.
       * 2. Call controller with admin creation DTO.
       * 3. Verify adminService is called with correct DTO.
       */
      const mockResult = { id: 1 };
      adminService.createAdmin.mockResolvedValue(mockResult as any);
      const dto = { email: 'test@test.com', username: 'test', password: 'pw' };
      const result = await controller.createAdmin(dto);
      expect(adminService.createAdmin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('should call updateAdmin', async () => {
      /*
       * Flow: Update Admin
       * 1. Mock updateAdmin to return updated admin details.
       * 2. Call controller with target admin ID and update DTO.
       * 3. Verify adminService is called with correct ID and DTO.
       */
      const mockResult = { id: 1 };
      adminService.updateAdmin.mockResolvedValue(mockResult as any);
      const dto = { username: 'test2' };
      const result = await controller.updateAdmin(1, dto);
      expect(adminService.updateAdmin).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
    });

    it('should call deleteAdmin', async () => {
      /*
       * Flow: Delete Admin
       * 1. Mock deleteAdmin to return true.
       * 2. Call controller with target admin ID.
       * 3. Verify adminService is called with correct ID.
       */
      adminService.deleteAdmin.mockResolvedValue(true);
      const result = await controller.deleteAdmin(1);
      expect(adminService.deleteAdmin).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('Dashboard & Notifications', () => {
    it('should call sendSystemNotification', async () => {
      /*
       * Flow: Send System Notification
       * 1. Mock sendSystemNotification to return true.
       * 2. Call controller with sender (admin) ID and notification DTO.
       * 3. Verify adminService is called with correct parameters.
       */
      adminService.sendSystemNotification.mockResolvedValue(true);
      const dto = { content: 'test' };
      const result = await controller.sendSystemNotification(
        { id: 1 } as any,
        dto,
      );
      expect(adminService.sendSystemNotification).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(true);
    });
  });
});
