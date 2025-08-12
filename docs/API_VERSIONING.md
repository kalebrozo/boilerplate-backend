# 📋 Sistema de Versionamento de API

## 📌 Visão Geral

Este documento descreve o sistema de versionamento de API implementado no projeto SaaS Multi-Tenant boilerplate. O sistema permite gerenciar múltiplas versões da API de forma organizada e controlada.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **VersionService** - Gerencia informações sobre versões
2. **VersionController** - Expõe endpoints para consultar versões
3. **VersionInterceptor** - Adiciona metadados de versão às respostas
4. **VersionMiddleware** - Detecta e valida versões nas requisições
5. **VersionGuard** - Controla acesso baseado em versão
6. **Decorators** - Facilitam o uso do sistema de versionamento

## 🚀 Como Usar

### 1. Configuração Básica

O versionamento está habilitado globalmente no `main.ts`:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'v',
  defaultVersion: '1',
});
```

### 2. Criando Controllers Versionados

#### Versão 1 (Padrão)
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiVersion } from '../common/decorators/api-version.decorator';

@Controller('users')
@ApiVersion('1')
export class UsersV1Controller {
  @Get()
  findAll() {
    return { message: 'Users V1' };
  }
}
```

#### Versão 2 (Nova)
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiVersion } from '../common/decorators/api-version.decorator';

@Controller('users')
@ApiVersion('2')
export class UsersV2Controller {
  @Get()
  findAll() {
    return { 
      message: 'Users V2',
      metadata: { enhanced: true }
    };
  }
}
```

### 3. Usando Decorators Avançados

#### Marcar Versão como Depreciada
```typescript
import { DeprecatedVersion } from '../common/decorators/version.decorators';

@Controller('users')
@ApiVersion('1')
@DeprecatedVersion('2024-12-31', 'Use v2 instead')
export class UsersV1Controller {
  // ...
}
```

#### Definir Versão Mínima/Máxima
```typescript
import { MinVersion, MaxVersion } from '../common/decorators/version.decorators';

@Controller('features')
@MinVersion('2')
@MaxVersion('3')
export class FeaturesController {
  // Disponível apenas nas versões 2 e 3
}
```

#### Marcar como Experimental
```typescript
import { Experimental } from '../common/decorators/version.decorators';

@Controller('beta')
@ApiVersion('3')
@Experimental()
export class BetaController {
  // Funcionalidade experimental
}
```

### 4. Múltiplas Versões no Mesmo Controller
```typescript
import { ApiMultiVersion } from '../common/decorators/version.decorators';

@Controller('shared')
@ApiMultiVersion(['1', '2', '3'])
export class SharedController {
  @Get()
  getData(@Version() version: string) {
    switch (version) {
      case '1':
        return { data: 'v1 format' };
      case '2':
      case '3':
        return { data: 'v2+ format', version };
    }
  }
}
```

## 📡 Endpoints de Versionamento

O sistema expõe endpoints para consultar informações sobre versões:

### Listar Todas as Versões
```http
GET /api/versions
```

Resposta:
```json
{
  "versions": [
    {
      "version": "1",
      "status": "active",
      "releaseDate": "2024-01-01",
      "features": ["Basic CRUD", "Authentication"]
    },
    {
      "version": "2",
      "status": "active",
      "releaseDate": "2024-06-01",
      "features": ["Enhanced search", "Batch operations"]
    }
  ],
  "stats": {
    "total": 2,
    "active": 2,
    "deprecated": 0,
    "experimental": 0,
    "latest": "2",
    "default": "1"
  }
}
```

### Outras Consultas Disponíveis

- `GET /api/versions/active` - Versões ativas
- `GET /api/versions/deprecated` - Versões depreciadas
- `GET /api/versions/experimental` - Versões experimentais
- `GET /api/versions/latest` - Versão mais recente
- `GET /api/versions/default` - Versão padrão
- `GET /api/versions/stats` - Estatísticas
- `GET /api/versions/{version}` - Informações de uma versão específica
- `GET /api/versions/{version}/supported` - Status de suporte
- `GET /api/versions/{version}/migration` - Guia de migração

## 🔄 Formas de Especificar Versão

O sistema suporta múltiplas formas de especificar a versão:

### 1. URL Path (Recomendado)
```http
GET /v1/users
GET /v2/users
```

### 2. Header HTTP
```http
GET /users
X-API-Version: 2
```

### 3. Query Parameter
```http
GET /users?version=2
```

### 4. Accept Header
```http
GET /users
Accept: application/vnd.api+json;version=2
```

## 📊 Metadados de Versão

Todas as respostas incluem metadados de versão automaticamente:

```json
{
  "data": {
    // Dados da resposta
  },
  "_version": {
    "api": "2",
    "timestamp": "2024-01-15T10:30:00Z",
    "endpoint": "/v2/users"
  }
}
```

## 🛡️ Controle de Acesso por Versão

Use o `VersionGuard` para controlar acesso:

```typescript
import { UseGuards } from '@nestjs/common';
import { VersionGuard } from '../common/guards/version.guard';

@Controller('premium')
@UseGuards(VersionGuard)
@MinVersion('2')
export class PremiumController {
  // Disponível apenas na v2+
}
```

## 📝 Boas Práticas

### 1. Versionamento Semântico
- Use números simples: `1`, `2`, `3`
- Para mudanças menores, considere usar features flags

### 2. Compatibilidade
- Mantenha compatibilidade dentro da mesma versão major
- Documente breaking changes claramente

### 3. Depreciação
- Marque versões antigas como depreciadas
- Forneça guias de migração
- Defina cronograma de remoção

### 4. Documentação
- Documente todas as mudanças entre versões
- Mantenha changelog atualizado
- Forneça exemplos de migração

## 🔧 Configuração Avançada

### Personalizar Detecção de Versão

Edite o `VersionMiddleware` para customizar a lógica:

```typescript
// Prioridade: URL > Header > Query > Default
private extractVersion(req: Request): string {
  // Sua lógica customizada aqui
}
```

### Adicionar Nova Versão

Use o `VersionService`:

```typescript
const newVersion: ApiVersionInfo = {
  version: '3',
  status: 'experimental',
  releaseDate: '2024-12-01',
  features: ['AI Integration', 'Real-time Analytics'],
  breakingChanges: ['Changed user schema'],
  migrationGuide: {
    steps: ['Update user model', 'Migrate data'],
    estimatedTime: '2 hours',
    complexity: 'high'
  }
};

versionService.addVersion(newVersion);
```

### Depreciar Versão

```typescript
versionService.deprecateVersion('1', '2024-12-31');
```

## 🧪 Testes

O sistema inclui testes completos:

- `version.service.spec.ts` - Testes do serviço
- `version.controller.spec.ts` - Testes do controller

Execute os testes:

```bash
npm run test
npm run test:e2e
```

## 📚 Exemplos de Uso

### Cliente JavaScript

```javascript
// Usando versão específica
fetch('/v2/users')
  .then(response => response.json())
  .then(data => {
    console.log('Version:', data._version.api);
    console.log('Data:', data.data);
  });

// Usando header
fetch('/users', {
  headers: {
    'X-API-Version': '2'
  }
})
```

### Cliente cURL

```bash
# URL path
curl https://api.example.com/v2/users

# Header
curl -H "X-API-Version: 2" https://api.example.com/users

# Query parameter
curl "https://api.example.com/users?version=2"
```

## 🔍 Monitoramento

O sistema integra com o módulo de métricas para rastrear:

- Uso por versão
- Tempo de resposta por versão
- Erros por versão
- Adoção de novas versões

Acesse as métricas em `/metrics` (formato Prometheus).

## 🚨 Troubleshooting

### Versão não encontrada
- Verifique se a versão está registrada no `VersionService`
- Confirme que o controller está usando o decorator correto

### Middleware não funcionando
- Verifique se o `VersionMiddleware` está registrado no `AppModule`
- Confirme a ordem dos middlewares

### Interceptor não adicionando metadados
- Verifique se o `VersionInterceptor` está registrado globalmente
- Confirme que não há conflitos com outros interceptors

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação
2. Verifique os testes para exemplos
3. Abra uma issue no repositório

---

**Nota**: Este sistema de versionamento foi projetado para ser flexível e extensível. Adapte conforme suas necessidades específicas.