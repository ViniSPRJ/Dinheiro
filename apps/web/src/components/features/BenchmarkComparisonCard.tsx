import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ScaleIcon } from '@heroicons/react/24/outline';
import { useBenchmarkComparison } from '../../hooks/useRisk';

const BAR_COLOR_PORTFOLIO = '#6366F1';
const BAR_COLOR_BENCHMARK = '#9CA3AF';

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export default function BenchmarkComparisonCard() {
  const { data, isLoading } = useBenchmarkComparison(90);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="mt-4 h-64 w-full rounded bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  if (!data.available || !data.portfolio || !data.benchmarks) {
    return (
      <div className="card border-l-4 border-gray-300">
        <div className="flex items-center gap-2">
          <ScaleIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Carteira vs benchmarks</h2>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {data.message ?? 'Comparacao indisponivel no momento.'}
        </p>
      </div>
    );
  }

  const chartData = [
    { name: 'Carteira', value: data.portfolio.cumulativeReturnPercent, isPortfolio: true },
    ...data.benchmarks.map((b) => ({ name: b.name, value: b.cumulativeReturnPercent, isPortfolio: false })),
  ];

  return (
    <div className="card border-l-4 border-gray-300">
      <div className="flex items-center gap-2">
        <ScaleIcon className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Carteira vs benchmarks</h2>
        {data.periodDays && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600">
            ultimos {data.periodDays}d
          </span>
        )}
      </div>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} />
            <YAxis
              tickFormatter={(value) => formatPercent(value)}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip
              formatter={(value: number) => formatPercent(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.isPortfolio ? BAR_COLOR_PORTFOLIO : BAR_COLOR_BENCHMARK}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
