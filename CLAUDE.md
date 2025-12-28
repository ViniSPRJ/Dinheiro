# Dinheiro - Claude Code Context

## Project Overview

Dinheiro is a Brazilian personal finance management platform with AI-powered categorization, intelligent budgets, and investment tracking.

## Tech Stack

### Frontend (apps/web)
- React 18 + TypeScript
- Vite for building
- TailwindCSS for styling
- Zustand + React Query for state management
- React Router for navigation
- Recharts for data visualization

### Backend (apps/api)
- Node.js 20 + Express + TypeScript
- Prisma ORM with PostgreSQL 15
- Redis for caching
- JWT authentication with refresh tokens
- Zod for validation

### ML Service (apps/ml-service)
- Python 3.11 + FastAPI
- Scikit-learn for automatic categorization

## Project Structure

```
dinheiro/
├── apps/
│   ├── api/                 # Backend Node.js
│   │   ├── prisma/          # Schema and migrations
│   │   └── src/
│   │       ├── controllers/ # Request handlers
│   │       ├── services/    # Business logic
│   │       ├── routes/      # Route definitions
│   │       ├── middleware/  # Express middleware
│   │       └── config/      # Configuration
│   │
│   ├── web/                 # Frontend React
│   │   └── src/
│   │       ├── components/  # React components
│   │       ├── pages/       # Page components
│   │       ├── hooks/       # Custom hooks
│   │       ├── services/    # API services
│   │       └── stores/      # Zustand stores
│   │
│   └── ml-service/          # Python ML service
│
├── packages/
│   └── shared/              # Shared types and utilities
│
├── infrastructure/          # Terraform/IaC
└── .github/workflows/       # CI/CD pipelines
```

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start Docker services (PostgreSQL on port 5433, Redis on 6379)
docker-compose up -d postgres redis

# Copy environment variables
cp apps/api/.env.example apps/api/.env

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development servers
pnpm dev
```

### Available Scripts

```bash
pnpm dev            # Start all apps in development mode
pnpm build          # Production build
pnpm lint           # Run linting
pnpm test           # Run tests

# Database commands
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database with initial data
pnpm db:studio      # Open Prisma Studio
```

## Important Configuration Notes

### Database Port
PostgreSQL runs on port **5433** (not the default 5432) to avoid conflicts with other local PostgreSQL instances.

### Environment Variables
Key environment variables in `apps/api/.env`:
- `DATABASE_URL`: PostgreSQL connection string (port 5433)
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret (min 32 chars)
- `JWT_REFRESH_SECRET`: Refresh token secret (min 32 chars)
- `FRONTEND_URL`: Frontend URL for CORS

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - List categories (global + user)
- `POST /api/categories` - Create custom category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get budget with progress
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Investments
- `GET /api/investments` - List investments
- `POST /api/investments` - Create investment
- `GET /api/investments/:id` - Get investment details
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment

### Goals
- `GET /api/goals` - List financial goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get goal with progress
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Dashboard
- `GET /api/dashboard/summary` - Financial summary
- `GET /api/dashboard/cash-flow` - Cash flow data
- `GET /api/dashboard/category-breakdown` - Category breakdown
- `GET /api/dashboard/net-worth` - Net worth history

## Database Models

The Prisma schema includes 20+ models:
- **User** - User accounts with preferences
- **Account** - Financial accounts (checking, savings, credit cards, investments)
- **Transaction** - Financial transactions
- **Category** - Transaction categories (global + user-specific)
- **Budget** - Monthly/yearly budgets per category
- **Investment** - Investment positions (stocks, FIIs, crypto)
- **Goal** - Financial goals with progress tracking
- **RecurringRule** - Recurring transaction rules
- **Subscription** - Subscription tracking
- **Tag** - Transaction tags
- **Notification** - User notifications
- **NetWorthSnapshot** - Historical net worth data

## Docker Services

```yaml
# Running containers (docker-compose up -d postgres redis)
- dinheiro-postgres: PostgreSQL 15 on port 5433
- dinheiro-redis: Redis 7 on port 6379

# Full stack (docker-compose up)
- dinheiro-api: API on port 3000
- dinheiro-web: Web on port 5173
- dinheiro-ml: ML Service on port 8000
```

## Testing

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter api test

# Run Web tests only
pnpm --filter web test

# Run with coverage
pnpm --filter api test:coverage
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. **Lint** - ESLint validation
2. **Test API** - Backend tests with PostgreSQL service
3. **Test Web** - Frontend tests
4. **Build** - Production build (runs after all tests pass)

## Common Development Tasks

### Add a new API endpoint
1. Create controller in `apps/api/src/controllers/`
2. Add routes in `apps/api/src/routes/`
3. Register routes in `apps/api/src/routes/index.ts`
4. Add validation schemas with Zod

### Add a new page
1. Create page component in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.tsx`
3. Create any necessary hooks in `apps/web/src/hooks/`

### Modify database schema
1. Edit `apps/api/prisma/schema.prisma`
2. Run `pnpm db:migrate` (will prompt for migration name)
3. Update seed if necessary in `apps/api/prisma/seed.ts`
