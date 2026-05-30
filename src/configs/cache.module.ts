import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');

        return {
          store: await redisStore({
            socket: {
              host: host || 'localhost',
              port: port || 6379,
            },
            password: password || undefined,
            ttl: 600, // Default TTL 10 minutes
          }),
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
