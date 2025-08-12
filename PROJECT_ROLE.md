# 📋 ROLE - Boilerplate SaaS Multi-Tenant

## 📌 Visão Geral
Este documento serve como guia completo para desenvolvimento, manutenção e criação de novos módulos no projeto SaaS Multi-Tenant boilerplate.

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios
```
boilerplate/
├── src/                          # Código fonte principal
│   ├── [módulo]/                # Cada módulo segue padrão consistente
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── create-[módulo].dto.ts
│   │   │   ├── update-[módulo].dto.ts
│   │   │   └── search-[módulo].dto.ts
│   │   ├── [módulo].controller.ts
│   │   ├── [módulo].service.ts
│   │   ├── [módulo].module.ts
│   │   ├── [módulo].policies.ts    # Opcional - autorização CASL
│   │   ├── [módulo].service.spec.ts
│   │   └── [módulo].controller.spec.ts  # Testes do controller
├── test/                        # Testes E2E
│   ├── [módulo].e2e-spec.ts
├── prisma/                      # Schema e migrations
└── scripts/                     # Scripts auxiliares
```

### Tecnologias Utilizadas
- **Framework**: NestJS v10
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Autenticação**: JWT + Passport
- **Autorização**: CASL
- **Testes**: Jest
- **Documentação**: Swagger

## 🚀 Como Criar um Novo Módulo

### 1. Estrutura Base do Módulo

#### 1.1 Criar estrutura de diretórios
```bash
mkdir src/[nome-modulo]
cd src/[nome-modulo]
mkdir dto
```

#### 1.2 Arquivos obrigatórios

**[módulo].policies.ts** (opcional - para autorização CASL)
```typescript
import { Injectable } from '@nestjs/common';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { User } from '@prisma/client';

@Injectable()
export class [NomeModulo]Policies {
  constructor(private caslAbilityFactory: CaslAbilityFactory) {}

  async canCreate(user: User, tenantId: string) {
    const ability = this.caslAbilityFactory.createForUser(user);
    return ability.can('create', '[NomeModulo]');
  }

  async canRead(user: User, tenantId: string) {
    const ability = this.caslAbilityFactory.createForUser(user);
    return ability.can('read', '[NomeModulo]');
  }

  async canUpdate(user: User, tenantId: string) {
    const ability = this.caslAbilityFactory.createForUser(user);
    return ability.can('update', '[NomeModulo]');
  }

  async canDelete(user: User, tenantId: string) {
    const ability = this.caslAbilityFactory.createForUser(user);
    return ability.can('delete', '[NomeModulo]');
  }
}
```

**dto/create-[módulo].dto.ts**
```typescript
import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Create[NomeModulo]Dto {
  @ApiProperty({ example: 'Nome do Módulo', description: 'Nome do registro' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Descrição detalhada', description: 'Descrição do registro' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Status ativo do registro' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

**dto/update-[módulo].dto.ts**
```typescript
import { PartialType } from '@nestjs/swagger';
import { Create[NomeModulo]Dto } from './create-[módulo].dto';

export class Update[NomeModulo]Dto extends PartialType(Create[NomeModulo]Dto) {}
```

**dto/search-[módulo].dto.ts**
```typescript
import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class Search[NomeModulo]Dto {
  @ApiPropertyOptional({ example: 'termo de busca', description: 'Termo para busca' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Número da página', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Itens por página', minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
```

**[módulo].service.ts**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create[NomeModulo]Dto, Update[NomeModulo]Dto } from './dto/[módulo].dto';
import { Search[NomeModulo]Dto } from './dto/search-[módulo].dto';

@Injectable()
export class [NomeModulo]Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: Create[NomeModulo]Dto, userId: string, tenantId: string) {
    return this.prisma.[nomeModulo].create({
      data: {
        ...createDto,
        userId,
        tenantId,
      },
    });
  }

  async search(searchDto: Search[NomeModulo]Dto, tenantId: string) {
    const { search, isActive, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.[nomeModulo].findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.[nomeModulo].count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const [nomeModulo] = await this.prisma.[nomeModulo].findFirst({
      where: { id, tenantId },
    });
    if (![nomeModulo]) {
      throw new NotFoundException('[NomeModulo] not found');
    }
    return [nomeModulo];
  }

  async update(id: string, updateDto: Update[NomeModulo]Dto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.[nomeModulo].update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.[nomeModulo].delete({
      where: { id },
    });
  }

  async toggleStatus(id: string, tenantId: string) {
    const [nomeModulo] = await this.findOne(id, tenantId);
    return this.prisma.[nomeModulo].update({
      where: { id },
      data: { isActive: ![nomeModulo].isActive },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, inactive] = await Promise.all([
      this.prisma.[nomeModulo].count({ where: { tenantId } }),
      this.prisma.[nomeModulo].count({ where: { tenantId, isActive: true } }),
      this.prisma.[nomeModulo].count({ where: { tenantId, isActive: false } }),
    ]);

    return { total, active, inactive };
  }
}
```

**[módulo].controller.ts**
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { [NomeModulo]Service } from './[módulo].service';
import { Create[NomeModulo]Dto } from './dto/create-[módulo].dto';
import { Update[NomeModulo]Dto } from './dto/update-[módulo].dto';
import { Search[NomeModulo]Dto } from './dto/search-[módulo].dto';

@ApiTags('[NomeModulo]s')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('[nome-modulo]s')
export class [NomeModulo]Controller {
  constructor(private readonly [nomeModulo]Service: [NomeModulo]Service) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo [nome-modulo]' })
  @ApiResponse({ status: 201, description: '[NomeModulo] criado com sucesso.' })
  @CheckPolicies((ability) => ability.can('create', '[NomeModulo]'))
  create(@Body() createDto: Create[NomeModulo]Dto, @Request() req) {
    return this.[nomeModulo]Service.create(createDto, req.user.id, req.user.tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar [nome-modulo]s com filtros' })
  @CheckPolicies((ability) => ability.can('read', '[NomeModulo]'))
  search(@Query() searchDto: Search[NomeModulo]Dto, @Request() req) {
    return this.[nomeModulo]Service.search(searchDto, req.user.tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de [nome-modulo]s' })
  @CheckPolicies((ability) => ability.can('read', '[NomeModulo]'))
  getStats(@Request() req) {
    return this.[nomeModulo]Service.getStats(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter [nome-modulo] por ID' })
  @CheckPolicies((ability) => ability.can('read', '[NomeModulo]'))
  findOne(@Param('id') id: string, @Request() req) {
    return this.[nomeModulo]Service.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar [nome-modulo]' })
  @CheckPolicies((ability) => ability.can('update', '[NomeModulo]'))
  update(
    @Param('id') id: string,
    @Body() updateDto: Update[NomeModulo]Dto,
    @Request() req,
  ) {
    return this.[nomeModulo]Service.update(id, updateDto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover [nome-modulo]' })
  @CheckPolicies((ability) => ability.can('delete', '[NomeModulo]'))
  remove(@Param('id') id: string, @Request() req) {
    return this.[nomeModulo]Service.remove(id, req.user.tenantId);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Alternar status do [nome-modulo]' })
  @CheckPolicies((ability) => ability.can('update', '[NomeModulo]'))
  toggleStatus(@Param('id') id: string, @Request() req) {
    return this.[nomeModulo]Service.toggleStatus(id, req.user.tenantId);
  }
}
```

**[módulo].module.ts**
```typescript
import { Module } from '@nestjs/common';
import { [NomeModulo]Service } from './[módulo].service';
import { [NomeModulo]Controller } from './[módulo].controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [[NomeModulo]Controller],
  providers: [[NomeModulo]Service],
})
export class [NomeModulo]Module {}
```

### 2. Adicionar ao AppModule

**src/app.module.ts**
```typescript
import { [NomeModulo]Module } from './[módulo]/[módulo].module';

@Module({
  imports: [
    // ... outros módulos
    [NomeModulo]Module,
  ],
})
export class AppModule {}
```

### 3. Atualizar Schema do Prisma

**prisma/schema.prisma**
```prisma
model [NomeModulo] {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("[nome_modulo]s")
}
```

### 4. Criar Testes

#### 4.1 Testes Unitários

**[módulo].service.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { [NomeModulo]Service } from './[módulo].service';
import { PrismaService } from '../prisma/prisma.service';
import { Create[NomeModulo]Dto } from './dto/create-[módulo].dto';
import { Update[NomeModulo]Dto } from './dto/update-[módulo].dto';

describe('[NomeModulo]Service', () => {
  let service: [NomeModulo]Service;
  let prisma: PrismaService;

  const mockPrismaService = {
    [nomeModulo]: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [NomeModulo]Service,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<[NomeModulo]Service>([NomeModulo]Service);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new [nome-modulo]', async () => {
      const createDto: Create[NomeModulo]Dto = { name: 'Test Name' };
      const expected = { id: '1', ...createDto, userId: 'user1', tenantId: 'tenant1' };
      
      mockPrismaService.[nomeModulo].create.mockResolvedValue(expected);

      const result = await service.create(createDto, 'user1', 'tenant1');
      expect(result).toEqual(expected);
      expect(mockPrismaService.[nomeModulo].create).toHaveBeenCalledWith({
        data: { ...createDto, userId: 'user1', tenantId: 'tenant1' },
      });
    });
  });

  describe('search', () => {
    it('should return paginated results', async () => {
      const searchDto = { page: 1, limit: 10 };
      const items = [{ id: '1', name: 'Test' }];
      const total = 1;
      
      mockPrismaService.[nomeModulo].findMany.mockResolvedValue(items);
      mockPrismaService.[nomeModulo].count.mockResolvedValue(total);

      const result = await service.search(searchDto, 'tenant1');
      expect(result.items).toEqual(items);
      expect(result.meta.total).toBe(total);
    });
  });

  describe('findOne', () => {
    it('should return [nome-modulo] when found', async () => {
      const expected = { id: '1', name: 'Test' };
      mockPrismaService.[nomeModulo].findFirst.mockResolvedValue(expected);

      const result = await service.findOne('1', 'tenant1');
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.[nomeModulo].findFirst.mockResolvedValue(null);

      await expect(service.findOne('1', 'tenant1')).rejects.toThrow(NotFoundException);
    });
  });
});
```

**[módulo].controller.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { [NomeModulo]Controller } from './[módulo].controller';
import { [NomeModulo]Service } from './[módulo].service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';

describe('[NomeModulo]Controller', () => {
  let controller: [NomeModulo]Controller;
  let service: [NomeModulo]Service;

  const mockService = {
    create: jest.fn(),
    search: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleStatus: jest.fn(),
    getStats: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user1',
      tenantId: 'tenant1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [[NomeModulo]Controller],
      providers: [
        {
          provide: [NomeModulo]Service,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<[NomeModulo]Controller>([NomeModulo]Controller);
    service = module.get<[NomeModulo]Service>([NomeModulo]Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new [nome-modulo]', async () => {
      const createDto = { name: 'Test' };
      const expected = { id: '1', ...createDto };
      
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto, mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith(createDto, 'user1', 'tenant1');
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const searchDto = { page: 1, limit: 10 };
      const expected = { items: [], meta: { total: 0 } };
      
      mockService.search.mockResolvedValue(expected);

      const result = await controller.search(searchDto, mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.search).toHaveBeenCalledWith(searchDto, 'tenant1');
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const expected = { total: 10, active: 8, inactive: 2 };
      mockService.getStats.mockResolvedValue(expected);

      const result = await controller.getStats(mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.getStats).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('findOne', () => {
    it('should return [nome-modulo] by id', async () => {
      const expected = { id: '1', name: 'Test' };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('1', mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith('1', 'tenant1');
    });
  });

  describe('update', () => {
    it('should update [nome-modulo]', async () => {
      const updateDto = { name: 'Updated' };
      const expected = { id: '1', ...updateDto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update('1', updateDto, mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.update).toHaveBeenCalledWith('1', updateDto, 'tenant1');
    });
  });

  describe('remove', () => {
    it('should remove [nome-modulo]', async () => {
      const expected = { id: '1', deleted: true };
      mockService.remove.mockResolvedValue(expected);

      const result = await controller.remove('1', mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.remove).toHaveBeenCalledWith('1', 'tenant1');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle status', async () => {
      const expected = { id: '1', isActive: false };
      mockService.toggleStatus.mockResolvedValue(expected);

      const result = await controller.toggleStatus('1', mockRequest);
      expect(result).toEqual(expected);
      expect(mockService.toggleStatus).toHaveBeenCalledWith('1', 'tenant1');
    });
  });
});
```

#### 4.2 Testes E2E
**test/[módulo].e2e-spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { testPrisma, setupFreshDatabase } from './test-setup';

describe('[NomeModulo]Controller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const { adminRole } = await setupFreshDatabase();
    
    // Registrar usuário admin
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Admin User',
        roleId: adminRole.id,
      });

    authToken = registerResponse.body.accessToken;
  });

  describe('POST /[nome-modulo]s', () => {
    it('should create a new [nome-modulo]', async () => {
      const createDto = {
        name: `Test ${Date.now()}`,
      };

      await request(app.getHttpServer())
        .post('/[nome-modulo]s')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);
    });
  });

  // Adicionar mais testes E2E
});
```

## 🔄 Processo de Desenvolvimento

### 1. Setup Inicial
```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# 3. Subir banco de dados
docker-compose up -d

# 4. Executar migrations
npm run prisma:migrate

# 5. Gerar cliente Prisma
npm run prisma:generate
```

### 2. Fluxo de Desenvolvimento
```bash
# 1. Criar nova branch
git checkout -b feature/novo-modulo

# 2. Desenvolver o módulo seguindo estrutura acima

# 3. Executar testes após cada mudança
npm test                    # Testes unitários
npm run test:watch          # Testes em watch mode
npm run test:e2e           # Testes E2E

# 4. Build antes de commit
npm run build

# 5. Verificar se aplicação inicia
npm run start:prod
```

### 3. Checklist de Validação

#### Antes de cada commit:
- [ ] Testes unitários passando (`npm test`)
- [ ] Testes E2E passando (`npm run test:e2e`)
- [ ] Build executando sem erros (`npm run build`)
- [ ] Aplicação iniciando em produção (`npm run start:prod`)
- [ ] Código segue padrão de nomenclatura
- [ ] Documentação Swagger atualizada
- [ ] DTOs com validações apropriadas
- [ ] Tratamento de erros implementado

#### Após criar novo módulo:
- [ ] Adicionar ao AppModule
- [ ] Atualizar schema.prisma
- [ ] Criar testes unitários
- [ ] Criar testes E2E
- [ ] Executar todas as suítes de teste
- [ ] Verificar documentação Swagger

## 🧪 Comandos de Teste

### Testes Unitários
```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:cov

# Teste específico
npm test -- [nome-arquivo].spec.ts
```

### Testes E2E
```bash
# Todos os testes E2E
npm run test:e2e

# Teste específico E2E
npm run test:e2e -- test/[arquivo].e2e-spec.ts

# Testes em modo debug
npm run test:debug
```

## 🚀 Comandos de Build e Deploy

### Build
```bash
# Build completo
npm run build

# Verificar arquivos gerados
ls dist/src/
```

### Deploy
```bash
# Produção
npm run start:prod

# Desenvolvimento
npm run start:dev

# Debug
npm run start:debug
```

## 📊 Monitoramento

### Logs
- **Desenvolvimento**: Console com nível `debug`
- **Produção**: Logs estruturados com nível `info`

### Health Check
```bash
curl http://localhost:3003/health
```

### Documentação API
- **Swagger UI**: http://localhost:3003/api-docs
- **JSON Schema**: http://localhost:3003/api-json

## 🆘 Solução de Problemas

### Problemas Comuns

#### "Module not found" no start:prod
**Causa**: Caminho incorreto no package.json
**Solução**: Verificar se `start:prod` aponta para `dist/src/main`

#### Testes falhando
**Causa**: Estado compartilhado entre testes
**Solução**: Executar com `maxWorkers: 1` no jest-e2e.json

#### Erros de chave estrangeira
**Causa**: Ordem de execução dos testes
**Solução**: Usar `setupFreshDatabase()` em cada teste E2E

### Debug
```bash
# Verificar banco de dados
npm run prisma:studio

# Logs detalhados
DEBUG=* npm run start:dev
```

## 🎯 Boas Práticas e Dicas

### Verificação de Testes
Para garantir que seus testes estão sendo executados corretamente:

```bash
# Verificar se todos os testes do módulo estão rodando
npm test -- src/[nome-modulo]/ --verbose

# Verificar testes unitários específicos
npm test -- src/[nome-modulo]/[nome-modulo].service.spec.ts
npm test -- src/[nome-modulo]/[nome-modulo].controller.spec.ts

# Verificar testes E2E do módulo
npm run test:e2e -- test/[nome-modulo].e2e-spec.ts
```

### Estrutura de Arquivos Recomendada
```
[nome-modulo]/
├── dto/
│   ├── create-[nome-modulo].dto.ts
│   ├── update-[nome-modulo].dto.ts
│   ├── search-[nome-modulo].dto.ts
│   └── index.ts (exportar todos os DTOs)
├── [nome-modulo].controller.ts
├── [nome-modulo].service.ts
├── [nome-modulo].module.ts
├── [nome-modulo].policies.ts (se usar CASL)
├── [nome-modulo].controller.spec.ts
└── [nome-modulo].service.spec.ts
```

### Common Issues e Soluções

#### Testes não encontrados
**Sintoma**: Arquivos `.spec.ts` não são executados
**Solução**: Verificar se o arquivo está dentro de `src/` e segue o padrão `*.spec.ts`

#### Erros de importação
**Sintoma**: Módulos não encontrados
**Solução**: Verificar se todos os imports estão corretos e se o módulo foi adicionado ao `AppModule`

#### Erros de tipagem no Prisma
**Sintoma**: Propriedades não existem no modelo
**Solução**: Executar `npm run prisma:generate` após atualizar o schema

#### Testes falhando com guards
**Sintoma**: Guards não encontrados ou erro de autenticação
**Solução**: Usar mocks apropriados nos testes unitários

### Debug de Testes
```bash
# Executar testes em modo debug
npm test -- --runInBand --detectOpenHandles --verbose

# Verificar coverage
npm run test:cov

# Executar testes específicos com pattern
npm test -- --testNamePattern="[NomeModulo]"
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar este documento
2. Executar checklist de validação
3. Consultar logs de erro
4. Verificar estrutura de arquivos
5. Testar em ambiente isolado
6. Verificar exemplos no módulo `teste-geral`

### Comandos Úteis de Debug
```bash
# Verificar estrutura do banco
npm run prisma:studio

# Verificar se a aplicação está rodando
npm run start:dev

# Verificar build
npm run build

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

**Última atualização**: $(date +"%d/%m/%Y")
**Versão**: 2.0.0
**Status**: ✅ Documentação atualizada com base em implementações reais