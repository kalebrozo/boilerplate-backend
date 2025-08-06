import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Permission IDs',
    example: ['perm1', 'perm2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'admin',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Permission IDs',
    example: ['perm1', 'perm2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}