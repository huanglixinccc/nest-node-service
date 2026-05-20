import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** 保护需要登录才能访问的路由，触发 JwtStrategy 校验 Bearer Token */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
