import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** 保护登录接口，触发 LocalStrategy 校验用户名密码 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
