import {
  getConversationRoomById,
  getUserRoomByEmail,
} from '@constants/socket.constant';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getDataUserFromToken(client: Socket): JwtPayloadDto {
    const queryToken = client.handshake.query?.authorization;
    const headerAuth = client.handshake.headers.authorization;
    const token =
      queryToken ||
      (headerAuth && typeof headerAuth === 'string'
        ? headerAuth.split(' ')[1]
        : null);

    if (!token) {
      throw new UnauthorizedException('Token not found!');
    }

    try {
      const jwtData = this.jwtService.verify(token as string, {
        secret: this.configService.get('JWT_SECRET_KEY'),
      }) as JwtPayloadDto;

      if (!jwtData) {
        throw new UnauthorizedException('Invalid token');
      }
      return jwtData;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const jwtData = this.getDataUserFromToken(client);
      const email = jwtData.email.toLowerCase();

      // Join individual user room
      const userRoom = getUserRoomByEmail(email);
      await client.join(userRoom);

      // Attach user info to socket for later use
      client.data.user = jwtData;

      this.logger.log(
        `Client connected: ${client.id} - Joined room: ${userRoom}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection authentication failed for client ${client.id}: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  handlePing(): string {
    return 'pong';
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    client: Socket,
    @MessageBody() conversationId: number,
  ): void {
    const room = getConversationRoomById(conversationId);
    void client.join(room);
    this.logger.log(`Client ${client.id} joined conversation room: ${room}`);
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    client: Socket,
    @MessageBody() conversationId: number,
  ): void {
    const room = getConversationRoomById(conversationId);
    void client.leave(room);
    this.logger.log(`Client ${client.id} left conversation room: ${room}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
