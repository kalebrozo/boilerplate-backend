import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/login.dto';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private metricsService: MetricsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    let user: any;
    
    try {
      if (loginDto.email && loginDto.password) {
        user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
          this.metricsService.incrementAuthAttempts('failure', 'jwt');
          throw new UnauthorizedException('Invalid credentials');
        }
      } else {
        this.metricsService.incrementAuthAttempts('failure', 'jwt');
        throw new UnauthorizedException('Invalid credentials');
      }
    } catch (error) {
      this.metricsService.incrementAuthAttempts('failure', 'jwt');
      throw error;
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role.name 
    };
    
    this.metricsService.incrementAuthAttempts('success', 'jwt');
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
      },
    };
  }

  async loginWithUser(user: any): Promise<AuthResponseDto> {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role.name 
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
        roleId: registerDto.roleId,
      },
      include: { role: true },
    });

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role.name 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
      },
    };
  }

  async validateUserById(id: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }
}