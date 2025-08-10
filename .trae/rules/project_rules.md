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
│   │   ├── [módulo].controller.ts
│   │   ├── [módulo].service.ts
│   │   ├── [módulo].module.ts
│   │   └── [módulo].service.spec.ts
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

**[módulo].entity.ts** (se necessário)
```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class [NomeModulo] {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

**[módulo].dto.ts**
```typescript
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create[NomeModulo]Dto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class Update[NomeModulo]Dto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;
}
```

**[módulo].service.ts**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create[NomeModulo]Dto, Update[NomeModulo]Dto } from './dto/[módulo].dto';

@Injectable()
export class [NomeModulo]Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: Create[NomeModulo]Dto) {
    return this.prisma.[nomeModulo].create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.[nomeModulo].findMany();
  }

  async findOne(id: string) {
    const [nomeModulo] = await this.prisma.[nomeModulo].findUnique({
      where: { id },
    });
    if (![nomeModulo]) {
      throw new NotFoundException('[NomeModulo] not found');
    }
    return [nomeModulo];
  }

  async update(id: string, updateDto: Update[NomeModulo]Dto) {
    await this.findOne(id);
    return this.prisma.[nomeModulo].update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.[nomeModulo].delete({
      where: { id },
    });
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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import [NomeModulo]Service from './[módulo].service';
import { Create[NomeModulo]Dto, Update[NomeModulo]Dto } from './dto/[módulo].dto';

@ApiTags('[NomeModulo]s')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('[nome-modulo]s')
export class [NomeModulo]Controller {
  constructor(private readonly [nomeModulo]Service: [NomeModulo]Service) {}

  @Post()
  create(@Body() createDto: Create[NomeModulo]Dto) {
    return this.[nomeModulo]Service.create(createDto);
  }

  @Get()
  findAll() {
    return this.[nomeModulo]Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.[nomeModulo]Service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: Update[NomeModulo]Dto) {
    return this.[nomeModulo]Service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.[nomeModulo]Service.remove(id);
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
import { [NomeModulo]Service } from './[módulo].service';
import { PrismaService } from '../prisma/prisma.service';

describe('[NomeModulo]Service', () => {
  let service: [NomeModulo]Service;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [NomeModulo]Service,
        {
          provide: PrismaService,
          useValue: {
            [nomeModulo]: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<[NomeModulo]Service>([NomeModulo]Service);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Adicionar mais testes conforme necessário
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
curl http://localhost:3000/health
```

### Documentação API
- **Swagger UI**: http://localhost:3000/api-docs
- **JSON Schema**: http://localhost:3000/api-json

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

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar este documento
2. Executar checklist de validação
3. Consultar logs de erro
4. Verificar estrutura de arquivos
5. Testar em ambiente isolado

---

**Última atualização**: [Data atual]
**Versão**: 1.0.0
**Status**: ✅ Projeto funcional e testado