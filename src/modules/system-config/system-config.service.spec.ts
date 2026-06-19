import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigRepository } from '@repositories/system-config.repository';
import {
  httpBadRequest,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { SystemConfigService } from './system-config.service';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let repository: jest.Mocked<SystemConfigRepository>;

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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: SystemConfigRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    repository = module.get(SystemConfigRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should throw an error if config not found', async () => {
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.getConfig('NOT_FOUND_KEY')).rejects.toThrow(
        httpNotFound,
      );
    });

    it('should return config if found', async () => {
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
      const mockConfig = { key: 'EXISTING_KEY', value: 'VAL' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );

      await expect(
        service.createSystemConfig('EXISTING_KEY', 'NEW_VAL'),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should create and save new config', async () => {
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );
      const newConfig = { key: 'NEW_KEY', value: 'NEW_VAL' };
      repository.create.mockReturnValue(newConfig as any);
      repository.save.mockResolvedValue(newConfig as any);

      const result = await service.createSystemConfig('NEW_KEY', 'NEW_VAL');
      expect(repository.create).toHaveBeenCalledWith({
        key: 'NEW_KEY',
        value: 'NEW_VAL',
      });
      expect(repository.save).toHaveBeenCalledWith(newConfig);
      expect(result).toEqual(newConfig);
    });
  });

  describe('updateSystemConfig', () => {
    it('should throw error if config not found', async () => {
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateSystemConfig('NOT_FOUND', 'VAL'),
      ).rejects.toThrow(httpNotFound);
    });

    it('should update and save config', async () => {
      const mockConfig = { key: 'KEY', value: 'OLD_VAL' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );
      repository.save.mockImplementation(async (c) => c as any);

      const result = await service.updateSystemConfig('KEY', 'NEW_VAL');
      expect(result.value).toBe('NEW_VAL');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'NEW_VAL' }),
      );
    });
  });

  describe('deleteSystemConfig', () => {
    it('should throw error if config not found', async () => {
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.deleteSystemConfig('NOT_FOUND')).rejects.toThrow(
        httpNotFound,
      );
    });

    it('should delete config', async () => {
      const mockConfig = { key: 'KEY', value: 'VAL' };
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        mockConfig as any,
      );
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteSystemConfig('KEY');
      expect(repository.delete).toHaveBeenCalledWith({ key: 'KEY' });
      expect(result).toEqual({ affected: 1 });
    });
  });
});
