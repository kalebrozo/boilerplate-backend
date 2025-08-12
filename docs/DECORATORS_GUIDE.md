# 📋 Guia de Decorators Avançados

Este guia explica como usar os novos decorators criados para o sistema SaaS Multi-Tenant.

## 🚀 Decorators Disponíveis

### 1. Rate Limiting (@RateLimit)

Controla o número de requisições por período de tempo.

#### Uso Básico
```typescript
@RateLimit(100, 60) // 100 requisições por 60 segundos
@Get('endpoint')
async myEndpoint() {
  // seu código aqui
}
```

#### Decorators Pré-definidos
```typescript
// Rate limits por nível
@RateLimitLow()    // 10 req/min
@RateLimitMedium() // 50 req/min
@RateLimitHigh()   // 100 req/min

// Rate limits por usuário/tenant
@RateLimitPerUser(20, 60)   // 20 req/min por usuário
@RateLimitPerTenant(100, 60) // 100 req/min por tenant
```

#### Opções Avançadas
```typescript
@RateLimit(50, 60, {
  keyGenerator: 'user', // 'ip' | 'user' | 'tenant' | 'user-endpoint' | 'tenant-endpoint'
  message: 'Muitas requisições, tente novamente em alguns minutos',
  skipHeaders: false, // incluir headers X-RateLimit-*
  keyPrefix: 'api_v1' // prefixo personalizado
})
```

### 2. Cache (@Cache)

Implementa cache automático para endpoints.

#### Uso Básico
```typescript
@Cache({ ttl: 300 }) // Cache por 5 minutos
@Get('data')
async getData() {
  return this.service.getData();
}
```

#### Decorators Pré-definidos
```typescript
@CacheShort()   // 60 segundos
@CacheMedium()  // 300 segundos (5 min)
@CacheLong()    // 3600 segundos (1 hora)

@CachePerUser()   // Cache específico por usuário
@CachePerTenant() // Cache específico por tenant
@CacheGlobal()    // Cache global (sem isolamento)
```

#### Opções Avançadas
```typescript
@Cache({
  ttl: 600,
  key: 'custom_key_{id}', // chave personalizada
  includeTenant: true,    // incluir tenant na chave
  includeUser: false,     // incluir usuário na chave
  includeQuery: true,     // incluir parâmetros de query
  includeRoute: true,     // incluir parâmetros da rota
  skipOnError: true       // não cachear em caso de erro
})
```

#### Invalidação de Cache
```typescript
@CacheInvalidate({
  patterns: ['users:*', 'user_stats:*']
})
@Post('create')
async create() {
  // Cache será invalidado após execução
}

// Decorators específicos
@InvalidateTenantCache({ patterns: ['data:*'] })
@InvalidateUserCache({ patterns: ['profile:*'] })
@InvalidateCache({ patterns: ['global:*'] })
```

### 3. Métricas (@Metrics)

Coleta métricas automáticas dos endpoints.

#### Uso Básico
```typescript
@Metrics('endpoint_name')
@Get('data')
async getData() {
  return this.service.getData();
}
```

#### Decorators Pré-definidos
```typescript
@MetricsCounter()    // Apenas contador
@MetricsHistogram()  // Apenas duração
@MetricsGauge()      // Apenas gauge

@MetricsBasic()      // Contador + duração
@MetricsDetailed()   // Todas as métricas
@MetricsPerformance() // Foco em performance
@MetricsUsage()      // Foco em uso

@MetricsPerTenant()  // Métricas por tenant
@MetricsPerUser()    // Métricas por usuário
@MetricsGlobal()     // Métricas globais
```

#### Opções Avançadas
```typescript
@Metrics('custom_metric', {
  description: 'Descrição da métrica',
  labels: { service: 'user-service' }, // labels customizados
  includeMethod: true,     // incluir método HTTP
  includeEndpoint: true,   // incluir endpoint
  includeStatus: true,     // incluir status code
  includeTenant: true,     // incluir tenant
  includeUser: false,      // incluir usuário
  collectCounter: true,    // coletar contador
  collectDuration: true,   // coletar duração
  collectGauge: false      // coletar gauge
})
```

### 4. Tenant (@Tenant)

Implementa isolamento automático de tenant.

#### Uso Básico
```typescript
@Tenant()
@Get('data')
async getData(@Request() req) {
  // Isolamento automático por tenant
  return this.service.getData(req.user.tenantId);
}
```

#### Decorators Pré-definidos
```typescript
@TenantStrict()     // Isolamento rigoroso + validação
@TenantValidated()  // Apenas validação
@TenantIsolated()   // Apenas isolamento
@TenantLogged()     // Com logs de acesso
@TenantMetrics()    // Com coleta de métricas
```

#### Opções Avançadas
```typescript
@Tenant({
  isolate: true,              // aplicar isolamento
  validate: true,             // validar tenant ID
  allowCrossTenant: false,    // permitir acesso cross-tenant
  tenantField: 'tenantId',    // campo do tenant
  autoFilter: true,           // filtro automático
  logAccess: true,            // log de acessos
  collectMetrics: true,       // coletar métricas
  tenantIdPattern: '^[a-z0-9-]+$' // padrão do tenant ID
})
```

## 🔧 Combinando Decorators

Você pode combinar múltiplos decorators para funcionalidade completa:

```typescript
@Controller('users')
export class UsersController {
  
  @Get('search')
  @RateLimitHigh()                    // Rate limit alto
  @CacheMedium({                      // Cache médio
    includeQuery: true,
    includeTenant: true
  })
  @MetricsPerUser('user_search')      // Métricas por usuário
  @TenantValidated()                  // Validação de tenant
  async search(@Query() searchDto: SearchDto, @Request() req) {
    return this.service.search(searchDto, req.user.tenantId);
  }
  
  @Post()
  @RateLimitPerUser(10, 60)           // 10 criações por usuário/min
  @CacheInvalidate({                  // Invalidar cache
    patterns: ['users:*', 'stats:*']
  })
  @MetricsPerformance('user_creation') // Métricas de performance
  @TenantStrict()                     // Isolamento rigoroso
  async create(@Body() createDto: CreateDto, @Request() req) {
    return this.service.create(createDto, req.user.id, req.user.tenantId);
  }
}
```

## 📊 Métricas Coletadas

As métricas são automaticamente coletadas e disponibilizadas no endpoint `/metrics`:

### Contadores
- `saas_boilerplate_requests_total` - Total de requisições
- `saas_boilerplate_errors_total` - Total de erros
- `saas_boilerplate_tenant_requests_total` - Requisições por tenant

### Histogramas
- `saas_boilerplate_request_duration_seconds` - Duração das requisições
- `saas_boilerplate_error_duration_seconds` - Duração de requisições com erro
- `saas_boilerplate_tenant_response_size` - Tamanho das respostas por tenant

### Gauges
- `saas_boilerplate_gauge` - Valores customizados

## 🔍 Headers de Resposta

### Rate Limiting
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 45
X-RateLimit-Reset-Time: 2024-01-01T12:00:45.000Z
Retry-After: 45 (apenas quando limite excedido)
```

### Cache
```
X-Cache-Hit: true/false
X-Cache-TTL: 300
X-Cache-Key: cache:users:tenant123:search:page1
```

### Métricas
```
X-Metrics-Collected: true
```

## 🚨 Tratamento de Erros

### Rate Limit Excedido
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "retryAfter": 45
}
```

### Tenant Inválido
```json
{
  "statusCode": 400,
  "message": "Tenant ID is required",
  "error": "Bad Request"
}
```

### Acesso Cross-Tenant Negado
```json
{
  "statusCode": 403,
  "message": "Access to other tenant data is not allowed",
  "error": "Forbidden"
}
```

## 🔧 Configuração

Para usar os decorators, certifique-se de que o `CommonModule` está importado no seu `AppModule`:

```typescript
@Module({
  imports: [
    CommonModule, // Importar para ativar os interceptors
    // outros módulos...
  ],
})
export class AppModule {}
```

## 📝 Logs

Todos os decorators geram logs estruturados que podem ser usados para monitoramento:

```json
{
  "level": "info",
  "message": "Tenant access",
  "tenantId": "tenant123",
  "userId": "user456",
  "method": "GET",
  "path": "/users/search",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🎯 Melhores Práticas

1. **Rate Limiting**: Use limites apropriados para cada tipo de operação
2. **Cache**: Configure TTL baseado na frequência de mudança dos dados
3. **Métricas**: Use nomes descritivos e labels consistentes
4. **Tenant**: Sempre use isolamento em aplicações multi-tenant
5. **Combinação**: Combine decorators para funcionalidade completa
6. **Monitoramento**: Configure alertas baseados nas métricas coletadas

## 🔗 Integração com Prometheus

As métricas são compatíveis com Prometheus e podem ser coletadas através do endpoint `/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'saas-boilerplate'
    static_configs:
      - targets: ['localhost:3003']
    metrics_path: '/metrics'
    scrape_interval: 15s
```