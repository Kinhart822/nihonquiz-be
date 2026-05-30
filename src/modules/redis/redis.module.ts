import { RedisModule as RedisModuleNest } from '@nestjs-modules/ioredis';
import { Global, Module } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { RedisService } from './redis.service';
import { createClientRedis } from '@constants/redis.constant';

@Global()
@Module({
  imports: [
    RedisModuleNest.forRoot({
      type: 'single',
      url: `redis://${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`,
    }),
  ],
  providers: [
    {
      provide: 'REDIS',
      useFactory: async (): Promise<RedisClientType> => {
        const client = createClientRedis();
        await client.connect();
        client.on('error', (err) => {
          console.error('Redis client error:', err);
        });
        return client;
      },
    },
    RedisService,
  ],
  exports: ['REDIS', RedisService],
})
export class RedisModule {}
