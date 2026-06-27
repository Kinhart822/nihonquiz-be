import {
  SocketEvent,
  getConversationRoomById,
  getUserRoomByEmail,
} from '@constants/socket.constant';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Emitter } from '@socket.io/redis-emitter';
import * as redis from 'redis';
import { SocketEventDto } from './dtos/socket-emitter.dto';

@Injectable()
export class SocketEmitterService implements OnModuleInit {
  private __emitter!: Emitter;
  private readonly logger = new Logger(SocketEmitterService.name);

  constructor(
    @Inject('REDIS')
    private readonly redisClient: redis.RedisClientType,
  ) {}

  onModuleInit(): void {
    this.initEmitter();
  }

  private initEmitter(): void {
    this.__emitter = new Emitter(this.redisClient);
  }

  get emitter(): Emitter {
    return this.__emitter;
  }

  /**
   * Emit event to a user via their email room
   */
  emitEvent(email: string, event: SocketEvent, data: any): void {
    try {
      const room = getUserRoomByEmail(email.toLowerCase());
      const payload: SocketEventDto = { event, data };

      this.logger.log(`Emitting event ${event} to room ${room}`);
      this.__emitter.to(room).emit(event, payload);
    } catch (error: any) {
      this.logger.error(
        `Failed to emit event ${event} to user ${email}`,
        error.stack,
      );
    }
  }

  emitUserBlocked(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.USER_BLOCKED, data);
  }

  emitUserUnblocked(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.USER_UNBLOCKED, data);
  }

  emitUserDeleted(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.USER_DELETED, data);
  }

  emitUserProfileUpdate(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.PROFILE_UPDATE, data);
  }

  emitUserProfileStatusChangek(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.PROFILE_STATUS_CHANGE, data);
  }

  // Emit event to a conversation room
  emitEventToConversation(
    conversationId: number,
    event: SocketEvent,
    data: any,
  ): void {
    try {
      const room = getConversationRoomById(conversationId);
      const payload: SocketEventDto = { event, data };

      this.logger.log(`Emitting event ${event} to conversation room ${room}`);
      this.__emitter.to(room).emit(event, payload);
    } catch (error: any) {
      this.logger.error(
        `Failed to emit event ${event} to conversation ${conversationId}`,
        error.stack,
      );
    }
  }

  // Message Events
  emitNewMessage(conversationId: number, data: any): void {
    this.emitEventToConversation(conversationId, SocketEvent.NEW_MESSAGE, data);
  }

  emitEditMessage(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.EDIT_MESSAGE,
      data,
    );
  }

  emitDeleteMessage(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.DELETE_MESSAGE,
      data,
    );
  }

  emitUpdateAttachment(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.UPDATE_ATTACHMENT,
      data,
    );
  }

  emitMarkMessageAsRead(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.MARK_MESSAGE_AS_READ, data);
  }

  emitPinMessage(conversationId: number, data: any) {
    {
      this.emitEventToConversation(
        conversationId,
        SocketEvent.PIN_MESSAGE,
        data,
      );
    }
  }

  emitUnpinMessage(conversationId: number, data: any) {
    {
      this.emitEventToConversation(
        conversationId,
        SocketEvent.UNPIN_MESSAGE,
        data,
      );
    }
  }

  // Friend Events
  emitSendFriendRequest(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.SEND_FRIEND_REQUEST, data);
  }

  emitFriendRequestStatusChange(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.FRIEND_REQUEST_STATUS_CHANGE, data);
  }

  emitRemoveFriend(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.REMOVE_FRIEND, data);
  }

  emitBlockFriend(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.BLOCK_FRIEND, data);
  }

  emitUnblockFriend(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.UNBLOCK_FRIEND, data);
  }

  // Conversation Events
  emitCreateConversation(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.CREATE_CONVERSATION,
      data,
    );
  }

  emitEditConversation(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.EDIT_CONVERSATION,
      data,
    );
  }

  emitUpdateConversationAvatar(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.UPDATE_CONVERSATION_AVATAR,
      data,
    );
  }

  emitArchiveConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.ARCHIVE_CONVERSATION, data);
  }

  emitUnarchiveConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.UNARCHIVE_CONVERSATION, data);
  }

  emitMuteConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.MUTE_CONVERSATION, data);
  }

  emitUnmuteConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.UNMUTE_CONVERSATION, data);
  }

  emitPinConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.PIN_CONVERSATION, data);
  }

  emitUnpinConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.UNPIN_CONVERSATION, data);
  }

  emitBlockConversation(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.BLOCK_CONVERSATION,
      data,
    );
  }

  emitUnblockConversation(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.UNBLOCK_CONVERSATION,
      data,
    );
  }

  emitDeleteConversation(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.DELETE_CONVERSATION,
      data,
    );
  }

  emitRemoveConversation(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.REMOVE_CONVERSATION, data);
  }

  // Group Events
  emitAddMemberToGroup(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.ADD_MEMBER_TO_GROUP,
      data,
    );
  }

  emitRemoveMemberFromGroup(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.REMOVE_MEMBER_FROM_GROUP,
      data,
    );
  }

  emitLeaveGroup(conversationId: number, data: any): void {
    this.emitEventToConversation(conversationId, SocketEvent.LEAVE_GROUP, data);
  }

  emitChangeOwnerOfGroup(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.CHANGE_OWNER_OF_GROUP,
      data,
    );
  }

  emitNewJoinRequest(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.NEW_JOIN_REQUEST, data);
  }

  emitJoinRequestApproved(conversationId: number, data: any): void {
    this.emitEventToConversation(
      conversationId,
      SocketEvent.JOIN_REQUEST_APPROVED,
      data,
    );
  }

  emitJoinRequestRejected(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.JOIN_REQUEST_REJECTED, data);
  }

  emitGlobalConversationUpdate(email: string, data: any): void {
    this.emitEvent(email, SocketEvent.GLOBAL_CONVERSATION_UPDATE, data);
  }
}
