Prompt Aprimorado para Geração de Backend SaaS Multi-Tenant com NestJS
Objetivo: Gerar a estrutura de um projeto de backend robusto, modular e multi-tenant utilizando NestJS e PostgreSQL. O projeto deve servir como uma base (boilerplate) de nível profissional para futuras aplicações SaaS, incorporando boas práticas de segurança, auditoria e manutenibilidade.

Você é: Um arquiteto de software e desenvolvedor backend sênior, especialista em NestJS, arquitetura de software, segurança e práticas de DevOps.

Siga estritamente as seguintes especificações:

1. Stack de Tecnologia Principal
Framework: NestJS (v10 ou superior)

Linguagem: TypeScript

Banco de Dados: PostgreSQL

ORM: Prisma

Autenticação: Passport.js com estratégia JWT (passport-jwt)

Autorização: CASL (@casl/ability) para controle de acesso baseado em atributos (ABAC).

Configuração: @nestjs/config para gestão de variáveis de ambiente.

Validação: class-validator e class-transformer.

Documentação: @nestjs/swagger para geração de documentação OpenAPI.

Health Checks: @nestjs/terminus para monitoramento de saúde da aplicação.

2. Arquitetura de Multi-Tenancy
Implemente uma estratégia de "Schema por Tenant".

Identificação do Tenant: O tenant será identificado através de um header HTTP customizado em cada requisição: x-tenant-id.

Banco de Dados:

Haverá um schema public principal que conterá a tabela de tenants.

Cada tenant terá seu próprio schema no mesmo banco de dados (ex: tenant_a, tenant_b).

Conexão com Prisma: Crie um provedor de Prisma "request-scoped" (TenantPrismaProvider) que dinamicamente cria uma instância do PrismaClient com a URL de conexão apontando para o schema correto (?schema=<tenant_id>), lendo o ID do tenant a partir do header da requisição.

3. Estrutura de Módulos e Arquivos
Gere a estrutura de pastas e o código completo para os seguintes módulos:

ConfigModule e main.ts: Configure o ConfigModule para ser global e carregar variáveis de ambiente de um arquivo .env. No arquivo main.ts, configure um ValidationPipe global, o Graceful Shutdown, e a inicialização do Swagger.

PrismaModule: Contendo o PrismaService (para o schema public) e o TenantPrismaProvider.

AuthModule: Com controllers para login, register, me, e lógicas de serviço para hash de senhas (bcrypt) e geração de JWT. Inclua JwtStrategy, LocalStrategy, JwtAuthGuard e um decorator @CurrentUser.

CaslModule: Contendo a CaslAbilityFactory e um PoliciesGuard para verificar permissões de forma declarativa nas rotas.

UsersModule e RolesModule: CRUDs completos para User e Role, protegidos pelo PoliciesGuard.

TenantsModule: CRUD para a entidade Tenant (usando o Prisma do schema public). O serviço de criação de tenant deve ser responsável por criar o novo schema no banco e rodar as migrações do Prisma para ele.

PaymentsModule (Placeholder): Um módulo de exemplo com serviços e controllers que simulam chamadas a gateways de pagamento.

3.g) Módulo de Auditoria Detalhada (AuditModule) - REQUISITO ESSENCIAL
Este módulo é crucial e deve ser implementado de forma robusta.

Decorator @Auditable: Crie um decorator de método customizado chamado @Auditable(action: string, subject: string). Este decorator será usado nas rotas do controller para marcar que uma ação deve ser auditada. Ex: @Auditable('CREATE_USER', 'User').

AuditInterceptor:

Crie um interceptor que verifica se o método do handler possui o metadado @Auditable.

Se possuir, o interceptor deve capturar:

userId: Do usuário autenticado via JWT (request.user.id).

tenantId: Do header x-tenant-id.

action e subject: Dos metadados providos pelo decorator @Auditable.

dataBefore: (Importante) Antes de executar o handler, o interceptor deve usar o id dos parâmetros da requisição para buscar o estado atual da entidade no banco e armazená-lo. Para uma ação de CREATE, este campo será nulo.

dataAfter: Após o handler ser executado com sucesso, o interceptor deve capturar o corpo da resposta, que representa o novo estado da entidade. Para uma ação de DELETE, este campo pode ser nulo ou o estado antes da deleção.

clientInfo: Um objeto JSON contendo ip: request.ip e userAgent: request.headers['user-agent'].

O interceptor então chama um AuditService para salvar todas essas informações no banco de dados de forma assíncrona (sem bloquear a resposta para o usuário).

AuditService: Serviço simples que recebe os dados do interceptor e cria uma entrada no banco na tabela AuditLog.

Aplicação: Aplique o decorator @Auditable em todos os endpoints de CRUD dos módulos UsersModule, RolesModule e TenantsModule.

4. Sugestões Adicionais para um Boilerplate Robusto (Melhorias Essenciais)
Integre as seguintes funcionalidades para elevar a qualidade do boilerplate:

a) Gestão de Configuração Centralizada (@nestjs/config): Use este módulo para gerenciar todas as variáveis de ambiente (DATABASE_URL, JWT_SECRET, etc.), incluindo validação para garantir que as variáveis necessárias existam na inicialização.

b) Validação de Dados de Entrada (Global ValidationPipe): Em main.ts, configure app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) para garantir que todos os dados de entrada (DTOs) sejam automaticamente validados e limpos.

c) Documentação de API Automatizada (@nestjs/swagger): Configure o Swagger em main.ts para gerar uma documentação interativa da API a partir dos controllers e DTOs. A documentação deve estar disponível em /api-docs.

d) Filtro de Exceção Global: Crie um HttpExceptionFilter global que captura todas as exceções HTTP e as formata em uma resposta JSON padronizada, como { statusCode, message, timestamp, path }.

e) Health Checks para Monitoramento (@nestjs/terminus): Crie um HealthModule com um controller em /health que use o Terminus para verificar o status do banco de dados (PrismaHealthIndicator) e da aplicação em geral.

f) Encerramento Suave (Graceful Shutdown): Em main.ts, habilite os "shutdown hooks" (app.enableShutdownHooks()) para garantir que o aplicativo finalize conexões e processos de forma limpa ao receber sinais de término (como SIGTERM de um container orchestrator).

5. Schema do Prisma Aprimorado (prisma/schema.prisma)
Gere o schema abaixo. A tabela AuditLog foi atualizada para incluir os novos campos.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  password  String
  role      Role      @relation(fields: [roleId], references: [id])
  roleId    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  users       User[]
  permissions Permission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Permission {
  id        String   @id @default(cuid())
  action    String
  subject   String
  roles     Role[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([action, subject])
}

// Modelo de Auditoria Aprimorado
model AuditLog {
  id          String   @id @default(cuid())
  userId      String   // Quem fez a ação
  tenantId    String   // Em qual tenant
  action      String   // O que foi feito (Ex: 'CREATE_USER')
  subject     String   // Em qual tipo de entidade (Ex: 'User')
  subjectId   String   // ID da entidade afetada
  dataBefore  Json?    // Estado da entidade ANTES da mudança
  dataAfter   Json?    // Estado da entidade DEPOIS da mudança
  clientInfo  Json?    // { ip, userAgent }
  createdAt   DateTime @default(now())
}

6. Dependências a Incluir
Gere um package.json que inclua as seguintes dependências principais:

Dependências: @nestjs/common, @nestjs/core, @nestjs/config, @nestjs/jwt, @nestjs/passport, @nestjs/swagger, @nestjs/terminus, class-validator, class-transformer, passport, passport-jwt, passport-local, @casl/ability, @prisma/client, bcrypt, pg.

Dependências de Desenvolvimento: @nestjs/cli, @nestjs/schematics, @nestjs/testing, @types/node, @types/passport-jwt, @types/bcrypt, prisma, ts-node, typescript.

7. Instruções Finais
Gere a estrutura completa de pastas e o código para cada um dos arquivos .ts e .prisma. O código deve ser de alta qualidade, seguir as convenções do NestJS, incluir JSDoc/comentários onde for complexo, e estar pronto para execução. Ao final, liste os comandos para um "Quick Start", incluindo instalação, configuração do .env, criação da migração inicial do schema public e como rodar a aplicação.