import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByUsername: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('throws ConflictException when username exists', async () => {
      usersService.findByUsername.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.register({ username: 'testuser', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns without password', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersService.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        username: 'testuser',
        password: '123456',
      });

      expect(usersService.create).toHaveBeenCalledWith('testuser', 'hashed');
      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('returns access_token', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await authService.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
      });
      expect(result).toEqual({ access_token: 'mock-token' });
    });
  });
});
