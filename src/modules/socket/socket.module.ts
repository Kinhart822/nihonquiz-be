import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketEmitterService } from './socket-emitter.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [JwtModule, ConfigModule, RedisModule],
  providers: [SocketGateway, SocketEmitterService],
  exports: [SocketGateway, SocketEmitterService],
})
export class SocketModule {}
