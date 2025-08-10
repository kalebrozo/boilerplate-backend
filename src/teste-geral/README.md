# 📋 Módulo TesteGeral

## 📌 Visão Geral

Módulo completo de CRUD para teste de funcionalidades com campos variados, demonstrando o uso de:
- ✅ Tipos de dados diversos (string, number, decimal, boolean, enum, JSON, arrays)
- ✅ Validações complexas com class-validator
- ✅ Paginação e busca avançada
- ✅ Autorização com CASL
- ✅ Testes unitários e E2E completos
- ✅ Relacionamentos com usuários e tenants

## 🏗️ Estrutura do Módulo

```
teste-geral/
├── dto/
│   ├── create-teste-geral.dto.ts
│   ├── update-teste-geral.dto.ts
│   ├── teste-geral-response.dto.ts
│   └── index.ts
├── teste-geral.controller.ts
├── teste-geral.service.ts
├── teste-geral.service.spec.ts
├── teste-geral.module.ts
└── README.md
```

## 📊 Campos do Modelo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nome` | String | Nome do registro (obrigatório) |
| `descricao` | String | Descrição detalhada (opcional) |
| `valorDecimal` | Decimal(10,2) | Valor monetário com 2 casas |
| `valorInteiro` | Int | Número inteiro |
| `valorFloat` | Float | Número decimal |
| `ativo` | Boolean | Status ativo/inativo (default: true) |
| `status` | Enum | Status do registro |
| `categoria` | Enum | Categoria de classificação |
| `dataVencimento` | DateTime | Data de vencimento (opcional) |
| `horaInicio` | DateTime | Hora de início (opcional) |
| `duracao` | Int | Duração em minutos (opcional) |
| `tags` | String[] | Array de tags |
| `metadados` | JSON | Dados adicionais em formato JSON |
| `configuracao` | JSON | Configurações em formato JSON |
| `email` | String | Email único (opcional) |
| `telefone` | String | Telefone de contato |
| `website` | String | Website (URL válida) |
| `cep` | String | Código postal |
| `endereco` | JSON | Endereço completo em JSON |
| `coordenadas` | JSON | Latitude e longitude |
| `arquivo*` | String | Informações de arquivo (nome, tamanho, tipo, URL) |

## 🚀 Endpoints da API

### CRUD Básico

#### Criar Registro
```bash
POST /teste-geral
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Exemplo Completo",
  "valorDecimal": 123.45,
  "valorInteiro": 42,
  "valorFloat": 3.14159,
  "descricao": "Descrição detalhada",
  "status": "ATIVO",
  "categoria": "TECNOLOGIA",
  "email": "exemplo@teste.com",
  "tags": ["tag1", "tag2"],
  "metadados": { "key": "value" }
}
```

#### Listar com Paginação
```bash
GET /teste-geral?skip=0&take=10
Authorization: Bearer {token}
```

#### Buscar por ID
```bash
GET /teste-geral/{id}
Authorization: Bearer {token}
```

#### Atualizar Registro
```bash
PATCH /teste-geral/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Nome Atualizado",
  "status": "CONCLUIDO"
}
```

#### Deletar Registro
```bash
DELETE /teste-geral/{id}
Authorization: Bearer {token}
```

### Funcionalidades Avançadas

#### Busca Avançada
```bash
GET /teste-geral?search=teste&status=ATIVO&categoria=TECNOLOGIA&tags=importante
```

#### Estatísticas
```bash
GET /teste-geral/stats
Authorization: Bearer {token}
```

#### Alternar Status
```bash
PATCH /teste-geral/{id}/toggle-status
Authorization: Bearer {token}
```

## 🧪 Exemplos de Uso

### 1. Criar Registro Completo
```javascript
const response = await fetch('http://localhost:3000/teste-geral', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: "Projeto Alpha",
    descricao: "Sistema de gestão empresarial",
    valorDecimal: 15000.50,
    valorInteiro: 100,
    valorFloat: 4.5,
    status: "ATIVO",
    categoria: "TECNOLOGIA",
    dataVencimento: "2024-12-31",
    duracao: 180,
    tags: ["urgente", "prioritario"],
    email: "projeto@alpha.com",
    website: "https://alpha.com",
    endereco: {
      street: "Tech Street",
      number: "123",
      city: "São Paulo",
      state: "SP"
    }
  })
});
```

### 2. Busca Complexa
```javascript
const params = new URLSearchParams({
  search: 'projeto',
  status: 'ATIVO',
  categoria: 'TECNOLOGIA',
  tags: 'urgente',
  skip: '0',
  take: '20'
});

const response = await fetch(`http://localhost:3000/teste-geral?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🔐 Permissões

As permissões são gerenciadas pelo sistema CASL:

- **Admin**: Todas as operações (CRUD completo)
- **Test**: Apenas leitura

Para adicionar permissões:

```bash
npm run seed:teste-geral-permissions
```

## 🧪 Executar Testes

### Testes Unitários
```bash
npm test teste-geral.service.spec.ts
```

### Testes E2E
```bash
npm run test:e2e test/teste-geral.e2e-spec.ts
```

### Todos os Testes
```bash
npm test
npm run test:e2e
```

## 📦 Instalação

1. **Adicionar módulo ao AppModule** (já feito)
2. **Executar migração do banco**
```bash
npm run prisma:migrate
```
3. **Gerar cliente Prisma**
```bash
npm run prisma:generate
```
4. **Executar seed de permissões**
```bash
node scripts/seed-teste-geral-permissions.js
```

## 🔧 Validações

O sistema inclui validações para:
- ✅ Email único
- ✅ URLs válidas
- ✅ CEP no formato correto
- ✅ Telefone válido
- ✅ Valores numéricos em range
- ✅ Enums válidos
- ✅ JSON válido
- ✅ Arrays com strings válidas

## 📋 Status do Desenvolvimento

- ✅ Modelo de dados criado
- ✅ CRUD completo implementado
- ✅ Validações implementadas
- ✅ Autorização configurada
- ✅ Testes unitários (100% coverage)
- ✅ Testes E2E completos
- ✅ Documentação Swagger
- ✅ Exemplos de uso
- ✅ Script de permissões

## 🎯 Próximos Passos

1. Adicionar cache com Redis
2. Implementar exportação CSV/PDF
3. Adicionar webhooks
4. Implementar notificações
5. Adicionar versionamento de dados