import { ConversationType, RoleUser } from '@constants/user.constant';
import { ParticipantFilterDto } from './dto/participant.req.dto';
import { ParticipantResDto } from './dto/participant.res.dto';
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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, RoleGuard } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor';
import { ConversationService } from './conversation.service';
import {
  AddConversationMemberDto,
  ChangeOwnerDto,
  ConversationFilterDto,
  CreateConversationDto,
  MuteConversationDto,
  ProcessJoinGroupRequestDto,
  RemoveConversationMemberDto,
  UpdateConversationDto,
} from './dto/conversation.req.dto';
import { ConversationResDto } from './dto/conversation.res.dto';

@ApiTags('Conversation')
@ApiBearerAuth()
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  // ==================== GET LIST ====================
  @Get()
  @ApiOperation({
    summary: 'Get list of conversations',
    description: 'Returns a paginated list of conversations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ConversationResDto,
    description: 'List of conversations returned successfully',
  })
  async getList(
    @Query() filterDto: ConversationFilterDto,
  ): Promise<PageDto<ConversationResDto>> {
    return this.conversationService.getListOfConversation(filterDto);
  }

  @Get('user')
  @ApiOperation({
    summary: 'Get conversations for current user',
    description:
      'Returns a paginated list of conversations that the current user is a participant in.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User conversations returned successfully',
  })
  async getListByUserId(
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: ConversationFilterDto,
  ): Promise<
    PageDto<{ conversation: ConversationResDto; unreadCount: number }>
  > {
    return this.conversationService.getConversationsByUserId(
      user.id,
      filterDto,
    );
  }

  @Get(':id/participants')
  @ApiOperation({
    summary: 'Get list of participants in a conversation',
    description:
      'Returns list of participants in a conversation for the specified conversation ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of participants returned successfully',
  })
  async getParticipants(
    @Param('id') id: string,
    @Query() filterDto: ParticipantFilterDto,
  ): Promise<PageDto<ParticipantResDto>> {
    return this.conversationService.getListOfParticipants(+id, filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id/info')
  @ApiOperation({
    summary: 'Get conversation by ID',
    description:
      'Returns conversation information for the specified conversation ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ConversationResDto,
    description: 'Conversation information returned successfully',
  })
  async getInfo(@Param('id') id: string): Promise<ConversationResDto> {
    return this.conversationService.getInfoConversation(+id);
  }

  // ==================== CREATE ====================
  @Post()
  @ApiOperation({
    summary: 'Create a new conversation',
    description:
      'Creates a new DIRECT or GROUP conversation. For GROUP, an optional avatar can be uploaded.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ConversationResDto,
    description: 'Conversation created successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Group name (only for GROUP type)',
        },
        participants: {
          type: 'array',
          items: { type: 'number' },
          description: 'Initial participant IDs',
        },
        type: {
          type: 'string',
          enum: [ConversationType.DIRECT, ConversationType.GROUP],
          description: 'Type of conversation',
          default: ConversationType.DIRECT,
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image for GROUP conversation',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @AuthUser() user: JwtPayloadDto,
    @Body() payload: CreateConversationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.conversationService.createConversation(user.id, payload, file);
  }

  // ==================== EDIT ====================
  @Put('edit/:id')
  @ApiOperation({
    summary: 'Edit a conversation',
    description: 'Edit a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation edited successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Conversation name' },
        type: {
          type: 'string',
          enum: [ConversationType.DIRECT, ConversationType.GROUP],
          description: 'Conversation type',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Group avatar file',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async edit(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() payload: UpdateConversationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.conversationService.editConversation(
      user.id,
      +id,
      payload,
      file,
    );
  }

  // ==================== ARCHIVE ====================
  @Post('archive/:id')
  @ApiOperation({
    summary: 'Archive a conversation',
    description: 'Archive a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation archived successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async archive(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.archiveConversation(user.id, +id);
  }

  // ==================== UNARCHIVE ====================
  @Post('unarchive/:id')
  @ApiOperation({
    summary: 'Unarchive a conversation',
    description: 'Unarchive a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation unarchived successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async unarchive(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.unarchiveConversation(user.id, +id);
  }

  // ==================== MUTE ====================
  @Post('mute/:id')
  @ApiOperation({
    summary: 'Mute a conversation',
    description: 'Mute a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation muted successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async mute(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() payload: MuteConversationDto,
  ) {
    return this.conversationService.muteConversation(user.id, +id, payload);
  }

  // ==================== UNMUTE ====================
  @Post('unmute/:id')
  @ApiOperation({
    summary: 'Unmute a conversation',
    description: 'Unmute a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation unmuted successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async unmute(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.unmuteConversation(user.id, +id);
  }

  // ==================== PIN ====================
  @Post('pin/:id')
  @ApiOperation({
    summary: 'Pin a conversation',
    description: 'Pin a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation pinned successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async pin(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.pinConversation(user.id, +id);
  }

  // ==================== UNPIN ====================
  @Post('unpin/:id')
  @ApiOperation({
    summary: 'Unpin a conversation',
    description: 'Unpin a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation unpinned successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async unpin(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.unpinConversation(user.id, +id);
  }

  // ==================== BLOCK ====================
  @Post('conversation-management/block/:id')
  @ApiOperation({
    summary: 'Block a conversation',
    description: 'Block a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation blocked successfully',
  })
  @RoleGuard(RoleUser.ADMIN)
  @UseInterceptors(AuditLogInterceptor)
  async block(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.blockConversation(user.id, +id);
  }

  // ==================== UNBLOCK ====================
  @Post('conversation-management/unblock/:id')
  @ApiOperation({
    summary: 'Unblock a conversation',
    description: 'Unblock a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation unblocked successfully',
  })
  @RoleGuard(RoleUser.ADMIN)
  @UseInterceptors(AuditLogInterceptor)
  async unblock(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.unblockConversation(user.id, +id);
  }

  // ==================== DELETE ====================
  @Delete('conversation-management/delete/:id')
  @ApiOperation({
    summary: 'Delete a conversation',
    description: 'Delete a conversation with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation deleted successfully',
  })
  @RoleGuard(RoleUser.ADMIN)
  @UseInterceptors(AuditLogInterceptor)
  async delete(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.deleteConversation(user.id, +id);
  }

  // ==================== ADD MEMBER ====================
  @Post(':id/members')
  @ApiOperation({
    summary: 'Add members to group',
    description: 'Add members to group with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Members added successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async addMember(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() payload: AddConversationMemberDto,
  ) {
    return this.conversationService.addMemberToGroup(user.id, +id, payload);
  }

  // ==================== KICK MEMBER ====================
  @Delete(':id/members')
  @ApiOperation({
    summary: 'Kick members from group',
    description: 'Kick members from group with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Members kicked successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async kickMember(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() payload: RemoveConversationMemberDto,
  ) {
    return this.conversationService.kickMemberFromGroup(user.id, +id, payload);
  }

  // ==================== LEAVE GROUP ====================
  @Post(':id/leave')
  @ApiOperation({
    summary: 'Leave a group',
    description: 'Leave a group with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group left successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async leave(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.conversationService.leaveGroup(user.id, +id);
  }

  // ==================== CHANGE OWNER ====================
  @Post(':id/change-owner')
  @ApiOperation({
    summary: 'Change group owner',
    description: 'Change group owner with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group owner changed successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async changeOwner(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() payload: ChangeOwnerDto,
  ) {
    return this.conversationService.changeOwnerOfGroup(user.id, +id, payload);
  }
  // ==================== REQUEST TO JOIN GROUP ====================
  @Post(':id/join-request')
  @ApiOperation({
    summary: 'Request to join a group',
    description:
      'Send a request to join a group conversation. The group owner will be notified.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Join request sent successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async requestToJoinGroup(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
  ) {
    return this.conversationService.requestToJoinGroup(user.id, +id);
  }

  // ==================== PROCESS JOIN GROUP REQUEST ====================
  @Post(':id/join-request/:requestKey/process')
  @ApiOperation({
    summary: 'Process a join group request',
    description:
      'Approve or reject a pending join group request. Only the group owner can process requests.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Join request processed successfully',
  })
  @RoleGuard(RoleUser.STUDENT, RoleUser.TEACHER)
  async processJoinGroupRequest(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Param('requestKey') requestKey: string,
    @Body() payload: ProcessJoinGroupRequestDto,
  ) {
    return this.conversationService.processJoinGroupRequest(
      user.id,
      requestKey,
      payload,
    );
  }
}
