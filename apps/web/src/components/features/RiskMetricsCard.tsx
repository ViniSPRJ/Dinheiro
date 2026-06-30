import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useRiskMetrics } from '../../hooks/useRisk';

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export default function RiskMetricsCard() {
  const { data, isLoading } = useRiskMetrics(90);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="mt-4 h-24 w-full rounded bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="card border-l-4 border-indigo-500 bg-gradient-to-r from-white to-indigo-50/40">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-900">Metricas de risco</h2>
        {data.periodDays && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium uppercase text-indigo-700">
            {data.periodDays}d
          </span>
        )}
      </div>

      {!data.available ? (
        <p className="mt-2 text-sm text-gray-500">
          {data.message ?? 'Metricas indisponiveis no momento.'}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Volatilidade" value={formatPercent(data.volatility ?? 0)} />
          <Metric label="Sharpe" value={(data.sharpe ?? 0).toFixed(2)} />
          <Metric label="Beta (vs IBOV)" value={(data.beta ?? 0).toFixed(2)} />
          <Metric label="Retorno esp. (CAPM)" value={formatPercent(data.expectedReturnCapm ?? 0)} />
          <Metric label="Correlacao c/ IBOV" value={(data.correlationWithIbov ?? 0).toFixed(2)} />
          <Metric label="Kelly (1/2)" value={formatPercent((data.kellyFraction ?? 0) * 100)} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-3 text-center">
      <p className="text-[10px] uppercase text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
