# Dinheiro - Seu Copiloto Financeiro Brasileiro

Uma plataforma de gestao financeira pessoal com categorizacao automatica por IA, orcamentos inteligentes e controle de investimentos.

## Stack Tecnologico

### Frontend
- **React 18** + TypeScript
- **Vite** para build
- **TailwindCSS** para estilizacao
- **Zustand** + **React Query** para state management
- **React Router** para navegacao

### Backend
- **Node.js 20** + Express + TypeScript
- **Prisma** ORM
- **PostgreSQL** 15
- **Redis** para cache
- **JWT** para autenticacao

### ML Service
- **Python 3.11** + FastAPI
- **Scikit-learn** para categorizacao automatica

## Primeiros Passos

### Pre-requisitos

- Node.js 20+
- pnpm 8+
- Docker e Docker Compose
- PostgreSQL 15+ (ou usar Docker)
- Redis 7+ (ou usar Docker)

### Instalacao

1. Clone o repositorio:
```bash
git clone https://github.com/seu-usuario/dinheiro.git
cd dinheiro
```

2. Instale as dependencias:
```bash
pnpm install
```

3. Copie as variaveis de ambiente:
```bash
cp apps/api/.env.example apps/api/.env
```

4. Inicie os servicos com Docker:
```bash
docker-compose up -d postgres redis
```

5. Execute as migrations:
```bash
pnpm db:migrate
```

6. Popule o banco com dados iniciais:
```bash
pnpm db:seed
```

7. Inicie o desenvolvimento:
```bash
pnpm dev
```

A aplicacao estara disponivel em:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Prisma Studio: http://localhost:5555 (execute `pnpm db:studio`)

## Scripts Disponiveis

```bash
# Desenvolvimento
pnpm dev            # Inicia todos os apps em modo desenvolvimento
pnpm build          # Build de producao
pnpm lint           # Verificacao de lint
pnpm test           # Executa testes

# Database
pnpm db:generate    # Gera Prisma client
pnpm db:migrate     # Executa migrations
pnpm db:seed        # Popula banco com dados iniciais
pnpm db:studio      # Abre Prisma Studio

# Docker
docker-compose up -d              # Inicia todos os servicos
docker-compose up -d postgres redis  # Apenas banco e cache
docker-compose down               # Para todos os servicos
```

## Estrutura do Projeto

```
dinheiro/
├── apps/
│   ├── api/                 # Backend Node.js
│   │   ├── prisma/          # Schema e migrations
│   │   └── src/
│   │       ├── controllers/ # Request handlers
│   │       ├── services/    # Business logic
│   │       ├── routes/      # Route definitions
│   │       ├── middleware/  # Express middleware
│   │       ├── utils/       # Utilities
│   │       └── config/      # Configuration
│   │
│   ├── web/                 # Frontend React
│   │   └── src/
│   │       ├── components/  # React components
│   │       ├── pages/       # Page components
│   │       ├── hooks/       # Custom hooks
│   │       ├── services/    # API services
│   │       ├── stores/      # State management
│   │       └── styles/      # Global styles
│   │
│   └── ml-service/          # Python ML service
│       └── app/
│           ├── models/      # ML models
│           └── services/    # ML logic
│
├── packages/
│   └── shared/              # Shared types and utilities
│
├── infrastructure/          # Terraform/IaC
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Docker services
└── README.md
```

## Features

### MVP (Sprint 1-3)
- [x] Autenticacao (Email/Senha, Google, Apple)
- [x] Gestao de Contas
- [x] Gestao de Transacoes
- [x] Categorizacao automatica com IA
- [x] Orcamentos com sugestoes inteligentes
- [x] Dashboard com visao geral
- [x] Investimentos (acoes, FIIs, crypto)
- [x] Metas de economia
- [x] PWA (instalavel, offline basico)

### Futuro
- [ ] Open Finance (sincronizacao com bancos)
- [ ] Tier Premium
- [ ] App mobile nativo (iOS/Android)
- [ ] Multi-usuario (contas compartilhadas)

## Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudancas (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licenca

Este projeto esta sob a licenca MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Dinheiro** - Seu copiloto financeiro brasileiro 🚀
