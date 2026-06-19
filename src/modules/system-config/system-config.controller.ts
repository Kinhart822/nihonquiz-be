import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor';
import {
  CreateConfigRequestDto,
  SystemConfigFilterDto,
  UpdateConfigRequestDto,
} from './dto/system-config.req.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get(':key')
  @ApiOperation({
    summary: 'Get config by key',
    description: 'Retrieves a system configuration value by its unique key.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System config retrieved successfully',
  })
  async getConfig(@Param('key') key: string) {
    return this.systemConfigService.getConfig(key);
  }

  @Get('list')
  @ApiOperation({
    summary: 'Get all configs',
    description: 'Returns a paginated list of all system configurations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System configs list retrieved successfully',
  })
  async getSystemConfigs(@Query() filter: SystemConfigFilterDto) {
    return this.systemConfigService.getSystemConfigs(filter);
  }

  @Post()
  @ApiOperation({
    summary: 'Create config',
    description: 'Creates a new system configuration key-value pair.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'System config created successfully',
  })
  @UseInterceptors(AuditLogInterceptor)
  async createSystemConfig(@Body() dto: CreateConfigRequestDto) {
    return this.systemConfigService.createSystemConfig(dto.key, dto.value);
  }

  @Put()
  @ApiOperation({
    summary: 'Update config',
    description: 'Updates the value of an existing system configuration key.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System config updated successfully',
  })
  @UseInterceptors(AuditLogInterceptor)
  async updateSystemConfig(@Body() dto: UpdateConfigRequestDto) {
    return this.systemConfigService.updateSystemConfig(dto.key, dto.value);
  }

  @Delete(':key')
  @ApiOperation({
    summary: 'Delete config',
    description: 'Deletes a system configuration by its key.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System config deleted successfully',
  })
  @UseInterceptors(AuditLogInterceptor)
  async deleteSystemConfig(@Param('key') key: string) {
    return this.systemConfigService.deleteSystemConfig(key);
  }
}
