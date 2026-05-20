import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { createDatabaseConfig } from './config/database.config';
import { getEnvFilePath } from './config/env.config';
import { UsersModule } from './users/users.module';

/** 应用根模块：全局配置、数据库连接、业务模块注册 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePath(),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createDatabaseConfig,
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
