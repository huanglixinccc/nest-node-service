import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** 注册请求体，由全局 ValidationPipe 自动校验 */
export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only letters, numbers, and underscores',
  })
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
