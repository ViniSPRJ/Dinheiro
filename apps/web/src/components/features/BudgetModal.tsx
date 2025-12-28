import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import Modal from '../ui/Modal';
import { Budget, useCreateBudget, useUpdateBudget, useBudgetSuggestions } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.number().positive('Valor deve ser positivo'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  rolloverEnabled: z.boolean().default(false),
  startDate: z.string().min(1, 'Data e obrigatoria'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget | null;
}

const periodLabels = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function BudgetModal({ isOpen, onClose, budget }: BudgetModalProps) {
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { data: categories } = useCategories('EXPENSE');
  const { data: suggestions } = useBudgetSuggestions();

  const isEditing = !!budget;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: 0,
      period: 'MONTHLY',
      rolloverEnabled: false,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const selectedCategoryId = watch('categoryId');

  useEffect(() => {
    if (budget) {
      reset({
        categoryId: budget.categoryId,
        amount: Number(budget.amount),
        period: budget.period,
        rolloverEnabled: budget.rolloverEnabled,
        startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
      });
    } else {
      reset({
        categoryId: '',
        amount: 0,
        period: 'MONTHLY',
        rolloverEnabled: false,
        startDate: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [budget, reset]);

  // Get suggestion for selected category
  const suggestion = suggestions?.find((s) => s.categoryId === selectedCategoryId);

  const applySuggestion = () => {
    if (suggestion) {
      setValue('amount', suggestion.suggestedAmount);
    }
  };

  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (isEditing && budget) {
        await updateBudget.mutateAsync({ id: budget.id, data });
      } else {
        await createBudget.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  // Filter out categories that already have budgets (unless editing)
  const availableCategories = categories?.filter((cat) => {
    if (isEditing && cat.id === budget?.categoryId) return true;
    return true; // For now, allow all - can be filtered by existing budgets
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Orcamento' : 'Novo Orcamento'}
      description={isEditing ? 'Atualize o limite do seu orcamento' : 'Defina um limite de gastos para uma categoria'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category */}
        <div>
          <label className="label">Categoria *</label>
          <select
            className={clsx('input', errors.categoryId && 'input-error')}
            aria-label="Selecionar categoria"
            {...register('categoryId')}
            disabled={isEditing}
          >
            <option value="">Selecione uma categoria</option>
            {availableCategories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-danger-500">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Amount with suggestion */}
        <div>
          <label className="label">Limite mensal *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
            <input
              type="number"
              step="0.01"
              className={clsx('input pl-12', errors.amount && 'input-error')}
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-danger-500">{errors.amount.message}</p>
          )}

          {/* AI Suggestion */}
          {suggestion && !isEditing && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-primary-50 p-3">
              <div className="flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-primary-600" />
                <div className="text-sm">
                  <span className="text-gray-600">Sugestao baseada no historico: </span>
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(suggestion.suggestedAmount)}
                  </span>
                  <span className="text-gray-500">
                    {' '}(media: {formatCurrency(suggestion.monthlyAverage)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={applySuggestion}
                className="btn-ghost text-sm text-primary-600"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Period */}
        <div>
          <label className="label">Periodo</label>
          <div className="flex gap-2">
            {Object.entries(periodLabels).map(([value, label]) => (
              <label
                key={value}
                className={clsx(
                  'flex-1 cursor-pointer rounded-lg border-2 p-3 text-center text-sm font-medium transition-all',
                  watch('period') === value
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register('period')}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Rollover */}
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
          <input
            type="checkbox"
            id="rolloverEnabled"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            {...register('rolloverEnabled')}
          />
          <label htmlFor="rolloverEnabled" className="flex-1">
            <span className="block text-sm font-medium text-gray-700">
              Rollover de saldo
            </span>
            <span className="block text-xs text-gray-500">
              Se nao gastar todo o orcamento, o saldo restante acumula para o proximo periodo
            </span>
          </label>
        </div>

        {/* Start Date */}
        <div>
          <label className="label">Data de inicio</label>
          <input
            type="date"
            className={clsx('input', errors.startDate && 'input-error')}
            {...register('startDate')}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-danger-500">{errors.startDate.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar orcamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
