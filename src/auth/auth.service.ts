import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

/** 认证核心业务：注册、登录校验、JWT 签发、用户信息查询 */
@Injectable()
export class AuthService {
  /** bcrypt 哈希强度，值越大越安全但越慢 */
  private readonly saltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** 注册新用户，密码 bcrypt 哈希后入库，响应中不包含密码字段 */
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.usersService.create(dto.username, hashedPassword);
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 校验用户名与密码，供 LocalStrategy 调用。
   * 失败返回 null（不抛错），由 Strategy 统一转为 401，避免泄露用户是否存在。
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }

    return user;
  }

  /** 登录成功后签发 JWT，sub 为用户 id（JWT 标准字段） */
  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /** 根据 JWT 中的 userId 查询用户资料，响应中不包含密码 */
  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password: _, ...result } = user;
    return result;
  }
}
