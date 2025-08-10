import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status, Categoria } from '@prisma/client';

export class TesteGeralResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  descricao?: string;

  @ApiProperty({ type: 'number' })
  valorDecimal: number;

  @ApiProperty()
  valorInteiro: number;

  @ApiProperty({ type: 'number' })
  valorFloat: number;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ enum: Categoria })
  categoria: Categoria;

  @ApiProperty()
  dataCriacao: Date;

  @ApiProperty()
  dataAtualizacao: Date;

  @ApiPropertyOptional()
  dataVencimento?: Date;

  @ApiPropertyOptional()
  horaInicio?: Date;

  @ApiPropertyOptional()
  duracao?: number;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional()
  metadados?: any;

  @ApiPropertyOptional()
  configuracao?: any;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  telefone?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  cep?: string;

  @ApiPropertyOptional()
  endereco?: any;

  @ApiPropertyOptional()
  coordenadas?: any;

  @ApiPropertyOptional()
  arquivoNome?: string;

  @ApiPropertyOptional()
  arquivoTamanho?: number;

  @ApiPropertyOptional()
  arquivoTipo?: string;

  @ApiPropertyOptional()
  arquivoUrl?: string;

  @ApiPropertyOptional()
  tenantId?: string;

  @ApiPropertyOptional()
  criadoPorId?: string;

  @ApiPropertyOptional()
  atualizadoPorId?: string;

  @ApiPropertyOptional()
  criadoPor?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional()
  atualizadoPor?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional()
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
}