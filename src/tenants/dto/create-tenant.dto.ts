import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Database schema name',
    example: 'acme_corp',
  })
  @IsString()
  @IsNotEmpty()
  schema: string;
}

export class UpdateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Corporation',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  name?: string;
}