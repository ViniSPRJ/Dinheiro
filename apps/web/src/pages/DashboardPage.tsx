import { useDashboard, useCashFlow } from '../hooks/useDashboard';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  color: 'primary' | 'success' | 'danger' | 'warning';
}) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
    warning: 'bg-warning-50 text-warning-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {trend === 'up' ? (
            <>
              <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" />
              <span className="text-success-600">+5.2%</span>
            </>
          ) : (
            <>
              <ArrowTrendingDownIcon className="h-4 w-4 text-danger-500" />
              <span className="text-danger-600">-2.1%</span>
            </>
          )}
          <span className="text-gray-500">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboard('month');
  const { data: cashFlowData } = useCashFlow();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-xl bg-gray-200" />
          <div className="h-80 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visao geral das suas financas</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Patrimonio Liquido"
          value={summary?.netWorth || 0}
          icon={WalletIcon}
          color="primary"
          trend="up"
        />
        <SummaryCard
          title="Receitas"
          value={summary?.income || 0}
          icon={ArrowTrendingUpIcon}
          color="success"
        />
        <SummaryCard
          title="Despesas"
          value={summary?.expenses || 0}
          icon={ArrowTrendingDownIcon}
          color="danger"
        />
        <SummaryCard
          title="Saldo"
          value={summary?.balance || 0}
          icon={BanknotesIcon}
          color={summary?.balance && summary.balance >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cash flow chart */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Fluxo de Caixa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData?.cashFlow || []}>
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', { month: 'short' });
                  }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  }}
                />
                <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by category */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Despesas por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboard?.expensesByCategory || []}
                  dataKey="amount"
                  nameKey="category.name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(dashboard?.expensesByCategory || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budgets and recent transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget progress */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Orcamentos</h3>
            <a href="/budgets" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Ver todos
            </a>
          </div>
          <div className="space-y-4">
            {(dashboard?.budgets || []).slice(0, 4).map((budget) => (
              <div key={budget.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{budget.category?.name}</span>
                  <span className="text-gray-500">
                    {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budget.percentUsed > 100
                        ? 'bg-danger-500'
                        : budget.percentUsed > 80
                        ? 'bg-warning-500'
                        : 'bg-success-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {(!dashboard?.budgets || dashboard.budgets.length === 0) && (
              <p className="text-center text-sm text-gray-500">Nenhum orcamento configurado</p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transacoes Recentes</h3>
            <a
              href="/transactions"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todas
            </a>
          </div>
          <div className="space-y-3">
            {(dashboard?.recentTransactions || []).slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: tx.category?.color || '#6366f1' }}
                  >
                    <span className="text-white text-sm">
                      {tx.category?.name?.[0] || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === 'INCOME' ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(Number(tx.amount))}
                </span>
              </div>
            ))}
            {(!dashboard?.recentTransactions || dashboard.recentTransactions.length === 0) && (
              <p className="text-center text-sm text-gray-500">Nenhuma transacao ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
