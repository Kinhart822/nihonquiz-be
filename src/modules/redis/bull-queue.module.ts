import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB'),
          sentinelMaxConnections: configService.get<number>(
            'REDIS_SENTINEL_MAX_CONNECTIONS',
            30,
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class BullQueueModule {}
