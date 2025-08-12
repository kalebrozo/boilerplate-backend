import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { MetricsService } from '../metrics/metrics.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockMetricsService = {
  incrementAuthAttempts: jest.fn(),
  incrementHttpRequests: jest.fn(),
  recordHttpRequestDuration: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';

      const user = {
        id: 'user-123',
        email,
        password: hashedPassword,
        name: 'Test User',
        role: { id: 'role-123', name: 'User' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: 'user-123',
        email,
        name: 'Test User',
        role: { id: 'role-123', name: 'User' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { role: true },
      });
    });

    it('should return null for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = 'hashedPassword';

      const user = {
        id: 'user-123',
        email,
        password: hashedPassword,
        name: 'Test User',
        role: { id: 'role-123', name: 'User' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: { id: 'role-123', name: 'User' },
      };

      const token = 'jwt-token';

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: token,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: {
            id: 'role-123',
            name: 'User',
          },
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123',
        role: 'User',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        roleId: 'role-123',
      };

      const hashedPassword = 'hashedPassword';
      const token = 'jwt-token';

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        password: hashedPassword,
        role: { id: 'role-123', name: 'User' },
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: token,
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          name: 'New User',
          role: {
            id: 'role-123',
            name: 'User',
          },
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          password: hashedPassword,
          roleId: 'role-123',
        },
        include: { role: true },
      });
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        roleId: 'role-123',
      };

      const existingUser = {
        id: 'user-123',
        email: 'existing@example.com',
        name: 'Existing User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new UnauthorizedException('User already exists'),
      );
    });
  });

  describe('validateUserById', () => {
    it('should return user by id', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: { id: 'role-123', name: 'User' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUserById(userId);

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { role: true },
      });
    });

    it('should return null if user not found', async () => {
      const userId = 'nonexistent';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUserById(userId);

      expect(result).toBeNull();
    });
  });
});