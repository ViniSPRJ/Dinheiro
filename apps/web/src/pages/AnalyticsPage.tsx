import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  ScaleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {
  useCashFlow,
  useExpensesByCategory,
  useIncomeVsExpenses,
  Period,
} from '../hooks/useAnalytics';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const periodOptions: { value: Period; label: string }[] = [
  { value: 'week', label: 'Ultima semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'quarter', label: 'Ultimos 3 meses' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Todo periodo' },
];

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#6366F1',
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { data: cashFlowData, isLoading: cashFlowLoading } = useCashFlow();
  const { data: expensesData, isLoading: expensesLoading } = useExpensesByCategory(period);
  const { data: incomeVsExpensesData, isLoading: summaryLoading } = useIncomeVsExpenses(period);

  const isLoading = cashFlowLoading || expensesLoading || summaryLoading;

  // Prepare cash flow chart data
  const cashFlowChartData = cashFlowData?.cashFlow.map((item) => ({
    month: format(parseISO(`${item.month}-01`), 'MMM', { locale: ptBR }),
    Receitas: item.income,
    Despesas: item.expenses,
    Saldo: item.income - item.expenses,
  })) || [];

  // Prepare pie chart data
  const pieChartData = expensesData?.expensesByCategory
    .filter((item) => item.category)
    .slice(0, 8)
    .map((item, index) => ({
      name: item.category?.name || 'Outros',
      value: item.amount,
      color: item.category?.color || COLORS[index % COLORS.length],
      icon: item.category?.icon || '',
      percentage: item.percentage || 0,
    })) || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
          <p className="text-sm text-gray-500">
            Analise detalhada das suas financas
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="input w-auto"
            aria-label="Selecionar periodo"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {incomeVsExpensesData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
                <ArrowTrendingUpIcon className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receitas</p>
                <p className="text-lg font-bold text-success-600">
                  {formatCurrencyFull(incomeVsExpensesData.income)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100">
                <ArrowTrendingDownIcon className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Despesas</p>
                <p className="text-lg font-bold text-danger-600">
                  {formatCurrencyFull(incomeVsExpensesData.expenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  incomeVsExpensesData.balance >= 0 ? 'bg-success-100' : 'bg-danger-100'
                )}
              >
                <BanknotesIcon
                  className={clsx(
                    'h-5 w-5',
                    incomeVsExpensesData.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo</p>
                <p
                  className={clsx(
                    'text-lg font-bold',
                    incomeVsExpensesData.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {formatCurrencyFull(incomeVsExpensesData.balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <ScaleIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Taxa de poupanca</p>
                <p
                  className={clsx(
                    'text-lg font-bold',
                    incomeVsExpensesData.savingsRate >= 0 ? 'text-primary-600' : 'text-danger-600'
                  )}
                >
                  {incomeVsExpensesData.savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cash Flow Chart */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Fluxo de caixa (12 meses)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Evolution */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Evolucao do saldo</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Despesas por categoria</h3>
        </div>

        {pieChartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            Nenhuma despesa no periodo selecionado
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrencyFull(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-3">
              {pieChartData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrencyFull(item.value)}
                    </p>
                    <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}

              {expensesData && expensesData.total > 0 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrencyFull(expensesData.total)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Income vs Expenses Comparison */}
      {incomeVsExpensesData && (
        <div className="card">
          <h3 className="mb-4 font-semibold text-gray-900">Comparativo receitas x despesas</h3>
          <div className="space-y-4">
            {/* Income bar */}
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Receitas</span>
                <span className="font-medium text-success-600">
                  {formatCurrencyFull(incomeVsExpensesData.income)}
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-success-500"
                  style={{
                    width: `${Math.min(100, (incomeVsExpensesData.income / Math.max(incomeVsExpensesData.income, incomeVsExpensesData.expenses, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Expenses bar */}
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Despesas</span>
                <span className="font-medium text-danger-600">
                  {formatCurrencyFull(incomeVsExpensesData.expenses)}
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-danger-500"
                  style={{
                    width: `${Math.min(100, (incomeVsExpensesData.expenses / Math.max(incomeVsExpensesData.income, incomeVsExpensesData.expenses, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Diferenca</p>
                <p
                  className={clsx(
                    'text-xl font-bold',
                    incomeVsExpensesData.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {incomeVsExpensesData.balance >= 0 ? '+' : ''}
                  {formatCurrencyFull(incomeVsExpensesData.balance)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Taxa de poupanca</p>
                <p
                  className={clsx(
                    'text-xl font-bold',
                    incomeVsExpensesData.savingsRate >= 20
                      ? 'text-success-600'
                      : incomeVsExpensesData.savingsRate >= 0
                      ? 'text-warning-600'
                      : 'text-danger-600'
                  )}
                >
                  {incomeVsExpensesData.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={clsx(
                    'text-xl font-bold',
                    incomeVsExpensesData.savingsRate >= 20
                      ? 'text-success-600'
                      : incomeVsExpensesData.savingsRate >= 0
                      ? 'text-warning-600'
                      : 'text-danger-600'
                  )}
                >
                  {incomeVsExpensesData.savingsRate >= 20
                    ? 'Otimo!'
                    : incomeVsExpensesData.savingsRate >= 0
                    ? 'Atencao'
                    : 'Alerta!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
