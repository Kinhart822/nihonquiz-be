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
} from './dtos/system-config.req.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  // ==================== GET INFO ====================
  @Get(':key')
  @ApiOperation({ summary: 'Get config by key' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System config retrieved successfully',
  })
  async getConfig(@Param('key') key: string) {
    return this.systemConfigService.getConfig(key);
  }

  // ==================== GET LIST ====================
  @Get('list')
  @ApiOperation({ summary: 'Get all configs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System configs list retrieved successfully',
  })
  async getSystemConfigs(@Query() filter: SystemConfigFilterDto) {
    return this.systemConfigService.getSystemConfigs(filter);
  }

  // ==================== CREATE ====================
  @Post()
  @ApiOperation({ summary: 'Create config' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'System config created successfully',
  })
  @UseInterceptors(AuditLogInterceptor)
  async createSystemConfig(@Body() dto: CreateConfigRequestDto) {
    return this.systemConfigService.createSystemConfig(dto.key, dto.value);
  }

  // ==================== UPDATE ====================
  @Put()
  @ApiOperation({ summary: 'Update config' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System config updated successfully',
  })
  @UseInterceptors(AuditLogInterceptor)
  async updateSystemConfig(@Body() dto: UpdateConfigRequestDto) {
    return this.systemConfigService.updateSystemConfig(dto.key, dto.value);
  }

  // ==================== DELETE ====================
  @Delete(':key')
  @ApiOperation({ summary: 'Delete config' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System config deleted successfully',
  })
  @UseInterceptors(AuditLogInterceptor)
  async deleteSystemConfig(@Param('key') key: string) {
    return this.systemConfigService.deleteSystemConfig(key);
  }
}
