# Multi-Tenant NestJS API Boilerplate

Um boilerplate completo para construir APIs multi-tenant com NestJS, incluindo autenticação JWT, controle de acesso baseado em papéis (RBAC), auditoria de eventos e gerenciamento de tenants.

## Funcionalidades

- ✅ **Multi-tenancy** com schemas isolados no PostgreSQL
- ✅ **Autenticação JWT** com refresh tokens
- ✅ **Controle de acesso** com CASL (RBAC + ABAC)
- ✅ **Auditoria** de todas as operações críticas
- ✅ **Gerenciamento de tenants** com criação dinâmica de schemas
- ✅ **Swagger/OpenAPI** documentação automática
- ✅ **Validação** com class-validator
- ✅ **Tratamento de erros** global
- ✅ **Logging** estruturado

## Stack Tecnológica

- **Framework**: NestJS
- **ORM**: Prisma
- **Banco de dados**: PostgreSQL
- **Autenticação**: JWT (passport-jwt)
- **Autorização**: CASL
- **Documentação**: Swagger
- **Validação**: class-validator
- **Testes**: Jest (configuração básica)

## Instalação

### Pré-requisitos

- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd boilerplate
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados**
   ```bash
   # Crie um banco PostgreSQL
   createdb boilerplate
   
   # Configure as variáveis de ambiente
   cp .env.example .env
   # Edite .env com suas configurações
   ```

4. **Configure o Prisma**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Inicie o servidor**
   ```bash
   # Desenvolvimento
   npm run start:dev
   
   # Produção
   npm run build
   npm run start:prod
   ```

## Estrutura do Projeto

```
src/
├── auth/              # Módulo de autenticação
├── audit/             # Módulo de auditoria
├── casl/              # Controle de acesso
├── common/            # Utilitários comuns
├── permissions/       # Gerenciamento de permissões
├── prisma/            # Configuração do Prisma
├── roles/             # Gerenciamento de papéis
├── tenants/           # Gerenciamento de tenants
└── users/             # Gerenciamento de usuários
```

## Uso

### Criando um Tenant

```bash
curl -X POST http://localhost:3003/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Cliente Exemplo",
    "schema": "cliente_exemplo"
  }'
```

### Registro de Usuário

```bash
curl -X POST http://localhost:3003/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: cliente_exemplo" \
  -d '{
    "email": "usuario@exemplo.com",
    "name": "Usuário Exemplo",
    "password": "senha123",
    "roleId": "<role-id>"
  }'
```

### Login

```bash
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: cliente_exemplo" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### Documentação da API

Acesse a documentação completa em: `http://localhost:3003/api-docs`

## Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Prisma
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Lint
npm run lint
npm run lint:fix
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato.