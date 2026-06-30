import { TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { InvestmentLot, useDeleteLot } from '../../hooks/useInvestments';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(value));

interface LotHistoryTableProps {
  investmentId: string;
  lots: InvestmentLot[];
}

export default function LotHistoryTable({ investmentId, lots }: LotHistoryTableProps) {
  const deleteLot = useDeleteLot(investmentId);

  if (lots.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma operacao lancada ainda.</p>;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">Data</th>
            <th className="px-3 py-2 text-left">Tipo</th>
            <th className="px-3 py-2 text-right">Quantidade</th>
            <th className="px-3 py-2 text-right">Preco</th>
            <th className="px-3 py-2 text-right">Taxas</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lots.map((lot) => (
            <tr key={lot.id}>
              <td className="px-3 py-2">{formatDate(lot.tradeDate)}</td>
              <td className="px-3 py-2">
                <span
                  className={clsx(
                    'rounded px-2 py-0.5 text-[10px] font-bold',
                    lot.side === 'BUY'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-danger-100 text-danger-700'
                  )}
                >
                  {lot.side === 'BUY' ? 'COMPRA' : 'VENDA'}
                </span>
              </td>
              <td className="px-3 py-2 text-right">{lot.quantity}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(lot.unitPrice)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(lot.fees)}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => deleteLot.mutate(lot.id)}
                  className="text-gray-400 hover:text-danger-500"
                  aria-label="Remover operacao"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
