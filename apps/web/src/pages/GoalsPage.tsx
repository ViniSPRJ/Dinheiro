import { useState } from 'react';
import { Menu } from '@headlessui/react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  TrophyIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import {
  useGoals,
  useDeleteGoal,
  Goal,
} from '../hooks/useGoals';
import GoalModal from '../components/features/GoalModal';
import ContributionModal from '../components/features/ContributionModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function GoalsPage() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: goalsData, isLoading } = useGoals(showCompleted);
  const deleteGoal = useDeleteGoal();

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleAddContribution = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsContributionModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteGoal.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setSelectedGoal(null);
  };

  const handleCloseContributionModal = () => {
    setIsContributionModalOpen(false);
    setSelectedGoal(null);
  };

  // Summary stats
  const stats = goalsData?.goals.reduce(
    (acc, goal) => {
      acc.total += 1;
      acc.totalTarget += goal.targetAmount;
      acc.totalCurrent += goal.currentAmount;
      if (goal.isCompleted) acc.completed += 1;
      return acc;
    },
    { total: 0, completed: 0, totalTarget: 0, totalCurrent: 0 }
  ) || { total: 0, completed: 0, totalTarget: 0, totalCurrent: 0 };

  const overallProgress = stats.totalTarget > 0
    ? (stats.totalCurrent / stats.totalTarget) * 100
    : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
          <p className="text-sm text-gray-500">
            Defina e acompanhe suas metas financeiras
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsGoalModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Nova meta
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <TrophyIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de metas</p>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
              <CheckCircleIcon className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Concluidas</p>
              <p className="text-lg font-bold text-success-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100">
              <BanknotesIcon className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total guardado</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.totalCurrent)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <ClockIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Progresso geral</p>
              <p className="text-lg font-bold text-gray-900">
                {overallProgress.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Mostrar metas concluidas
        </label>
      </div>

      {/* Goals List */}
      {goalsData?.goals.length === 0 ? (
        <div className="card py-12 text-center">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nenhuma meta encontrada</p>
          <button
            type="button"
            onClick={() => setIsGoalModalOpen(true)}
            className="btn-primary mt-4"
          >
            <PlusIcon className="h-5 w-5" />
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalsData?.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => handleEdit(goal)}
              onAddContribution={() => handleAddContribution(goal)}
              onDelete={() => setDeleteTarget(goal)}
            />
          ))}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={handleCloseGoalModal}
        goal={selectedGoal}
      />

      {/* Contribution Modal */}
      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={handleCloseContributionModal}
        goal={selectedGoal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir meta"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todo o progresso sera perdido.`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onAddContribution: () => void;
  onDelete: () => void;
}

function GoalCard({ goal, onEdit, onAddContribution, onDelete }: GoalCardProps) {
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
  const isOverdue = daysLeft < 0 && !goal.isCompleted;
  const isNearDeadline = daysLeft >= 0 && daysLeft <= 30 && !goal.isCompleted;

  return (
    <div
      className={clsx(
        'card relative overflow-hidden',
        goal.isCompleted && 'bg-success-50 border-success-200'
      )}
    >
      {/* Completed badge */}
      {goal.isCompleted && (
        <div className="absolute -right-8 top-3 rotate-45 bg-success-500 px-10 py-1 text-xs font-medium text-white">
          Concluida!
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
            style={{ backgroundColor: `${goal.color || '#3B82F6'}20` }}
          >
            {goal.icon || '🎯'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{goal.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {format(new Date(goal.targetDate), "d 'de' MMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
        </div>

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

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Progresso</span>
          <span className="text-sm font-medium text-gray-900">
            {goal.percentComplete.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${goal.percentComplete}%`,
              backgroundColor: goal.isCompleted ? '#10B981' : goal.color || '#3B82F6',
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="font-medium text-gray-900">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
      </div>

      {/* Stats */}
      {!goal.isCompleted && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3">
          <div>
            <p className="text-xs text-gray-500">Falta</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(goal.remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {daysLeft > 0 ? 'Dias restantes' : 'Atrasado'}
            </p>
            <p
              className={clsx(
                'font-semibold',
                isOverdue ? 'text-danger-600' : isNearDeadline ? 'text-warning-600' : 'text-gray-900'
              )}
            >
              {isOverdue ? `${Math.abs(daysLeft)} dias` : `${daysLeft} dias`}
            </p>
          </div>
          {goal.requiredMonthly > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Guardar por mes</p>
              <p className="font-semibold text-primary-600">
                {formatCurrency(goal.requiredMonthly)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Completed status */}
      {goal.isCompleted && goal.completedAt && (
        <div className="mt-4 flex items-center gap-2 text-success-600">
          <CheckCircleSolidIcon className="h-5 w-5" />
          <span className="text-sm font-medium">
            Concluida em{' '}
            {format(new Date(goal.completedAt), "d 'de' MMM 'de' yyyy", {
              locale: ptBR,
            })}
          </span>
        </div>
      )}

      {/* Action button */}
      {!goal.isCompleted && (
        <button
          type="button"
          onClick={onAddContribution}
          className="btn-primary mt-4 w-full"
        >
          <PlusIcon className="h-5 w-5" />
          Adicionar contribuicao
        </button>
      )}
    </div>
  );
}
