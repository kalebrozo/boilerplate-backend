import { IsOptional, IsString, IsIn, IsNumberString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Número da página', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumberString()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumberString()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Campo para ordenação', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Termo de busca para filtro' })
  @IsOptional()
  @IsString()
  search?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }

  get orderBy(): any {
    return {
      [this.sortBy]: this.sortOrder,
    };
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}