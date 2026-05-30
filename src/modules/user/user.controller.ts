import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { UpdateProfileDto } from './dto/user.req.dto';
import { UserProfileResDto } from './dto/user.res.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ==================== GET PROFILE ====================
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserProfileResDto,
    description: 'Profile returned successfully',
  })
  async getProfile(
    @AuthUser() user: JwtPayloadDto,
  ): Promise<UserProfileResDto> {
    return this.userService.getProfile(user.id);
  }

  // ==================== UPDATE PROFILE ====================
  @Put('profile')
  @ApiOperation({ summary: 'Update user profile (username, description)' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Profile updated successfully',
        },
      },
    },
    description: 'Profile updated successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'New username (3-30 characters)',
        },
        description: {
          type: 'string',
          description: 'New description/bio (max 500 characters)',
        },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (max 5MB)',
        },
        background: {
          type: 'string',
          format: 'binary',
          description: 'Background image file (max 10MB)',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'background', maxCount: 1 },
    ]),
  )
  async updateProfile(
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: UpdateProfileDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ): Promise<{ message: string }> {
    const avatar = files?.avatar?.[0];
    const background = files?.background?.[0];
    return this.userService.updateProfile(user.id, dto, avatar, background);
  }
}
