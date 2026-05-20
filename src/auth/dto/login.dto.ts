import { IsString, MinLength } from 'class-validator';

/** 登录请求体，格式校验由 DTO 负责，凭证校验由 LocalStrategy 负责 */
export class LoginDto {
  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}
