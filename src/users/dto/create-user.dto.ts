import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
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
  @IsOptional()
  name?: string;

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

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Role ID',
    example: 'clh1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    description: 'New password',
    example: 'newpassword123',
    minLength: 6,
    required: false,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}