import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { SessionsModule } from './sessions/sessions.module';
import { MessagesModule } from './messages/messages.module';
import { OpenaiModule } from './openai/openai.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { ApiKeyMiddleware } from './middleware/api-key.middleware';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { winstonConfig } from './logger/winston-logger.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
      limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests default
    }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // disable in production
    }),
    SessionsModule,
    MessagesModule,
    OpenaiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthMiddleware,
    ApiKeyMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes('*'); // Apply to all routes

    consumer
      .apply(AuthMiddleware)
      .forRoutes('sessions', 'messages');
  }
}
