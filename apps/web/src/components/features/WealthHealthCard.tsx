import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { WealthHealthData } from '../../../services/wealth.service';

interface WealthHealthCardProps {
  data: WealthHealthData | null;
  isLoading: boolean;
}

export default function WealthHealthCard({ data, isLoading }: WealthHealthCardProps) {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-1/3 rounded bg-gray-200"></div>
        <div className="mt-4 h-8 w-1/2 rounded bg-gray-200"></div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, breakdown, recommendation, isWealthBuilding } = data;

  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  return (
    <div className="card border-l-4 border-indigo-500 bg-gradient-to-r from-white to-gray-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Main Status */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inteligencia de Patrimonio</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className={clsx(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              isWealthBuilding ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            )}>
              {isWealthBuilding ? "Construindo Riqueza" : "Atencao Necessaria"}
            </span>
            <p className="text-sm text-gray-600">{recommendation}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 text-center">
            
            {/* Personal Inflation */}
            <div>
                <p className="text-xs text-gray-500 uppercase">Inflacao Pessoal</p>
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xl font-bold text-gray-900">{formatPercent(metrics.personalHurdleRate - breakdown.riskPremium)}</span>
                    <span className="text-xs text-gray-400">(IPCA {breakdown.baseInflation}%)</span>
                </div>
            </div>

            {/* Hurdle Rate */}
            <div>
                <p className="text-xs text-gray-500 uppercase">Hurdle Rate (Min)</p>
                <div className="flex items-center justify-center gap-1">
                     <span className="text-xl font-bold text-indigo-600">{formatPercent(metrics.personalHurdleRate)}</span>
                </div>
                <p className="text-[10px] text-gray-400">Inflacao + 2% Ganho Real</p>
            </div>

             {/* Real Return */}
             <div>
                <p className="text-xs text-gray-500 uppercase">Seu Retorno Real</p>
                <div className="flex items-center justify-center gap-1">
                     {metrics.gap > 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                     ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                     )}
                     <span className={clsx(
                        "text-xl font-bold",
                        metrics.gap > 0 ? "text-green-600" : "text-red-600"
                     )}>
                        {formatPercent(metrics.gap)}
                     </span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
