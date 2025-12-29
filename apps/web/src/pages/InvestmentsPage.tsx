import { useState, useMemo } from 'react';
import { Menu } from '@headlessui/react';
import {
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {
  useInvestments,
  useInvestmentPerformance,
  useInvestmentAllocation,
  useDeleteInvestment,
  Investment,
  InvestmentType,
  investmentTypeConfig,
} from '../hooks/useInvestments';
import InvestmentModal from '../components/features/InvestmentModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export default function InvestmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<InvestmentType | 'ALL'>('ALL');

  const { data: investmentsData, isLoading } = useInvestments(
    filterType === 'ALL' ? undefined : filterType
  );
  const { data: performanceData } = useInvestmentPerformance();
  const { data: allocationData } = useInvestmentAllocation();
  const deleteInvestment = useDeleteInvestment();

  const handleEdit = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteInvestment.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvestment(null);
  };

  // Get performance data for a specific investment
  const getPerformance = (investmentId: string) => {
    return performanceData?.performance.find((p) => p.id === investmentId);
  };

  // Group investments by type for the list view
  const groupedInvestments = useMemo((): Record<string, Investment[]> => {
    if (!investmentsData?.investments) return {};

    return investmentsData.investments.reduce((acc, inv) => {
      if (!acc[inv.type]) acc[inv.type] = [];
      acc[inv.type].push(inv);
      return acc;
    }, {} as Record<string, Investment[]>);
  }, [investmentsData]);

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
          <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
          <p className="text-sm text-gray-500">
            Acompanhe sua carteira de investimentos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Novo investimento
        </button>
      </div>

      {/* Summary Cards */}
      {performanceData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <BanknotesIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total investido</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(performanceData.totals.totalInvested)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
                <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor atual</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(performanceData.totals.totalCurrentValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  performanceData.totals.totalProfit >= 0
                    ? 'bg-success-100'
                    : 'bg-danger-100'
                )}
              >
                {performanceData.totals.totalProfit >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5 text-success-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5 text-danger-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Lucro/Prejuizo</p>
                <p
                  className={clsx(
                    'text-lg font-bold',
                    performanceData.totals.totalProfit >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  )}
                >
                  {formatCurrency(performanceData.totals.totalProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  performanceData.totals.totalProfitPercent >= 0
                    ? 'bg-success-100'
                    : 'bg-danger-100'
                )}
              >
                <ChartPieIcon
                  className={clsx(
                    'h-5 w-5',
                    performanceData.totals.totalProfitPercent >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rentabilidade</p>
                <p
                  className={clsx(
                    'text-lg font-bold',
                    performanceData.totals.totalProfitPercent >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  )}
                >
                  {formatPercent(performanceData.totals.totalProfitPercent)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Chart */}
      {allocationData && allocationData.allocation.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-semibold text-gray-900">Alocacao por tipo</h3>
          <div className="space-y-3">
            {allocationData.allocation.map((item) => {
              const config = investmentTypeConfig[item.type];
              return (
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className={clsx('font-medium', config.color)}>
                      {config.label}
                    </span>
                    <span className="text-gray-600">
                      {formatCurrency(item.value)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={clsx('h-full rounded-full', config.bgColor)}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: config.color.replace('text-', '').includes('-')
                          ? undefined
                          : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={clsx(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            filterType === 'ALL'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Todos
        </button>
        {Object.entries(investmentTypeConfig).map(([type, config]) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type as InvestmentType)}
            className={clsx(
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
              filterType === type
                ? `${config.bgColor} ${config.color}`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Investments List */}
      {investmentsData?.investments.length === 0 ? (
        <div className="card py-12 text-center">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nenhum investimento encontrado</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary mt-4"
          >
            <PlusIcon className="h-5 w-5" />
            Adicionar investimento
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filterType === 'ALL' ? (
            // Grouped view
            Object.entries(groupedInvestments).map(([type, investments]: [string, Investment[]]) => {
              const config = investmentTypeConfig[type as InvestmentType];
              return (
                <div key={type}>
                  <h3 className={clsx('mb-3 font-semibold', config.color)}>
                    {config.label} ({investments.length})
                  </h3>
                  <div className="space-y-3">
                    {investments.map((investment) => (
                      <InvestmentCard
                        key={investment.id}
                        investment={investment}
                        performance={getPerformance(investment.id)}
                        onEdit={() => handleEdit(investment)}
                        onDelete={() => setDeleteTarget(investment)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Flat view for filtered type
            <div className="space-y-3">
              {investmentsData?.investments.map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  performance={getPerformance(investment.id)}
                  onEdit={() => handleEdit(investment)}
                  onDelete={() => setDeleteTarget(investment)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        investment={selectedInvestment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir investimento"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta acao nao pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}

// Investment Card Component
interface InvestmentCardProps {
  investment: Investment;
  performance?: {
    invested: number;
    currentValue: number;
    profit: number;
    profitPercent: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function InvestmentCard({
  investment,
  performance,
  onEdit,
  onDelete,
}: InvestmentCardProps) {
  const config = investmentTypeConfig[investment.type];

  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            config.bgColor
          )}
        >
          <span className={clsx('text-lg font-bold', config.color)}>
            {investment.ticker?.substring(0, 2) ||
              investment.name.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{investment.name}</p>
            {investment.ticker && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {investment.ticker}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {investment.quantity
              ? `${investment.quantity} unidades @ ${formatCurrency(Number(investment.averagePrice))}`
              : formatCurrency(Number(investment.totalInvested))}
          </p>
          {investment.institution && (
            <p className="text-xs text-gray-400">{investment.institution}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {performance && (
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {formatCurrency(performance.currentValue)}
            </p>
            <p
              className={clsx(
                'text-sm font-medium',
                performance.profit >= 0 ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {formatCurrency(performance.profit)} ({formatPercent(performance.profitPercent)})
            </p>
          </div>
        )}

        <Menu as="div" className="relative">
          <Menu.Button className="rounded-lg p-2 hover:bg-gray-100">
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="p-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onEdit}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm',
                      active ? 'bg-gray-100' : ''
                    )}
                  >
                    <PencilIcon className="h-4 w-4" />
                    Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onDelete}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger-600',
                      active ? 'bg-danger-50' : ''
                    )}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Excluir
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </div>
  );
}
