import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import {
  CreateConfigRequestDto,
  SystemConfigFilterDto,
  UpdateConfigRequestDto,
} from './dto/system-config.req.dto';
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
      const mockResult = { key: 'KEY', value: 'VAL' };
      service.getConfig.mockResolvedValue(mockResult as any);

      const result = await controller.getConfig('KEY');
      expect(service.getConfig).toHaveBeenCalledWith('KEY');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getSystemConfigs', () => {
    it('should call getSystemConfigs on service', async () => {
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
      const mockResult = { affected: 1 };
      service.deleteSystemConfig.mockResolvedValue(mockResult as any);

      const result = await controller.deleteSystemConfig('KEY');
      expect(service.deleteSystemConfig).toHaveBeenCalledWith('KEY');
      expect(result).toEqual(mockResult);
    });
  });
});
