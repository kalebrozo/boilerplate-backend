# Sistema de Cache Redis

## Visão Geral

O sistema de cache Redis foi implementado para melhorar a performance da aplicação, reduzindo consultas desnecessárias ao banco de dados e proporcionando respostas mais rápidas aos usuários.

## Configuração

### Docker Compose

O Redis está configurado no `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: saas-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  restart: unless-stopped
  command: redis-server --appendonly yes --requirepass redis_password
```

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
```

## Arquitetura

### Módulos Principais

1. **RedisCacheModule** (`src/cache/cache.module.ts`)
   - Configuração global do cache
   - Integração com Redis usando `cache-manager-redis-yet`

2. **CacheService** (`src/cache/cache.service.ts`)
   - Métodos para manipulação direta do cache
   - Invalidação inteligente por padrões
   - Geração de chaves padronizadas

3. **CacheInterceptor** (`src/cache/cache.interceptor.ts`)
   - Cache automático para métodos GET
   - Invalidação automática para métodos POST/PUT/PATCH/DELETE
   - Decorators `@UseCache` e `@InvalidateCache`

## Como Usar

### 1. Cache Automático com Decorators

#### Para métodos GET (leitura):

```typescript
@Get()
@UseCache(300) // Cache por 5 minutos
async findAll(@Query() pagination: PaginationDto) {
  return this.usersService.findAll(pagination);
}

@Get(':id')
@UseCache(600) // Cache por 10 minutos
async findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

#### Para métodos de modificação (POST/PUT/PATCH/DELETE):

```typescript
@Post()
@InvalidateCache(['*:tenant:{tenantId}:*user*', '*:tenant:{tenantId}:*list*'])
async create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}

@Patch(':id')
@InvalidateCache(['*:tenant:{tenantId}:*user*', '*:user:{id}:*'])
async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  return this.usersService.update(id, updateUserDto);
}
```

### 2. Cache Manual no Service

```typescript
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async findUserProfile(userId: string, tenantId: string) {
    const cacheKey = this.cacheService.generateUserKey(userId, 'profile', tenantId);
    
    // Tentar buscar do cache
    let profile = await this.cacheService.get(cacheKey);
    
    if (!profile) {
      // Se não encontrou, buscar do banco
      profile = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, tenant: true }
      });
      
      // Armazenar no cache por 10 minutos
      await this.cacheService.set(cacheKey, profile, 600);
    }
    
    return profile;
  }

  async updateUser(userId: string, data: any, tenantId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    
    // Invalidar cache relacionado ao usuário
    await this.cacheService.invalidateUser(userId, tenantId);
    
    return user;
  }
}
```

## Padrões de Chaves

O sistema usa padrões padronizados para chaves de cache:

### Chaves Automáticas (Interceptor)
- `api:tenant:{tenantId}:user:{userId}:{controller}:{method}:{url}:{query}:{params}`

### Chaves Manuais (Service)
- **Entidade específica**: `entity:tenant:{tenantId}:{entityName}:{entityId}`
- **Lista de entidades**: `list:tenant:{tenantId}:{entityName}:page-{page}:limit-{limit}:{filters}`
- **Dados de usuário**: `user:tenant:{tenantId}:user:{userId}:{dataType}`

## Invalidação de Cache

### Padrões de Invalidação

1. **Por Tenant**: `*:tenant:{tenantId}:*`
2. **Por Usuário**: `*:user:{userId}:*`
3. **Por Entidade**: `*:{entityName}:{entityId}:*`
4. **Listas**: `*:list:*`

### Placeholders Suportados

- `{tenantId}` - ID do tenant atual
- `{userId}` - ID do usuário atual
- `{id}` - ID do parâmetro da URL
- `{entityId}` - ID da entidade sendo modificada

## Fluxo de Atualização em Tempo Real

### Cenário: Usuário atualiza seus dados

1. **Request**: `PATCH /users/123`
2. **Interceptor**: Detecta decorator `@InvalidateCache`
3. **Execução**: Método do service é executado
4. **Invalidação**: Cache relacionado é removido automaticamente
5. **Próxima consulta**: Dados atualizados são buscados do banco e cacheados

### Exemplo Prático

```typescript
// 1. Usuário faz GET /users/123 (primeira vez)
// Cache MISS -> Busca no banco -> Armazena no cache

// 2. Usuário faz GET /users/123 (segunda vez)
// Cache HIT -> Retorna do cache (mais rápido)

// 3. Usuário faz PATCH /users/123 (atualização)
// Executa update -> Invalida cache automaticamente

// 4. Usuário faz GET /users/123 (após atualização)
// Cache MISS -> Busca dados atualizados -> Armazena no cache
```

## Monitoramento

### Logs de Cache

O sistema registra automaticamente:
- Cache HIT/MISS
- Operações de SET/DEL
- Invalidações por padrão
- Erros de cache

### Métricas Disponíveis

```typescript
// Verificar status do cache
const cacheStats = await this.cacheService.get('cache:stats');

// Limpar todo o cache (desenvolvimento)
await this.cacheService.reset();
```

## Boas Práticas

### 1. TTL (Time To Live)
- **Dados frequentemente alterados**: 1-5 minutos
- **Dados estáveis**: 10-30 minutos
- **Dados raramente alterados**: 1-24 horas

### 2. Invalidação
- Use padrões específicos para evitar invalidação excessiva
- Invalide sempre após operações de escrita
- Considere invalidação em cascata para dados relacionados

### 3. Chaves de Cache
- Use chaves descritivas e padronizadas
- Inclua tenant/user ID para isolamento
- Evite chaves muito longas

### 4. Tratamento de Erros
- Cache nunca deve quebrar a aplicação
- Sempre tenha fallback para busca no banco
- Log erros de cache para monitoramento

## Comandos Úteis

### Iniciar Redis com Docker
```bash
docker-compose up redis -d
```

### Conectar ao Redis CLI
```bash
docker exec -it saas-redis redis-cli
auth redis_password
```

### Comandos Redis Úteis
```redis
# Listar todas as chaves
KEYS *

# Buscar chaves por padrão
KEYS *user*

# Ver valor de uma chave
GET chave

# Deletar uma chave
DEL chave

# Limpar todo o cache
FLUSHALL

# Ver informações do servidor
INFO
```

## Troubleshooting

### Problemas Comuns

1. **Redis não conecta**
   - Verificar se o container está rodando
   - Verificar variáveis de ambiente
   - Verificar senha do Redis

2. **Cache não funciona**
   - Verificar se o módulo está importado
   - Verificar se os decorators estão aplicados
   - Verificar logs de erro

3. **Dados desatualizados**
   - Verificar se a invalidação está configurada
   - Verificar padrões de invalidação
   - Considerar reduzir TTL

### Debug

```typescript
// Habilitar logs de debug
this.logger.debug('Cache operation', { key, operation, result });

// Verificar se chave existe
const exists = await this.cacheService.get(key);
console.log('Cache exists:', !!exists);
```

## Próximos Passos

1. **Métricas Avançadas**: Implementar coleta de métricas de cache
2. **Cache Distribuído**: Configurar cluster Redis para alta disponibilidade
3. **Cache Warming**: Implementar pré-carregamento de dados críticos
4. **Compressão**: Adicionar compressão para dados grandes
5. **Particionamento**: Implementar sharding para grandes volumes