# OpenSwarm Advisor — Integração com o Dinheiro

Este documento avalia o SaaS **Dinheiro** sob a ótica de aconselhamento de
investimentos e descreve como o **OpenSwarm Financial Advisor** foi integrado
para, de forma autônoma, avaliar a alocação discriminada no app e propor um
portfólio otimizado.

---

## 1. Avaliação do SaaS (estado anterior)

O Dinheiro já oferece uma base sólida para gestão financeira pessoal:

| Área | Situação | Observação |
| --- | --- | --- |
| Cadastro de investimentos | ✅ Completo | `Investment` cobre ações, FIIs, cripto, renda fixa, fundos e imóveis |
| Performance | ✅ | `GET /api/investments/performance` calcula lucro/prejuízo |
| Alocação por tipo | ✅ | `GET /api/investments/allocation` agrupa por `InvestmentType` |
| Inteligência de Patrimônio | ✅ | "Hurdle rate" pessoal (inflação + prêmio de risco) |
| **Consultoria de alocação** | ❌ Inexistente | Não havia recomendação de carteira-alvo nem rebalanceamento |
| **Otimização de portfólio** | ❌ Inexistente | Nenhuma proposta de carteira melhor/otimizada |

**Lacuna principal:** o app mostrava *o que* o usuário tem, mas não dizia *o que
fazer* — faltava um consultor que avaliasse a alocação atual e propusesse uma
carteira otimizada de acordo com o perfil de risco. É exatamente essa lacuna que
a integração com o OpenSwarm preenche.

Pontos de atenção encontrados durante a avaliação (pré-existentes, fora do
escopo desta entrega):

- `wealth.routes.ts` importa `../middleware/auth.middleware.js` (o arquivo
  correto é `auth.js`) e **não é registrado** em `index.ts` — o recurso de
  Inteligência de Patrimônio está implementado mas não montado.
- O cliente Prisma precisa de geração (`pnpm db:generate`) para tipar as queries;
  isso já é feito no CI.

---

## 2. Arquitetura da integração

O OpenSwarm é um *swarm* multiagente (orquestrador + especialistas: macro,
fundos, **alocador de portfólio/risco**, tributário, redator de propostas, CRM)
construído sobre o Agency Swarm. Ele é o "cérebro" da consultoria. Para um SaaS
que precisa avaliar a carteira **autonomamente a cada visita**, expor o swarm
LLM completo a cada request seria caro e exigiria chaves de API.

A solução adotada é um **bridge HTTP leve** no repositório do OpenSwarm
(`advisor_service/`) que serve a mesma lógica de alocação do
`portfolio_allocator_agent` por meio de um motor **determinístico e sem chaves**:

```
┌──────────────────────┐      HTTPS      ┌────────────────────────────┐
│  Dinheiro (apps/web)  │ ───────────────▶│  Dinheiro API (apps/api)    │
│  PortfolioAdvisorCard │  GET /advisor/  │  AdvisorController          │
└──────────────────────┘     review       │  - lê Investments do usuário│
                                           │  - monta holdings + total   │
                                           └─────────────┬──────────────┘
                                                         │ POST /advisor/optimize
                                                         ▼
                                           ┌────────────────────────────┐
                                           │ OpenSwarm Advisor Service   │
                                           │ advisor_service/app.py      │
                                           │  - core.py (motor determ.)  │
                                           │  - proposals.py (Advisor-   │
                                           │    as-Git: stage_proposal)  │
                                           └────────────────────────────┘
```

- **Determinístico por padrão:** `advisor_service/core.py` codifica as
  carteiras-modelo dos perfis `conservador` / `moderado` / `arrojado` descritas
  em `portfolio_allocator_agent/instructions.md`, mapeia o enum `InvestmentType`
  do Dinheiro em classes de ativos, calcula desvio (drift), ações de
  rebalanceamento, métricas de risco/retorno e gera insights — tudo em Python
  puro, executável em qualquer ambiente.
- **Advisor-as-Git:** cada recomendação é registrada via o mesmo
  `stage_proposal` usado pelos agentes (`advisor/proposals/staged/`), mantendo a
  auditabilidade e permitindo aprovação posterior com `ApproveProposal`.
- **Swarm completo disponível:** o `server.py` do OpenSwarm continua disponível
  para análises profundas e conversacionais quando chaves de LLM estiverem
  configuradas.

---

## 3. Fluxo autônomo (avaliar → propor)

1. O usuário abre a página de **Investimentos**.
2. `PortfolioAdvisorCard` chama `GET /api/advisor/review`.
3. O `AdvisorController` lê **automaticamente** todos os investimentos ativos do
   usuário, monta a carteira (valor atual por posição) e o perfil de risco
   salvo (`User.riskProfile`, padrão `moderado`).
4. Encaminha ao Advisor Service, que devolve:
   - **Diagnóstico** (nota 0–100, concentração, drift vs. carteira-modelo);
   - **Alocação atual vs. otimizada** por classe de ativo;
   - **Ações de rebalanceamento** (COMPRAR/VENDER/MANTER, em p.p. e em R$);
   - **Insights** em linguagem natural (ex.: "Sem exposição internacional…");
   - **Métricas esperadas** (retorno, volatilidade, diversificação);
   - **ID da proposta** registrada (Advisor-as-Git).
5. O usuário pode pré-visualizar outro perfil e **salvar** o perfil escolhido
   (`PATCH /api/advisor/profile`), tornando as próximas revisões personalizadas.

Degradação graciosa: se o Advisor Service estiver offline, o endpoint responde
`available: false` com mensagem amigável, sem quebrar a página (mesmo padrão do
`MLService`).

---

## 4. Mudanças nesta entrega

### Dinheiro (`apps/api`)
- `src/config/index.ts` — nova env `ADVISOR_SERVICE_URL`.
- `src/services/advisorService.ts` — cliente HTTP resiliente (singleton + health
  check + fallback), espelhando `mlService.ts`.
- `src/controllers/advisor.controller.ts` — monta a carteira e chama o advisor.
- `src/routes/advisor.routes.ts` — `GET /review`, `PATCH /profile` (com auth).
- `src/index.ts` — registra `/api/advisor`.
- `prisma/schema.prisma` + migration — campo `User.riskProfile`.
- `.env.example` — `ADVISOR_SERVICE_URL`.

### Dinheiro (`apps/web`)
- `src/services/advisor.service.ts`, `src/hooks/useAdvisor.ts`.
- `src/components/features/PortfolioAdvisorCard.tsx` — UI da consultoria.
- `src/pages/InvestmentsPage.tsx` — card integrado.

### OpenSwarm (`advisor_service/`)
- `core.py` (motor determinístico), `proposals.py` (Advisor-as-Git),
  `app.py` (FastAPI), `test_core.py`, `requirements.txt`, `README.md`.
- `.env.example` — `ADVISOR_SERVICE_PORT`.

---

## 5. Como executar

```bash
# 1) Advisor Service (OpenSwarm)
cd OpenSwarm-FinancialAdvisor
pip install -r advisor_service/requirements.txt
python -m advisor_service.app            # :8001

# 2) Dinheiro API
cd Dinheiro
echo 'ADVISOR_SERVICE_URL="http://localhost:8001"' >> apps/api/.env
pnpm db:migrate                          # aplica User.riskProfile
pnpm dev
```

Abra **Investimentos** — o card "Consultor OpenSwarm" mostrará a avaliação
autônoma e o portfólio otimizado.

---

## 6. Limitações e próximos passos

- O motor determinístico usa premissas de risco/retorno **heurísticas** (não é
  previsão); deixam explícita a relação risco/retorno estimada.
- As classes de ativo são inferidas do `InvestmentType`; o Dinheiro não modela
  geografia (ex.: IVVB11 entra como "Ações Brasil"). Um campo opcional de
  classe/geografia no `Investment` refinaria a leitura de "Exterior/Global".
- Para análises profundas (macro, tributário detalhado, relatório PDF), conectar
  o endpoint ao swarm LLM completo (`server.py`) atrás da mesma interface.
- Próximo passo natural: botão "Aplicar proposta" que cria os movimentos no
  Dinheiro a partir de uma proposta aprovada.
