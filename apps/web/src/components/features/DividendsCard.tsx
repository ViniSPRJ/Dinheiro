import { useState } from 'react';
import { BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useDividendSummary } from '../../hooks/useDividends';
import DividendModal from './DividendModal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const TYPE_LABELS: Record<string, string> = {
  DIVIDENDO: 'Dividendos',
  JCP: 'JCP',
  RENDIMENTO: 'Rendimentos',
};

export default function DividendsCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const { data, isLoading } = useDividendSummary(currentYear);

  return (
    <div className="card border-l-4 border-success-500 bg-gradient-to-r from-white to-success-50/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BanknotesIcon className="h-5 w-5 text-success-600" />
          <h2 className="text-lg font-semibold text-gray-900">Proventos</h2>
          <span className="rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium uppercase text-success-700">
            {currentYear}
          </span>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-secondary">
          <PlusIcon className="h-4 w-4" />
          Lancar provento
        </button>
      </div>

      {isLoading ? (
        <div className="mt-4 h-16 animate-pulse rounded-lg bg-gray-100" />
      ) : !data || data.totalReceived === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          Nenhum provento lancado em {currentYear} ainda.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white/70 p-3 text-center">
              <p className="text-[10px] uppercase text-gray-500">Total recebido</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(data.totalReceived)}</p>
            </div>
            {Object.entries(data.byType).map(([type, value]) => (
              <div key={type} className="rounded-lg bg-white/70 p-3 text-center">
                <p className="text-[10px] uppercase text-gray-500">
                  {TYPE_LABELS[type] ?? type}
                </p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(value)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Yield on cost por posicao</h3>
            <div className="space-y-2">
              {data.byInvestment
                .sort((a, b) => b.totalReceived - a.totalReceived)
                .map((item) => (
                  <div
                    key={item.investmentId}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      {item.ticker && (
                        <span className="ml-2 text-xs text-gray-500">{item.ticker}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.totalReceived)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.yieldOnCostPercent.toFixed(2)}% yield on cost
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      <DividendModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
