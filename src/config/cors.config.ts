import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * 解析 CORS 配置，供前端（本地 / 阿里云 OSS+CDN / 域名）跨域访问 API。
 * CORS_ORIGINS 多个来源用英文逗号分隔，例如：
 */
export function createCorsConfig(configService: ConfigService): CorsOptions {
  const defaultOrigins =
    configService.get<string>('NODE_ENV') === 'production'
      ? ''
      : 'http://localhost:3000';

  const rawOrigins = configService.get<string>('CORS_ORIGINS', defaultOrigins);
  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const credentials =
    configService.get<string>('CORS_CREDENTIALS', 'true') === 'true';

  // 生产环境必须显式配置允许的前端域名，避免使用 *
  if (
    configService.get<string>('NODE_ENV') === 'production' &&
    origins.length === 0
  ) {
    throw new Error(
      'CORS_ORIGINS must be set in production, e.g. https://www.example.com',
    );
  }

  return {
    origin: origins.length === 1 && origins[0] === '*' ? true : origins,
    credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: Number(configService.get<string>('CORS_MAX_AGE', '86400')),
  };
}
