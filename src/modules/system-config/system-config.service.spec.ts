import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigRepository } from '@repositories/system-config.repository';
import {
  httpBadRequest,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { SystemConfigService } from './system-config.service';
import { getQueueToken } from '@nestjs/bullmq';
import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let repository: jest.Mocked<SystemConfigRepository>;
  let queue: any;

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      getSystemConfigsWithFilters: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      createEntity: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntitiesByCondition: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: SystemConfigRepository,
          useValue: mockRepository,
        },
        {
          provide: getQueueToken(FILE_UPLOAD_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    repository = module.get(SystemConfigRepository);
    queue = module.get(getQueueToken(FILE_UPLOAD_QUEUE));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    /*
     * Flow: should be defined
     * 1. Setup mock data and dependencies.
     * 2. Execute the method under test.
     * 3. Verify the expected results and behavior.
     */
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should throw an error if config not found', async () => {
      /*
       * Flow: Get Config (Not Found)
       * 1. Query SystemConfig table by key.
       * 2. If null is returned, throw NotFound exception.
       */
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.getConfig('NOT_FOUND_KEY')).rejects.toThrow(
        httpNotFound,
      );
    });

    it('should return config if found', async () => {
      /*
       * Flow: Get Config (Success)
       * 1. Query SystemConfig table by key.
       * 2. Return the retrieved configuration object.
       */
      const mockConfig = { key: 'TEST_KEY', value: 'TEST_VALUE' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );

      const result = await service.getConfig('TEST_KEY');
      expect(result.key).toBe('TEST_KEY');
    });
  });

  describe('getSystemConfigs', () => {
    it('should return paginated configs', async () => {
      /*
       * Flow: Get System Configs (Paginated)
       * 1. Call repository method to fetch configs with pagination.
       * 2. Format result into a PageDto containing data and meta.
       */
      const mockEntities = [
        { key: 'KEY1', value: 'VAL1' },
        { key: 'KEY2', value: 'VAL2' },
      ];
      repository.getSystemConfigsWithFilters.mockResolvedValue({
        entities: mockEntities as any,
        total: 2,
      });

      const result = await service.getSystemConfigs({
        skip: 0,
        take: 10,
      } as any);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('createSystemConfig', () => {
    it('should throw error if config already exists', async () => {
      /*
       * Flow: Create Config (Already Exists)
       * 1. Query DB to check if key already exists.
       * 2. If key exists, throw BadRequest exception to prevent duplicates.
       */
      const mockConfig = { key: 'EXISTING_KEY', value: 'VAL' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );

      await expect(
        service.createSystemConfig('EXISTING_KEY', 'NEW_VAL'),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should create and save new config', async () => {
      /*
       * Flow: Create Config (Success)
       * 1. Check DB to ensure key is unique.
       * 2. Create new SystemConfig entity.
       * 3. Save to database.
       */
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );
      const newConfig = { key: 'NEW_KEY', value: 'NEW_VAL' };
      repository.createEntity.mockResolvedValue(newConfig as any);

      const result = await service.createSystemConfig('NEW_KEY', 'NEW_VAL');
      expect(repository.createEntity).toHaveBeenCalledWith({
        key: 'NEW_KEY',
        value: 'NEW_VAL',
      });
      expect(result).toEqual(newConfig);
    });
  });

  describe('updateSystemConfig', () => {
    it('should throw error if config not found', async () => {
      /*
       * Flow: Update Config (Not Found)
       * 1. Query DB for existing config by key.
       * 2. If null, throw NotFound exception.
       */
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateSystemConfig('NOT_FOUND', 'VAL'),
      ).rejects.toThrow(httpNotFound);
    });

    it('should update and save config', async () => {
      /*
       * Flow: Update Config (Success)
       * 1. Query DB for existing config by key.
       * 2. Update the config value.
       * 3. Save the updated entity to the database.
       */
      const mockConfig = { key: 'KEY', value: 'OLD_VAL' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );
      repository.updateEntity.mockResolvedValue({
        ...mockConfig,
        value: 'NEW_VAL',
      } as any);

      const result = await service.updateSystemConfig('KEY', 'NEW_VAL');
      expect(result.value).toBe('NEW_VAL');
      expect(repository.updateEntity).toHaveBeenCalledWith(mockConfig, {
        value: 'NEW_VAL',
      });
    });
  });

  describe('deleteSystemConfig', () => {
    it('should throw error if config not found', async () => {
      /*
       * Flow: Delete Config (Not Found)
       * 1. Query DB for existing config.
       * 2. If null, throw NotFound exception.
       */
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.deleteSystemConfig('NOT_FOUND')).rejects.toThrow(
        httpNotFound,
      );
    });

    it('should delete config', async () => {
      /*
       * Flow: Delete Config (Success)
       * 1. Verify config exists in DB.
       * 2. Perform hard delete on the configuration record.
       */
      const mockConfig = { key: 'KEY', value: 'VAL' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );
      repository.deleteEntitiesByCondition.mockResolvedValue({
        affected: 1,
      } as any);

      const result = await service.deleteSystemConfig('KEY');
      expect(repository.deleteEntitiesByCondition).toHaveBeenCalledWith({
        key: 'KEY',
      });
      expect(result).toEqual({ affected: 1 });
    });
  });
});
