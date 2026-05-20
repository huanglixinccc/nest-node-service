import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

/** JWT 载荷结构，与 AuthService.login 中 sign 的 payload 对应 */
export interface JwtPayload {
  sub: number;
  username: string;
}

/**
 * JWT 鉴权策略，从 Authorization: Bearer <token> 提取并验证 token。
 * validate 返回值会挂载到 req.user，供受保护路由使用。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** 二次查库确保用户仍存在，并剔除 password 字段 */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null;
    }
    const { password: _, ...result } = user;
    return result;
  }
}
