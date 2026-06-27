import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { PageDto } from '@shared/dtos/page.dto';
import {
  EditMessageDto,
  MarkAsReadDto,
  MessageAttachmentFilterDto,
  MessageFilterDto,
  PinMessageDto,
  SendMessageDto,
  UnpinMessageDto,
} from './dtos/message.req.dto';

import {
  MessageAttachmentResDto,
  MessagePinResDto,
  MessageResDto,
} from './dtos/message.res.dto';
import { MessageService } from './message.service';

@ApiTags('Message')
@ApiBearerAuth()
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // ==================== GET LIST ====================
  @Get('conversation/:id')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResDto,
    description: 'List of messages returned successfully',
  })
  async getListByConversationId(
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: MessageFilterDto,
    @Param('id') id: string,
  ): Promise<PageDto<MessageResDto>> {
    return this.messageService.getConversationMessages(+id, filterDto, user);
  }

  // ==================== GET INFO ====================
  @Get(':id/info')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResDto,
    description: 'Message information returned successfully',
  })
  async getInfo(@Param('id') id: string): Promise<MessageResDto> {
    return this.messageService.getMessageInfo(+id);
  }

  @Get('conversation/:id/attachments')
  @ApiOperation({ summary: 'Get conversation attachments' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageAttachmentResDto,
    description: 'List of attachments returned successfully',
  })
  async getConversationAttachments(
    @Param('id') id: string,
    @Query() filterDto: MessageAttachmentFilterDto,
  ): Promise<PageDto<MessageAttachmentResDto>> {
    return this.messageService.getConversationAttachments(+id, filterDto);
  }

  @Get('conversation/:id/pins')
  @ApiOperation({ summary: 'Get pinned messages' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessagePinResDto,
    description: 'List of pinned messages returned successfully',
  })
  async getPinnedMessages(
    @Param('id') id: string,
    @Query() filterDto: MessageFilterDto,
  ): Promise<PageDto<MessagePinResDto>> {
    return this.messageService.getPinnedMessages(+id, filterDto);
  }

  // ==================== SEND ====================
  @Post('send')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MessageResDto,
    description: 'Message sent successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'number',
          description: 'Target conversation ID',
        },
        content: { type: 'string', description: 'Message text content' },
        replyToMessageId: {
          type: 'number',
          description: 'ID of message being replied to',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Optional file attachments',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async sendMessage(
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: SendMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.messageService.sendMessage(user.id, dto, files);
  }

  // ==================== EDIT ====================
  @Put('edit')
  @ApiOperation({ summary: 'Edit an existing message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'number', description: 'Conversation ID' },
        content: { type: 'string', description: 'Message content' },
        messageId: { type: 'number', description: 'Message ID' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'New attachment files',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async editMessage(
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: EditMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.messageService.editMessage(user.id, dto, files);
  }

  // ==================== MARK AS READ ====================
  @Post('mark-as-read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markAsRead(
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: MarkAsReadDto,
  ): Promise<boolean> {
    return this.messageService.markAsRead(user.id, dto);
  }

  // ==================== PIN MESSAGE =====================
  @Post('pin')
  @ApiOperation({ summary: 'Pin a message' })
  async pinMessage(
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: PinMessageDto,
  ): Promise<boolean> {
    return this.messageService.pinMessage(user.id, dto);
  }

  // ==================== UNPIN MESSAGE ===================
  @Post('unpin')
  @ApiOperation({ summary: 'Unpin a message' })
  async unpinMessage(
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: UnpinMessageDto,
  ): Promise<boolean> {
    return this.messageService.unpinMessage(user.id, dto);
  }
}
