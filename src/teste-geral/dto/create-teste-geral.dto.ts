import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  IsJSON,
  IsEmail,
  IsUrl,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status, Categoria } from '@prisma/client';

export class CreateTesteGeralDto {
  @ApiProperty({ description: 'Nome do registro' })
  @IsString()
  @Length(3, 100)
  nome: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descricao?: string;

  @ApiProperty({ description: 'Valor decimal com 2 casas', example: 99.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  valorDecimal: number;

  @ApiProperty({ description: 'Valor inteiro', example: 42 })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  valorInteiro: number;

  @ApiProperty({ description: 'Valor float', example: 3.14159 })
  @IsNumber()
  valorFloat: number;

  @ApiPropertyOptional({ description: 'Status ativo', default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Status do registro', enum: Status, default: Status.ATIVO })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ description: 'Categoria do registro', enum: Categoria, default: Categoria.OUTROS })
  @IsOptional()
  @IsEnum(Categoria)
  categoria?: Categoria;

  @ApiPropertyOptional({ description: 'Data de vencimento', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  dataVencimento?: Date;

  @ApiPropertyOptional({ description: 'Hora de início', example: '2024-01-15T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  horaInicio?: Date;

  @ApiPropertyOptional({ description: 'Duração em minutos', example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  duracao?: number;

  @ApiPropertyOptional({ description: 'Tags associadas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadados em formato JSON' })
  @IsOptional()
  @IsJSON()
  metadados?: any;

  @ApiPropertyOptional({ description: 'Configuração em formato JSON' })
  @IsOptional()
  @IsJSON()
  configuracao?: any;

  @ApiPropertyOptional({ description: 'Email de contato' })
  @IsOptional()
  @IsEmail()
  @Length(5, 100)
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  @Matches(/^\+?[\d\s\-\(\)]+$/, { message: 'Telefone inválido' })
  telefone?: string;

  @ApiPropertyOptional({ description: 'Website' })
  @IsOptional()
  @IsUrl()
  @Length(10, 200)
  website?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  @Length(8, 10)
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  cep?: string;

  @ApiPropertyOptional({ description: 'Endereço em formato JSON' })
  @IsOptional()
  @IsJSON()
  endereco?: any;

  @ApiPropertyOptional({ description: 'Coordenadas em formato JSON' })
  @IsOptional()
  @IsJSON()
  coordenadas?: any;

  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  arquivoNome?: string;

  @ApiPropertyOptional({ description: 'Tamanho do arquivo em bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  arquivoTamanho?: number;

  @ApiPropertyOptional({ description: 'Tipo do arquivo' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  arquivoTipo?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo' })
  @IsOptional()
  @IsUrl()
  arquivoUrl?: string;

  @ApiPropertyOptional({ description: 'ID do tenant' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'ID do usuário que criou' })
  @IsOptional()
  @IsString()
  criadoPorId?: string;

  @ApiPropertyOptional({ description: 'ID do usuário que atualizou' })
  @IsOptional()
  @IsString()
  atualizadoPorId?: string;
}