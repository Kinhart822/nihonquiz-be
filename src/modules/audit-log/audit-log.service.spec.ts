import { AuditLogStatus } from '@constants/audit.constant';
import { HttpException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogRepository } from '@repositories/audit-log.repository';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors } from '@shared/exceptions/http-exception';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: jest.Mocked<AuditLogRepository>;

  const mockAuditLogRepo = {
    getAuditLogsWithFilters: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: AuditLogRepository,
          useValue: mockAuditLogRepo,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get(AuditLogRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      /*
       * Flow: Get Audit Logs (Paginated)
       * 1. Mock repository to return paginated logs and total count.
       * 2. Call service.getAuditLogs with filter parameters.
       * 3. Map returned entities into PageDto structure.
       * 4. Verify repository is called with correct parameters.
       */
      // Arrange
      const filterDto = { page: 1, limit: 10 };
      const mockEntities = [{ id: 1, action: 'LOGIN', userId: 123 }];
      const mockTotal = 1;

      repository.getAuditLogsWithFilters.mockResolvedValue({
        entities: mockEntities as any,
        total: mockTotal,
      });

      // Act
      const result = await service.getAuditLogs(filterDto as any);

      // Assert
      expect(repository.getAuditLogsWithFilters).toHaveBeenCalledWith(
        filterDto,
      );
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.currentPage).toBe(1);
    });
  });

  describe('getAuditLogInfo', () => {
    it('should return an audit log by id', async () => {
      /*
       * Flow: Get Audit Log Info (Success)
       * 1. Mock repository to return a specific audit log.
       * 2. Call service.getAuditLogInfo with the log ID.
       * 3. Verify repository is called with correct ID.
       */
      // Arrange
      const mockLog = { id: 1, action: 'LOGIN' };
      repository.findOne.mockResolvedValue(mockLog as any);

      // Act
      const result = await service.getAuditLogInfo(1);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBeDefined();
    });

    it('should throw NOT_FOUND if log does not exist', async () => {
      /*
       * Flow: Get Audit Log Info (Not Found)
       * 1. Mock repository to return null.
       * 2. Call service.getAuditLogInfo with a non-existent log ID.
       * 3. Verify AUDIT_LOG_NOT_FOUND exception is thrown.
       */
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAuditLogInfo(999)).rejects.toThrow(HttpException);
      await expect(service.getAuditLogInfo(999)).rejects.toMatchObject({
        response: {
          errorCode: httpErrors.AUDIT_LOG_NOT_FOUND.code,
        },
      });
    });
  });

  describe('createAuditLog', () => {
    it('should create and save an audit log successfully', async () => {
      /*
       * Flow: Create Audit Log (Success)
       * 1. Create a new audit log entity with request payload.
       * 2. Save the entity to the database.
       * 3. Return the created audit log.
       */
      // Arrange
      const payload = {
        userId: 1,
        endpoint: '/api/test',
        status: AuditLogStatus.SUCCESS,
      };
      const mockCreated = { ...payload, id: 1 };

      repository.create.mockReturnValue(mockCreated as any);
      repository.save.mockResolvedValue(mockCreated as any);

      // Act
      const result = await service.createAuditLog(payload as any);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(payload);
      expect(repository.save).toHaveBeenCalledWith(mockCreated);
      expect(result).toEqual(mockCreated);
    });

    it('should return null and log error if save fails', async () => {
      /*
       * Flow: Create Audit Log (Failure)
       * 1. Mock repository.save to throw an error (e.g., DB connection issue).
       * 2. Call service.createAuditLog.
       * 3. Catch error, log it, and return null instead of crashing.
       */
      // Arrange
      const payload = {
        userId: 1,
        endpoint: '/api/test',
        status: AuditLogStatus.SUCCESS,
      };

      repository.create.mockReturnValue(payload as any);
      repository.save.mockRejectedValue(new Error('DB Error'));

      // Act
      const result = await service.createAuditLog(payload as any);

      // Assert
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
