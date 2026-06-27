import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import {
  JOIN_REQUEST_TTL,
  getJoinRequestKey,
  getUserConversationJoinRequestKey,
} from '@constants/redis.constant';
import {
  ConversationStatus,
  ConversationType,
  JoinGroupRequestAction,
  ParticipantRole,
  ParticipantStatus,
  RoleUser,
  UserStatus,
} from '@constants/user.constant';
import { ConversationEntity } from '@entities/conversation.entity';
import { ParticipantEntity } from '@entities/participant.entity';
import { RedisService } from '@modules/redis/redis.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '@repositories/conversation.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
  httpForbidden,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { In } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import {
  AddConversationMemberDto,
  ChangeOwnerDto,
  ConversationFilterDto,
  CreateConversationDto,
  MuteConversationDto,
  MuteValue,
  ProcessJoinGroupRequestDto,
  RemoveConversationMemberDto,
  UpdateConversationDto,
} from './dto/conversation.req.dto';
import { ConversationResDto } from './dto/conversation.res.dto';
import { ParticipantFilterDto } from './dto/participant.req.dto';
import { ParticipantResDto } from './dto/participant.res.dto';
import { JoinRequestRedisData } from './interface/join-conversation.interface';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly userRepo: UserRepository,
    private readonly participantRepo: ParticipantRepository,
    private readonly redisService: RedisService,
    private readonly socketEmitterService: SocketEmitterService,
    @InjectQueue(FILE_UPLOAD_QUEUE) private readonly fileUploadQueue: Queue,
  ) {}

  // ==================== Helper Methods ====================
  /**
   * Validate conversation
   */
  private async validateConversation(
    conversationId: number,
    type?: ConversationType,
  ): Promise<ConversationEntity> {
    const where: any = { id: conversationId };
    if (type) where.type = type;

    const conversation = await this.conversationRepo.findOneBy(where);
    if (!conversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    return conversation;
  }

  /**
   * Validate user is the participant of the conversation
   */
  private async validateConversationParticipant(
    conversationId: number,
    userId: number,
    type?: ConversationType,
  ): Promise<{
    conversation: ConversationEntity;
    participant: ParticipantEntity;
  }> {
    // Validate conversation
    const conversation = await this.validateConversation(conversationId, type);

    // Validate participant
    const participant = await this.participantRepo.findOne({
      where: { conversationId, userId },
      relations: { user: true },
    });

    if (!participant || participant.status === ParticipantStatus.LEFT) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    // Check participant status
    if (participant.status === ParticipantStatus.BLOCKED) {
      throw new httpForbidden(
        httpErrors.BLOCKED_USER.message,
        httpErrors.BLOCKED_USER.code,
      );
    }
    if (participant.status === ParticipantStatus.DELETED) {
      throw new httpForbidden(
        httpErrors.ACCOUNT_DELETED.message,
        httpErrors.ACCOUNT_DELETED.code,
      );
    }

    // Return conversation and participant
    return { conversation, participant };
  }

  /**
   * Validate user is the owner of the conversation
   */
  private async validateConversationOwner(
    conversationId: number,
    userId: number,
  ): Promise<ConversationEntity> {
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);
    if (participant.role !== ParticipantRole.OWNER) {
      throw new httpBadRequest(
        httpErrors.NOT_OWNER_OF_CONVERSATION.message,
        httpErrors.NOT_OWNER_OF_CONVERSATION.code,
      );
    }
    return conversation;
  }

  /**
   * Validate user is the admin
   */
  private async validateAdmin(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, role: RoleUser.ADMIN },
    });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }
    return user;
  }

  /**
   * Map conversation to response DTO
   */
  private mapConversationToResponse(
    conversation: ConversationEntity,
  ): ConversationResDto {
    return plainToInstance(ConversationResDto, conversation, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET INFO CONVERSATION ====================
  async getInfoConversation(
    conversationId: number,
  ): Promise<ConversationResDto> {
    const conversation = await this.conversationRepo.findOne({
      where: {
        id: conversationId,
      },
      relations: { participants: { user: true } },
    });
    if (!conversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }
    return this.mapConversationToResponse(conversation);
  }

  // ==================== GET CONVERSATIONS BY USER ID ====================
  async getConversationsByUserId(
    userId: number,
    filterDto: ConversationFilterDto,
  ): Promise<
    PageDto<{ conversation: ConversationResDto; unreadCount: number }>
  > {
    const { entities, total } =
      await this.conversationRepo.getUserConversationsWithFilters(
        userId,
        filterDto,
      );

    const mappedItems = entities.map((conversation) => {
      const participant = conversation.participants.find(
        (p) => p.userId === userId,
      );

      return {
        conversation: this.mapConversationToResponse(conversation),
        unreadCount: participant?.unreadCount ?? 0,
      };
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== GET LIST OF CONVERSATION ====================
  async getListOfConversation(
    filterDto: ConversationFilterDto,
  ): Promise<PageDto<ConversationResDto>> {
    const { entities, total } =
      await this.conversationRepo.getConversationsWithFilters(filterDto);

    const mappedItems = entities.map((conversation) => {
      return this.mapConversationToResponse(conversation);
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== GET LIST OF PARTICIPANTS ====================
  async getListOfParticipants(
    conversationId: number,
    filterDto: ParticipantFilterDto,
  ): Promise<PageDto<ParticipantResDto>> {
    const { entities, total } =
      await this.participantRepo.getParticipantsWithFilters(
        conversationId,
        filterDto,
      );

    const mappedItems = entities.map((participant) => {
      return plainToInstance(
        ParticipantResDto,
        {
          ...participant,
          username: participant.user.username,
          email: participant.user.email,
          avatarUrl: participant.user.avatarUrl,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== CREATE CONVERSATION ====================
  @Transactional()
  async createConversation(
    userId: number,
    payload: CreateConversationDto,
    file?: Express.Multer.File,
  ) {
    // Check if user is blocked or deleted
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user?.status === UserStatus.BLOCKED) {
      throw new httpForbidden(
        httpErrors.BLOCKED_USER.message,
        httpErrors.BLOCKED_USER.code,
      );
    }
    if (user?.status === UserStatus.DELETED) {
      throw new httpForbidden(
        httpErrors.ACCOUNT_DELETED.message,
        httpErrors.ACCOUNT_DELETED.code,
      );
    }

    const { name, participants, type } = payload;

    // Check if participants are not the same as the owner
    if (participants.includes(userId) || participants.length === 0) {
      throw new httpBadRequest(
        httpErrors.CANNOT_CREATE_SELF_CONVERSATION.message,
        httpErrors.CANNOT_CREATE_SELF_CONVERSATION.code,
      );
    }

    // Check if the participants exist in the system
    const validParticipants = await this.userRepo.find({
      where: { id: In(participants) },
    });
    if (validParticipants.length !== participants.length) {
      throw new httpBadRequest(
        httpErrors.INVALID_PARTICIPANTS.message,
        httpErrors.INVALID_PARTICIPANTS.code,
      );
    }

    // Check if direct conversation already exists
    if (type === ConversationType.DIRECT) {
      if (participants.length !== 1) {
        throw new httpBadRequest(
          httpErrors.INVALID_PARTICIPANTS.message,
          httpErrors.INVALID_PARTICIPANTS.code,
        );
      }
      const existConversation = await this.conversationRepo
        .createQueryBuilder('c')
        .innerJoin('c.participants', 'p1', 'p1.userId = :userId', { userId })
        .innerJoin('c.participants', 'p2', 'p2.userId = :participantId', {
          participantId: participants[0],
        })
        .where('c.type = :type', { type: ConversationType.DIRECT })
        .getOne();

      if (existConversation) {
        throw new httpBadRequest(
          httpErrors.CONVERSATION_EXISTED.message,
          httpErrors.CONVERSATION_EXISTED.code,
        );
      }
    }

    const avatarUrl = '';
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new httpBadRequest(
          httpErrors.FILE_TOO_LARGE(file.originalname).message,
          httpErrors.FILE_TOO_LARGE(file.originalname).code,
        );
      }
    }

    // Create conversation
    const conversation = await this.conversationRepo.create({
      name,
      avatarUrl,
      type,
      ownerId: userId,
    });
    await this.conversationRepo.save(conversation);

    if (file) {
      await this.fileUploadQueue.add(
        FILE_UPLOAD_JOB.UPLOAD_CONVERSATION_AVATAR,
        {
          conversationId: conversation.id,
          file: {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
        },
      );
    }

    // Create Participants
    const currentParticipant = await this.participantRepo.create({
      conversationId: conversation.id,
      userId,
      role: ParticipantRole.OWNER,
      status: ParticipantStatus.ACTIVE,
      joinedAt: new Date(),
      unreadCount: 0,
      lastReadSeq: 0,
    });
    const participantList = participants.map((participant) => {
      return this.participantRepo.create({
        conversationId: conversation.id,
        userId: participant,
        role: ParticipantRole.MEMBER,
        status: ParticipantStatus.ACTIVE,
        joinedAt: new Date(),
        unreadCount: 0,
        lastReadSeq: 0,
      });
    });
    await this.participantRepo.save([currentParticipant, ...participantList]);

    // Emit socket event
    this.socketEmitterService.emitCreateConversation(
      conversation.id,
      conversation,
    );
    return conversation;
  }

  // ==================== EDIT CONVERSATION ====================
  @Transactional()
  async editConversation(
    userId: number,
    conversationId: number,
    payload: UpdateConversationDto,
    file?: Express.Multer.File,
  ) {
    // Validate conversation and owner
    const conversation = await this.validateConversationOwner(
      conversationId,
      userId,
    );

    // Update fields
    if (payload.name) conversation.name = payload.name;
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new httpBadRequest(
          httpErrors.FILE_TOO_LARGE(file.originalname).message,
          httpErrors.FILE_TOO_LARGE(file.originalname).code,
        );
      }
      await this.fileUploadQueue.add(
        FILE_UPLOAD_JOB.UPLOAD_CONVERSATION_AVATAR,
        {
          conversationId: conversation.id,
          file: {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
        },
      );
    }
    if (payload.type) conversation.type = payload.type;
    await this.conversationRepo.save(conversation);

    // Emit socket event
    this.socketEmitterService.emitEditConversation(
      conversationId,
      conversation,
    );
    return true;
  }

  // ==================== ARCHIVE CONVERSATION ====================
  async archiveConversation(userId: number, conversationId: number) {
    // Validate conversation participant
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);

    // Archive
    if (participant.status === ParticipantStatus.ARCHIVED) {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_ALREADY_ARCHIVED.message,
        httpErrors.CONVERSATION_ALREADY_ARCHIVED.code,
      );
    }
    participant.status = ParticipantStatus.ARCHIVED;
    await this.participantRepo.save(participant);

    // Emit socket event
    this.socketEmitterService.emitArchiveConversation(
      participant.user.email,
      conversation,
    );
    return true;
  }

  // ==================== UNARCHIVE CONVERSATION ====================
  async unarchiveConversation(userId: number, conversationId: number) {
    // Validate conversation participant
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);

    // Unarchive
    if (participant.status === ParticipantStatus.ARCHIVED) {
      participant.status = ParticipantStatus.ACTIVE;
      await this.participantRepo.save(participant);
    } else {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_NOT_ARCHIVED.message,
        httpErrors.CONVERSATION_NOT_ARCHIVED.code,
      );
    }

    // Emit socket event
    this.socketEmitterService.emitUnarchiveConversation(
      participant.user.email,
      conversation,
    );
    return true;
  }

  // ==================== MUTE CONVERSATION ====================
  async muteConversation(
    userId: number,
    conversationId: number,
    payload: MuteConversationDto,
  ) {
    // Validate conversation participant
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);

    // Mute conversation
    let muteUntil: Date | null = new Date();
    if (payload.muteValue === MuteValue.M15) {
      muteUntil.setMinutes(muteUntil.getMinutes() + 15);
    } else if (payload.muteValue === MuteValue.H1) {
      muteUntil.setHours(muteUntil.getHours() + 1);
    } else if (payload.muteValue === MuteValue.H8) {
      muteUntil.setHours(muteUntil.getHours() + 8);
    } else if (payload.muteValue === MuteValue.H24) {
      muteUntil.setHours(muteUntil.getHours() + 24);
    } else if (payload.muteValue === MuteValue.FOREVER) {
      muteUntil = null;
    }

    participant.muteUntil = muteUntil;
    participant.isMuted = true;
    await this.participantRepo.save(participant);

    // Emit socket event
    this.socketEmitterService.emitMuteConversation(
      participant.user.email,
      conversation,
    );
    return true;
  }

  // ==================== UNMUTE CONVERSATION ====================
  async unmuteConversation(userId: number, conversationId: number) {
    // Validate conversation participant
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);

    // Unmute conversation
    participant.isMuted = false;
    participant.muteUntil = null;
    await this.participantRepo.save(participant);

    // Emit socket event
    this.socketEmitterService.emitUnmuteConversation(
      participant.user.email,
      conversation,
    );
    return true;
  }

  // ==================== PIN CONVERSATION ====================
  async pinConversation(userId: number, conversationId: number) {
    // Validate conversation participant
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);

    // Check if conversation is pinned
    if (participant.isPinned) {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_ALREADY_PINNED.message,
        httpErrors.CONVERSATION_ALREADY_PINNED.code,
      );
    }

    // Pin conversation
    participant.isPinned = true;
    participant.pinnedAt = new Date();
    await this.participantRepo.save(participant);

    // Emit socket event
    this.socketEmitterService.emitPinConversation(
      participant.user.email,
      conversation,
    );
    return true;
  }

  // ==================== UNPIN CONVERSATION ====================
  async unpinConversation(userId: number, conversationId: number) {
    // Validate conversation participant
    const { conversation, participant } =
      await this.validateConversationParticipant(conversationId, userId);

    // Check if conversation is not pinned
    if (!participant.isPinned) {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_NOT_PINNED.message,
        httpErrors.CONVERSATION_NOT_PINNED.code,
      );
    }

    // Unpin conversation
    participant.isPinned = false;
    participant.pinnedAt = null;
    await this.participantRepo.save(participant);

    // Emit socket event
    this.socketEmitterService.emitUnpinConversation(
      participant.user.email,
      conversation,
    );
    return true;
  }

  // ==================== BLOCK CONVERSATION ====================
  async blockConversation(userId: number, conversationId: number) {
    // Validate admin
    await this.validateAdmin(userId);

    // Get conversation
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    // Check Type
    if (conversation.type === ConversationType.GROUP) {
      throw new httpBadRequest(
        httpErrors.CANNOT_BLOCK_GROUP.message,
        httpErrors.CANNOT_BLOCK_GROUP.code,
      );
    }

    // Block conversation
    if (conversation.status === ConversationStatus.BLOCKED) {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_ALREADY_BLOCKED.message,
        httpErrors.CONVERSATION_ALREADY_BLOCKED.code,
      );
    }

    conversation.status = ConversationStatus.BLOCKED;
    await this.conversationRepo.save(conversation);

    // Emit socket event
    this.socketEmitterService.emitBlockConversation(
      conversationId,
      conversation,
    );
    return true;
  }

  // ==================== UNBLOCK CONVERSATION ====================
  async unblockConversation(userId: number, conversationId: number) {
    // Validate admin
    await this.validateAdmin(userId);

    // Get conversation
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    // Unblock conversation
    if (conversation.status !== ConversationStatus.BLOCKED) {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_NOT_BLOCKED.message,
        httpErrors.CONVERSATION_NOT_BLOCKED.code,
      );
    }

    conversation.status = ConversationStatus.ACTIVE;
    await this.conversationRepo.save(conversation);

    // Emit socket event
    this.socketEmitterService.emitUnblockConversation(
      conversationId,
      conversation,
    );
    return true;
  }

  // ==================== DELETE CONVERSATION ====================
  async deleteConversation(userId: number, conversationId: number) {
    // Validate admin
    await this.validateAdmin(userId);

    // Get conversation
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    // Check if conversation is already deleted
    if (conversation.status === ConversationStatus.DELETED) {
      throw new httpBadRequest(
        httpErrors.CONVERSATION_ALREADY_DELETED.message,
        httpErrors.CONVERSATION_ALREADY_DELETED.code,
      );
    }

    // Delete conversation
    conversation.status = ConversationStatus.DELETED;
    conversation.deletedAt = new Date();
    await this.conversationRepo.save(conversation);

    // Emit socket event
    this.socketEmitterService.emitDeleteConversation(
      conversationId,
      conversation,
    );
    return true;
  }

  // ==================== ADD MEMBER ====================
  @Transactional()
  async addMemberToGroup(
    userId: number,
    conversationId: number,
    payload: AddConversationMemberDto,
  ) {
    // Validate conversation owner
    const conversation = await this.validateConversationOwner(
      conversationId,
      userId,
    );

    // Validate all user IDs exist in the system and are active
    const validUsers = await this.userRepo.find({
      where: { id: In(payload.userIds), status: UserStatus.ACTIVE },
    });
    if (validUsers.length !== payload.userIds.length) {
      throw new httpBadRequest(
        httpErrors.CANNOT_ADD_BLOCKED_OR_DELETED_MEMBER.message,
        httpErrors.CANNOT_ADD_BLOCKED_OR_DELETED_MEMBER.code,
      );
    }

    // Get existing participant records for the requested user IDs
    const existingParticipants = await this.participantRepo.find({
      where: {
        conversationId,
        userId: In(payload.userIds),
      },
    });

    // Categorize existing participants by status
    const activeParticipants = existingParticipants.filter((p) =>
      [ParticipantStatus.ACTIVE, ParticipantStatus.ARCHIVED].includes(p.status),
    );
    const blockedOrDeletedParticipants = existingParticipants.filter((p) =>
      [ParticipantStatus.BLOCKED, ParticipantStatus.DELETED].includes(p.status),
    );
    const leftOrKickedParticipants = existingParticipants.filter((p) =>
      [ParticipantStatus.LEFT, ParticipantStatus.KICKED].includes(p.status),
    );

    // If ALL requested users are already active → throw error
    if (activeParticipants.length === payload.userIds.length) {
      throw new httpBadRequest(
        httpErrors.ALREADY_PARTICIPANT_OF_CONVERSATION.message,
        httpErrors.ALREADY_PARTICIPANT_OF_CONVERSATION.code,
      );
    }

    // Block adding users that are BLOCKED or DELETED
    if (blockedOrDeletedParticipants.length > 0) {
      throw new httpBadRequest(
        httpErrors.CANNOT_ADD_BLOCKED_OR_DELETED_MEMBER.message,
        httpErrors.CANNOT_ADD_BLOCKED_OR_DELETED_MEMBER.code,
      );
    }

    // Reactivate participants
    if (leftOrKickedParticipants.length > 0) {
      console.log('Reactivating left participants');
      for (const participant of leftOrKickedParticipants) {
        participant.status = ParticipantStatus.ACTIVE;
        participant.role = ParticipantRole.MEMBER;
        participant.joinedAt = new Date();
        participant.leftAt = null;
        participant.unreadCount = 0;
        participant.lastReadSeq = 0;
      }
      await this.participantRepo.save(leftOrKickedParticipants);
    }

    // Create records for new users
    const existingUserIds = existingParticipants.map((p) => p.userId);
    const newUserIds = payload.userIds.filter(
      (id) => !existingUserIds.includes(id),
    );

    const newParticipants = newUserIds.map((uid) =>
      this.participantRepo.create({
        conversationId,
        userId: uid,
        status: ParticipantStatus.ACTIVE,
        role: ParticipantRole.MEMBER,
        joinedAt: new Date(),
        unreadCount: 0,
        lastReadSeq: 0,
      }),
    );
    if (newParticipants.length > 0) {
      await this.participantRepo.save(newParticipants);
    }

    // Update conversation type
    const currentActiveCount = await this.participantRepo.count({
      where: {
        conversationId,
        status: In([ParticipantStatus.ACTIVE, ParticipantStatus.ARCHIVED]),
      },
    });

    const totalActiveCount =
      currentActiveCount +
      leftOrKickedParticipants.length +
      newParticipants.length;

    if (totalActiveCount > 2 && conversation.type !== ConversationType.GROUP) {
      conversation.type = ConversationType.GROUP;
      await this.conversationRepo.save(conversation);
    }

    // Emit socket event
    const allAddedParticipants = [
      ...leftOrKickedParticipants,
      ...newParticipants,
    ];
    this.socketEmitterService.emitAddMemberToGroup(conversationId, {
      conversation,
      newParticipants: allAddedParticipants,
    });

    return true;
  }

  // ==================== Kick member from group ====================
  @Transactional()
  async kickMemberFromGroup(
    userId: number,
    conversationId: number,
    payload: RemoveConversationMemberDto,
  ) {
    // 1. Check if group exists
    const existConversation = await this.conversationRepo.findOne({
      where: { id: conversationId, type: ConversationType.GROUP },
    });
    if (!existConversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    // 2. Check if current user is owner
    const currentUserParticipant = await this.participantRepo.findOne({
      where: {
        conversationId,
        userId,
        role: ParticipantRole.OWNER,
      },
      relations: { user: true },
    });
    if (!currentUserParticipant) {
      throw new httpBadRequest(
        httpErrors.NOT_OWNER_OF_CONVERSATION.message,
        httpErrors.NOT_OWNER_OF_CONVERSATION.code,
      );
    }

    // 3. Get members to be kicked
    const membersToKick = await this.participantRepo.find({
      where: {
        conversationId,
        userId: In(payload.participantIds),
      },
      relations: { user: true },
    });

    // 4. Validate: all members exist
    if (membersToKick.length !== payload.participantIds.length) {
      throw new httpBadRequest(
        httpErrors.INVALID_PARTICIPANTS.message,
        httpErrors.INVALID_PARTICIPANTS.code,
      );
    }

    // 5. Validate: cannot kick owner
    const hasOwnerInList = membersToKick.some(
      (m) => m.role === ParticipantRole.OWNER,
    );
    if (hasOwnerInList) {
      throw new httpBadRequest(
        httpErrors.CANNOT_KICK_OWNER.message,
        httpErrors.CANNOT_KICK_OWNER.code,
      );
    }

    // 6. Kick all members
    const kickedEmails: string[] = [];
    for (const member of membersToKick) {
      if (member.status === ParticipantStatus.KICKED) {
        throw new httpBadRequest(
          httpErrors.MEMBER_ALREADY_KICKED.message,
          httpErrors.MEMBER_ALREADY_KICKED.code,
        );
      }
      member.status = ParticipantStatus.KICKED;
      member.leftAt = new Date();
      kickedEmails.push(member.user.email);
    }
    await this.participantRepo.save(membersToKick);

    // 7. Emit socket event with kicked member emails
    this.socketEmitterService.emitRemoveMemberFromGroup(conversationId, {
      kickedEmails,
      kickedBy: currentUserParticipant.user.email,
    });

    return true;
  }

  // ==================== Request to Join Group ====================
  @Transactional()
  async requestToJoinGroup(userId: number, conversationId: number) {
    // 1. Validate conversation exists and is a GROUP
    const conversation = await this.validateConversation(
      conversationId,
      ConversationType.GROUP,
    );

    // 2. Check if user is already an active participant
    const existingParticipant = await this.participantRepo.findOne({
      where: { conversationId, userId },
      relations: { user: true },
    });
    if (existingParticipant) {
      if (
        [ParticipantStatus.ACTIVE, ParticipantStatus.ARCHIVED].includes(
          existingParticipant.status,
        )
      ) {
        throw new httpBadRequest(
          httpErrors.ALREADY_PARTICIPANT_OF_CONVERSATION.message,
          httpErrors.ALREADY_PARTICIPANT_OF_CONVERSATION.code,
        );
      }

      if (
        [ParticipantStatus.BLOCKED, ParticipantStatus.DELETED].includes(
          existingParticipant.status,
        )
      ) {
        throw new httpBadRequest(
          httpErrors.CANNOT_REJOIN_BLOCKED_OR_DELETED_PARTICIPANT.message,
          httpErrors.CANNOT_REJOIN_BLOCKED_OR_DELETED_PARTICIPANT.code,
        );
      }
    }

    // 3. Check if user already has a pending request in Redis
    const pendingKey = getUserConversationJoinRequestKey(
      userId,
      conversationId,
    );
    const existingRequestKey = await this.redisService.get<string>(pendingKey);
    if (existingRequestKey) {
      throw new httpBadRequest(
        httpErrors.JOIN_REQUEST_ALREADY_PENDING.message,
        httpErrors.JOIN_REQUEST_ALREADY_PENDING.code,
      );
    }

    // 4. Generate UUID key and store join request in Redis
    const requester =
      existingParticipant?.user ??
      (await this.userRepo.findOne({ where: { id: userId } }));
    const requestKey = uuidv4();

    const joinRequestData: JoinRequestRedisData = {
      requestKey,
      userId,
      conversationId,
      conversationName: conversation.name,
      username: requester?.username ?? '',
      email: requester?.email ?? '',
      createdAt: new Date().toISOString(),
    };

    await this.redisService.set(
      getJoinRequestKey(requestKey),
      joinRequestData,
      JOIN_REQUEST_TTL,
    );

    // 5. Track pending request per user+conversation (for duplicate check)
    await this.redisService.set(pendingKey, requestKey, JOIN_REQUEST_TTL);

    // 6. Notify group owner
    const owner = await this.userRepo.findOne({
      where: { id: conversation.ownerId },
    });
    if (owner) {
      this.socketEmitterService.emitNewJoinRequest(owner.email, {
        requestKey,
        conversationId,
        conversationName: conversation.name,
        userId,
        username: requester?.username,
        email: requester?.email,
      });
    }

    return { requestKey };
  }

  // ==================== Process Join Group Request ====================
  @Transactional()
  async processJoinGroupRequest(
    userId: number,
    requestKey: string,
    payload: ProcessJoinGroupRequestDto,
  ) {
    // 1. Fetch join request data from Redis
    const joinRequestData = await this.redisService.get<JoinRequestRedisData>(
      getJoinRequestKey(requestKey),
    );
    if (!joinRequestData) {
      throw new httpNotFound(
        httpErrors.JOIN_REQUEST_NOT_FOUND.message,
        httpErrors.JOIN_REQUEST_NOT_FOUND.code,
      );
    }

    // 2. Validate that current user is the owner of the group
    await this.validateConversationOwner(
      joinRequestData.conversationId,
      userId,
    );

    // 3. Process based on status
    if (payload.action === JoinGroupRequestAction.ACCEPT) {
      // Check if user has an existing participant record
      const existingParticipant = await this.participantRepo.findOne({
        where: {
          conversationId: joinRequestData.conversationId,
          userId: joinRequestData.userId,
        },
      });

      if (existingParticipant) {
        if (
          [ParticipantStatus.ACTIVE, ParticipantStatus.ARCHIVED].includes(
            existingParticipant.status,
          )
        ) {
          throw new httpBadRequest(
            httpErrors.ALREADY_PARTICIPANT_OF_CONVERSATION.message,
            httpErrors.ALREADY_PARTICIPANT_OF_CONVERSATION.code,
          );
        }

        if (
          [ParticipantStatus.BLOCKED, ParticipantStatus.DELETED].includes(
            existingParticipant.status,
          )
        ) {
          throw new httpBadRequest(
            httpErrors.CANNOT_REJOIN_BLOCKED_OR_DELETED_PARTICIPANT.message,
            httpErrors.CANNOT_REJOIN_BLOCKED_OR_DELETED_PARTICIPANT.code,
          );
        }

        // Reactivate existing participant
        if (
          [ParticipantStatus.LEFT, ParticipantStatus.KICKED].includes(
            existingParticipant.status,
          )
        ) {
          existingParticipant.status = ParticipantStatus.ACTIVE;
          existingParticipant.role = ParticipantRole.MEMBER;
          existingParticipant.joinedAt = new Date();
          existingParticipant.leftAt = null;
          await this.participantRepo.save(existingParticipant);
        }
      } else {
        // Add new participant
        const newParticipant = this.participantRepo.create({
          conversationId: joinRequestData.conversationId,
          userId: joinRequestData.userId,
          role: ParticipantRole.MEMBER,
          status: ParticipantStatus.ACTIVE,
          joinedAt: new Date(),
          unreadCount: 0,
          lastReadSeq: 0,
        });
        await this.participantRepo.save(newParticipant);
      }

      // Notify the conversation
      this.socketEmitterService.emitJoinRequestApproved(
        joinRequestData.conversationId,
        {
          requestKey,
          userId: joinRequestData.userId,
          username: joinRequestData.username,
          conversationId: joinRequestData.conversationId,
        },
      );
    } else {
      // Notify the requester
      if (joinRequestData.email) {
        this.socketEmitterService.emitJoinRequestRejected(
          joinRequestData.email,
          {
            requestKey,
            conversationId: joinRequestData.conversationId,
            conversationName: joinRequestData.conversationName,
          },
        );
      }
    }

    // 4. Remove from Redis after all DB operations and notifications succeed
    await this.redisService.del(getJoinRequestKey(requestKey));
    await this.redisService.del(
      getUserConversationJoinRequestKey(
        joinRequestData.userId,
        joinRequestData.conversationId,
      ),
    );

    return true;
  }

  // ==================== Leave group ====================
  async leaveGroup(userId: number, conversationId: number) {
    // Validate group
    await this.validateConversation(conversationId, ConversationType.GROUP);

    // Validate conversation participant
    const { participant } = await this.validateConversationParticipant(
      conversationId,
      userId,
    );

    // Check if the current user is an owner of the conversation
    if (participant.role === ParticipantRole.OWNER) {
      throw new httpBadRequest(
        httpErrors.CANNOT_LEAVE_GROUP_AS_OWNER.message,
        httpErrors.CANNOT_LEAVE_GROUP_AS_OWNER.code,
      );
    }

    // Leave group
    participant.status = ParticipantStatus.LEFT;
    participant.leftAt = new Date();
    await this.participantRepo.save(participant);

    // Emit socket event
    this.socketEmitterService.emitLeaveGroup(
      conversationId,
      participant.user.email,
    );
    return true;
  }

  // ==================== Change owner of group ====================
  async changeOwnerOfGroup(
    userId: number,
    conversationId: number,
    payload: ChangeOwnerDto,
  ) {
    // Validate group exists and current user is owner
    const conversation = await this.validateConversationOwner(
      conversationId,
      userId,
    );

    // Check if the new owner is a participant in the conversation
    const newOwnerParticipant = await this.participantRepo.findOne({
      where: { conversationId, userId: payload.ownerId },
    });

    // Change owner of conversation
    conversation.ownerId = payload.ownerId;
    await this.conversationRepo.save(conversation);

    // Update old owner role to MEMBER (current user)
    const currentUserParticipant = await this.participantRepo.findOne({
      where: { conversationId, userId },
    });
    currentUserParticipant!.role = ParticipantRole.MEMBER;
    await this.participantRepo.save(currentUserParticipant!);

    // Update new owner role to OWNER
    newOwnerParticipant!.role = ParticipantRole.OWNER;
    await this.participantRepo.save(newOwnerParticipant!);

    // Emit socket event
    this.socketEmitterService.emitChangeOwnerOfGroup(conversation.id, {
      conversationId: conversation.id,
      newOwnerId: payload.ownerId,
      oldOwnerId: userId,
    });
    return true;
  }
}
