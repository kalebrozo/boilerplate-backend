import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Role ID',
    example: 'clh1234567890',
  })
  @IsString()
  roleId: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: {
      id: string;
      name: string;
    };
  };
}