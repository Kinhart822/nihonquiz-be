import { SocketEvent, getUserRoomByEmail } from '@constants/socket.constant';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Emitter } from '@socket.io/redis-emitter';
import type { RedisClientType } from 'redis';
import { SocketEventDto } from './dto/socket-emitter.dto';

@Injectable()
export class SocketEmitterService implements OnModuleInit {
  private __emitter!: Emitter;
  private readonly logger = new Logger(SocketEmitterService.name);

  constructor(
    @Inject('REDIS')
    private readonly redisClient: RedisClientType,
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
    } catch (error) {
      this.logger.error(
        `Failed to emit event ${event} to user ${email}`,
        (error as Error).stack,
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
}
