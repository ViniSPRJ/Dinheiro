import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import Modal from '../ui/Modal';
import { Goal, useAddContribution } from '../../hooks/useGoals';
import clsx from 'clsx';

const contributionSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data e obrigatoria'),
  notes: z.string().optional(),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export default function ContributionModal({
  isOpen,
  onClose,
  goal,
}: ContributionModalProps) {
  const addContribution = useAddContribution();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const amount = watch('amount');

  useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ContributionFormData) => {
    if (!goal) return;

    try {
      await addContribution.mutateAsync({
        goalId: goal.id,
        data,
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!goal) return null;

  const newTotal = goal.currentAmount + (amount || 0);
  const newProgress = goal.targetAmount > 0 ? (newTotal / goal.targetAmount) * 100 : 0;
  const willComplete = newTotal >= goal.targetAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar contribuicao"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Goal Summary */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{goal.icon || '🎯'}</span>
            <div>
              <p className="font-medium text-gray-900">{goal.name}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${goal.percentComplete}%`,
                  backgroundColor: goal.color || '#3B82F6',
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 text-right">
              {goal.percentComplete.toFixed(1)}% concluido
            </p>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="label">Valor da contribuicao *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              className={clsx('input pl-12 text-lg', errors.amount && 'input-error')}
              placeholder="0,00"
              autoFocus
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-danger-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Preview of new progress */}
        {amount > 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700">Apos esta contribuicao:</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-500">Novo total:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(newTotal)}
              </span>
            </div>
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, newProgress)}%`,
                    backgroundColor: willComplete ? '#10B981' : goal.color || '#3B82F6',
                  }}
                />
              </div>
              <p
                className={clsx(
                  'mt-1 text-xs text-right font-medium',
                  willComplete ? 'text-success-600' : 'text-gray-500'
                )}
              >
                {willComplete
                  ? 'Meta sera alcancada!'
                  : `${newProgress.toFixed(1)}% concluido`}
              </p>
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="label">Data *</label>
          <input
            type="date"
            className={clsx('input', errors.date && 'input-error')}
            {...register('date')}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-danger-500">{errors.date.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Ex: Bonus do trabalho, 13o salario..."
            {...register('notes')}
          />
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
            {isSubmitting ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
