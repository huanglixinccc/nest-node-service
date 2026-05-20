import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * 构建 TypeORM 连接配置。
 * 本地开发连本机 MySQL；部署阿里云时通过环境变量指向 RDS 内网/外网地址。
 */
export function createDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const sslEnabled = configService.get<string>('DB_SSL', 'false') === 'true';

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', '127.0.0.1'),
    port: Number(configService.get<string>('DB_PORT', '3306')),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_DATABASE', 'nest_auth'),
    charset: 'utf8mb4',
    autoLoadEntities: true,
    // 生产环境禁止自动改表，应使用 migration
    synchronize: !isProduction,
    retryAttempts: Number(configService.get<string>('DB_RETRY_ATTEMPTS', '5')),
    retryDelay: Number(configService.get<string>('DB_RETRY_DELAY', '3000')),
    extra: {
      // 连接池大小，按 ECS 规格与并发调整
      connectionLimit: Number(
        configService.get<string>('DB_CONNECTION_LIMIT', '10'),
      ),
      connectTimeout: Number(
        configService.get<string>('DB_CONNECT_TIMEOUT', '10000'),
      ),
    },
    // 阿里云 RDS 建议开启 SSL，在控制台下载 CA 证书后配置 DB_SSL=true
    ssl: sslEnabled
      ? {
          rejectUnauthorized:
            configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED', 'true') ===
            'true',
        }
      : undefined,
    logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
  };
}
