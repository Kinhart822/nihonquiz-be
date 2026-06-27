import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import {
  CreateConfigRequestDto,
  SystemConfigFilterDto,
  UpdateConfigRequestDto,
} from './dtos/system-config.req.dto';
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor';

describe('SystemConfigController', () => {
  let controller: SystemConfigController;
  let service: jest.Mocked<SystemConfigService>;

  beforeEach(async () => {
    const mockService = {
      getConfig: jest.fn(),
      getSystemConfigs: jest.fn(),
      createSystemConfig: jest.fn(),
      updateSystemConfig: jest.fn(),
      deleteSystemConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigController],
      providers: [
        {
          provide: SystemConfigService,
          useValue: mockService,
        },
      ],
    })
      .overrideInterceptor(AuditLogInterceptor)
      .useValue({ intercept: (context: any, next: any) => next.handle() })
      .compile();

    controller = module.get<SystemConfigController>(SystemConfigController);
    service = module.get(SystemConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConfig', () => {
    it('should call getConfig on service', async () => {
      /*
       * Flow: Get Config By Key
       * 1. Mock service.getConfig to return a config object.
       * 2. Call controller.getConfig with the specified key.
       * 3. Verify service method is called with correct key.
       */
      const mockResult = { key: 'KEY', value: 'VAL' };
      service.getConfig.mockResolvedValue(mockResult as any);

      const result = await controller.getConfig('KEY');
      expect(service.getConfig).toHaveBeenCalledWith('KEY');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getSystemConfigs', () => {
    it('should call getSystemConfigs on service', async () => {
      /*
       * Flow: Get Paginated Configs
       * 1. Mock service.getSystemConfigs to return paginated result.
       * 2. Call controller.getSystemConfigs with filter DTO.
       * 3. Verify service method is called with correct DTO.
       */
      const mockResult = { data: [], meta: {} };
      service.getSystemConfigs.mockResolvedValue(mockResult as any);

      const filter: SystemConfigFilterDto = { skip: 0, take: 10 } as any;
      const result = await controller.getSystemConfigs(filter);
      expect(service.getSystemConfigs).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockResult);
    });
  });

  describe('createSystemConfig', () => {
    it('should call createSystemConfig on service', async () => {
      /*
       * Flow: Create Config
       * 1. Mock service.createSystemConfig to return new config object.
       * 2. Call controller.createSystemConfig with creation DTO.
       * 3. Verify service method is called with correct parameters.
       */
      const mockResult = { key: 'KEY', value: 'VAL' };
      service.createSystemConfig.mockResolvedValue(mockResult as any);

      const dto: CreateConfigRequestDto = { key: 'KEY', value: 'VAL' };
      const result = await controller.createSystemConfig(dto);
      expect(service.createSystemConfig).toHaveBeenCalledWith('KEY', 'VAL');
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateSystemConfig', () => {
    it('should call updateSystemConfig on service', async () => {
      /*
       * Flow: Update Config
       * 1. Mock service.updateSystemConfig to return updated config object.
       * 2. Call controller.updateSystemConfig with update DTO.
       * 3. Verify service method is called with correct parameters.
       */
      const mockResult = { key: 'KEY', value: 'NEW_VAL' };
      service.updateSystemConfig.mockResolvedValue(mockResult as any);

      const dto: UpdateConfigRequestDto = { key: 'KEY', value: 'NEW_VAL' };
      const result = await controller.updateSystemConfig(dto);
      expect(service.updateSystemConfig).toHaveBeenCalledWith('KEY', 'NEW_VAL');
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteSystemConfig', () => {
    it('should call deleteSystemConfig on service', async () => {
      /*
       * Flow: Delete Config
       * 1. Mock service.deleteSystemConfig to return deletion result.
       * 2. Call controller.deleteSystemConfig with config key.
       * 3. Verify service method is called with correct key.
       */
      const mockResult = { affected: 1 };
      service.deleteSystemConfig.mockResolvedValue(mockResult as any);

      const result = await controller.deleteSystemConfig('KEY');
      expect(service.deleteSystemConfig).toHaveBeenCalledWith('KEY');
      expect(result).toEqual(mockResult);
    });
  });
});
