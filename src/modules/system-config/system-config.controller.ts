import { RoleUser } from '@constants/user.constant';
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor';
import {
  CreateConfigRequestDto,
  SystemConfigFilterDto,
  UpdateConfigRequestDto,
  UpdateSiteInfoDto,
} from './dtos/system-config.req.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@Controller('system-config')
@RoleGuard(RoleUser.ADMIN)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

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
  // ==================== SITE INFO ====================
  @Get('site-info/info')
  @ApiOperation({ summary: 'Get site info' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Site info retrieved successfully',
  })
  async getSiteInfo() {
    return this.systemConfigService.getSiteInfo();
  }

  @Put('site-info/info')
  @ApiOperation({ summary: 'Update site info' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Site info updated successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        siteName: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        contactEmail: { type: 'string', nullable: true },
        contactPhone: { type: 'string', nullable: true },
        facebookUrl: { type: 'string', nullable: true },
        youtubeUrl: { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Optional logo image',
        },
      },
    },
  })
  @UseInterceptors(AuditLogInterceptor, FileInterceptor('logo'))
  async updateSiteInfo(
    @Body() dto: UpdateSiteInfoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.systemConfigService.updateSiteInfo(dto, file);
  }
}
