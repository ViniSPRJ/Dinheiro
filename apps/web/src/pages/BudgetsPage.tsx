import { useState } from 'react';
import { useBudgets, useDeleteBudget, Budget } from '../hooks/useBudgets';
import {
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import BudgetModal from '../components/features/BudgetModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import clsx from 'clsx';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getProgressColor(percent: number): { bg: string; text: string; bar: string } {
  if (percent >= 100) {
    return { bg: 'bg-danger-50', text: 'text-danger-600', bar: 'bg-danger-500' };
  }
  if (percent >= 80) {
    return { bg: 'bg-warning-50', text: 'text-warning-600', bar: 'bg-warning-500' };
  }
  return { bg: 'bg-success-50', text: 'text-success-600', bar: 'bg-success-500' };
}

export default function BudgetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteConfirmBudget, setDeleteConfirmBudget] = useState<Budget | null>(null);

  const { data: budgets, isLoading } = useBudgets();
  const deleteBudget = useDeleteBudget();

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmBudget) {
      await deleteBudget.mutateAsync(deleteConfirmBudget.id);
      setDeleteConfirmBudget(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBudget(null);
  };

  // Calculate totals
  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.effectiveAmount), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + Number(b.spent), 0) || 0;
  const overBudgetCount = budgets?.filter((b) => b.percentUsed >= 100).length || 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orcamentos</h1>
          <p className="text-sm text-gray-500">Controle seus gastos por categoria</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Novo orcamento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <ChartBarIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total orcado</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              totalSpent > totalBudget ? 'bg-danger-100' : 'bg-success-100'
            )}>
              {totalSpent > totalBudget ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 text-success-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Total gasto</p>
              <p className={clsx(
                'text-xl font-bold',
                totalSpent > totalBudget ? 'text-danger-600' : 'text-gray-900'
              )}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              overBudgetCount > 0 ? 'bg-warning-100' : 'bg-success-100'
            )}>
              {overBudgetCount > 0 ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 text-success-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Acima do limite</p>
              <p className="text-xl font-bold text-gray-900">
                {overBudgetCount} {overBudgetCount === 1 ? 'categoria' : 'categorias'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {budgets && budgets.length > 0 ? (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => handleEdit(budget)}
              onDelete={() => setDeleteConfirmBudget(budget)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum orcamento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece definindo limites para suas categorias de despesas
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary mt-4"
            >
              <PlusIcon className="h-5 w-5" />
              Criar primeiro orcamento
            </button>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        budget={selectedBudget}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmBudget}
        onClose={() => setDeleteConfirmBudget(null)}
        onConfirm={handleDelete}
        title="Excluir orcamento"
        message={`Tem certeza que deseja excluir o orcamento de "${deleteConfirmBudget?.category.name}"?`}
        confirmText="Excluir"
        isLoading={deleteBudget.isPending}
      />
    </div>
  );
}

interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const progressColor = getProgressColor(budget.percentUsed);
  const progressWidth = Math.min(budget.percentUsed, 100);

  return (
    <div className={clsx('card transition-shadow hover:shadow-md', progressColor.bg)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: budget.category.color || '#6366f1' }}
          >
            {budget.category.icon || '📊'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{budget.category.name}</h3>
            <p className="text-sm text-gray-500">
              {budget.rolloverEnabled && budget.rolloverBalance > 0 && (
                <span className="mr-2 text-primary-600">
                  +{formatCurrency(Number(budget.rolloverBalance))} rollover
                </span>
              )}
              Limite: {formatCurrency(Number(budget.effectiveAmount))}
            </p>
          </div>
        </div>

        <Menu as="div" className="relative">
          <Menu.Button className="rounded-lg p-1.5 text-gray-400 hover:bg-white/50 hover:text-gray-600">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onEdit}
                    className={clsx(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm',
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
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
                      'flex w-full items-center gap-2 px-4 py-2 text-sm',
                      active ? 'bg-danger-50 text-danger-600' : 'text-danger-500'
                    )}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Excluir
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className={clsx('text-2xl font-bold', progressColor.text)}>
              {formatCurrency(Number(budget.spent))}
            </span>
            <span className="text-gray-500"> / {formatCurrency(Number(budget.effectiveAmount))}</span>
          </div>
          <span className={clsx('text-sm font-medium', progressColor.text)}>
            {budget.percentUsed.toFixed(0)}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/50">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', progressColor.bar)}
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* Status message */}
        <div className="mt-2 flex items-center justify-between text-sm">
          {budget.percentUsed >= 100 ? (
            <span className="flex items-center gap-1 text-danger-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Excedido em {formatCurrency(Math.abs(Number(budget.remaining)))}
            </span>
          ) : budget.percentUsed >= 80 ? (
            <span className="flex items-center gap-1 text-warning-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Restam {formatCurrency(Number(budget.remaining))}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-success-600">
              <CheckCircleIcon className="h-4 w-4" />
              Restam {formatCurrency(Number(budget.remaining))}
            </span>
          )}
          <span className="text-gray-400">Este mes</span>
        </div>
      </div>
    </div>
  );
}
