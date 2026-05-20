import './polyfill';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createCorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 允许配置的前端域名跨域访问（部署阿里云时在前端域名 / CORS_ORIGINS 中配置）
  app.enableCors(createCorsConfig(configService));

  // whitelist: 剔除 DTO 未声明字段；transform: 自动将请求体转为 DTO 实例
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(configService.get<string>('PORT', '3000'));
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
}
bootstrap();
