import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

/** 应用根模块：全局配置、数据库连接、业务模块注册 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        // 使用 127.0.0.1 而非 localhost，避免 macOS 上 IPv6 连接失败
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'nest_auth'),
        autoLoadEntities: true,
        // 开发环境自动同步表结构；生产环境应关闭并使用 migration
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
