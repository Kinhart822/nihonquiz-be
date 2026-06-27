import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisCacheModule } from './configs/cache.module';
import { DatabaseModule } from './configs/database.module';
import { validate } from './configs/env.validation';
import { InterceptorsModule } from './interceptors/interceptor.module';
import { LoggerHttpRequestMiddleware } from './middleware/logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { GuardModule } from './modules/auth/guards/guard.module';
import { ClassModule } from './modules/class/class.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { CourseModule } from './modules/course/course.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SocketModule } from './modules/socket/socket.module';
import { PipeModule } from './pipes/pipe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env' : '.env.prod',
      expandVariables: true,
      cache: true,
    }),
    DatabaseModule,
    AuthModule,
    PipeModule,
    InterceptorsModule,
    GuardModule,
    RedisCacheModule,
    SocketModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    CloudinaryModule,
    ClassModule,
    CourseModule,
    LessonModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerHttpRequestMiddleware).forRoutes('*');
  }
}
