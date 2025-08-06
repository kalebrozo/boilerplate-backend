import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Action {
  MANAGE = 'manage',
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Action type',
    enum: Action,
    example: Action.READ,
  })
  @IsEnum(Action)
  action: Action;

  @ApiProperty({
    description: 'Subject/resource',
    example: 'User',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;
}

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Action type',
    enum: Action,
    example: Action.READ,
    required: false,
  })
  @IsEnum(Action)
  @IsOptional()
  action?: Action;

  @ApiProperty({
    description: 'Subject/resource',
    example: 'User',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  subject?: string;
}