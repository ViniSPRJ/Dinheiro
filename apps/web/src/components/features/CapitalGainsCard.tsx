import { ReceiptPercentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useTaxSummary } from '../../hooks/useTax';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ASSET_CLASS_LABELS: Record<string, string> = {
  ACOES: 'Acoes',
  FII: 'FIIs',
  CRIPTO: 'Cripto',
  OUTROS: 'Outros',
};

export default function CapitalGainsCard() {
  const currentYear = new Date().getFullYear();
  const { data, isLoading } = useTaxSummary(currentYear);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="mt-4 h-24 w-full rounded bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  const pendingMonths = data.monthly.filter((m) => !m.exempt && m.taxDue > 0);

  return (
    <div className="card border-l-4 border-amber-500 bg-gradient-to-r from-white to-amber-50/40">
      <div className="flex items-center gap-2">
        <ReceiptPercentIcon className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-gray-900">Ganho de capital / IR</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-700">
          {currentYear}
        </span>
      </div>

      {pendingMonths.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-100/70 p-3 text-sm text-amber-800">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {pendingMonths.length} mes(es) com DARF a pagar, total de{' '}
            <strong>{formatCurrency(pendingMonths.reduce((sum, m) => sum + m.taxDue, 0))}</strong>.
          </p>
        </div>
      )}

      {data.monthly.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          Nenhuma venda registrada em {currentYear} ainda.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Mes</th>
                <th className="px-3 py-2 text-left">Classe</th>
                <th className="px-3 py-2 text-right">Vendas</th>
                <th className="px-3 py-2 text-right">Ganho</th>
                <th className="px-3 py-2 text-right">Status</th>
                <th className="px-3 py-2 text-right">DARF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.monthly.map((group) => (
                <tr key={`${group.month}-${group.assetClass}`}>
                  <td className="px-3 py-2">{group.month}</td>
                  <td className="px-3 py-2">{ASSET_CLASS_LABELS[group.assetClass] ?? group.assetClass}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(group.totalSaleValue)}</td>
                  <td
                    className={clsx(
                      'px-3 py-2 text-right font-medium',
                      group.totalGain >= 0 ? 'text-success-600' : 'text-danger-600'
                    )}
                  >
                    {formatCurrency(group.totalGain)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={clsx(
                        'rounded px-2 py-0.5 text-[10px] font-bold',
                        group.exempt ? 'bg-gray-100 text-gray-600' : 'bg-danger-100 text-danger-700'
                      )}
                    >
                      {group.exempt ? 'ISENTO' : 'TRIBUTAVEL'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    {formatCurrency(group.taxDue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Calculadora de orientacao (isencao R$20mil/mes em acoes, R$35mil/mes em
        cripto, FIIs sempre tributados). Nao substitui apuracao com contador.
      </p>
    </div>
  );
}
