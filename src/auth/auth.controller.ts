import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

/** 认证相关 HTTP 接口：/auth/register、/auth/login、/auth/profile */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * LocalAuthGuard 会先走 LocalStrategy 校验账号密码，
   * 通过后 req.user 即为已验证的用户实体。
   * LoginDto 保留用于触发全局 ValidationPipe 校验请求体格式。
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login(@Request() req: { user: User }, @Body() _dto: LoginDto) {
    return this.authService.login(req.user);
  }

  /** 需在请求头携带 Authorization: Bearer <token> */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { id: number } }) {
    return this.authService.getProfile(req.user.id);
  }
}
