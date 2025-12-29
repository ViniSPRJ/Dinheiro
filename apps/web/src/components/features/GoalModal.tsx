import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import Modal from '../ui/Modal';
import {
  Goal,
  useCreateGoal,
  useUpdateGoal,
  goalIcons,
  goalColors,
} from '../../hooks/useGoals';
import clsx from 'clsx';

const goalSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(200),
  targetAmount: z.number().positive('Valor deve ser positivo'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().min(1, 'Data e obrigatoria'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

export default function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const isEditing = !!goal;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
      icon: '🎯',
      color: '#3B82F6',
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const targetAmount = watch('targetAmount');
  const currentAmount = watch('currentAmount');

  const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: format(new Date(goal.targetDate), 'yyyy-MM-dd'),
        icon: goal.icon || '🎯',
        color: goal.color || '#3B82F6',
      });
    } else {
      reset({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
        icon: '🎯',
        color: '#3B82F6',
      });
    }
  }, [goal, reset]);

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (isEditing && goal) {
        await updateGoal.mutateAsync({ id: goal.id, data });
      } else {
        await createGoal.mutateAsync(data);
      }
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Meta' : 'Nova Meta'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Icon Selection */}
        <div>
          <label className="label">Icone</label>
          <div className="flex flex-wrap gap-2">
            {goalIcons.map((icon) => (
              <button
                key={icon.value}
                type="button"
                onClick={() => setValue('icon', icon.value)}
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all',
                  selectedIcon === icon.value
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                )}
                title={icon.label}
              >
                {icon.value}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="label">Cor</label>
          <div className="flex flex-wrap gap-2">
            {goalColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('color', color.value)}
                className={clsx(
                  'h-8 w-8 rounded-full transition-all',
                  selectedColor === color.value && 'ring-2 ring-offset-2'
                )}
                style={{ backgroundColor: color.value, ringColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="label">Nome da meta *</label>
          <input
            type="text"
            className={clsx('input', errors.name && 'input-error')}
            placeholder="Ex: Viagem para Europa, Carro novo, Reserva de emergencia"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-danger-500">{errors.name.message}</p>
          )}
        </div>

        {/* Target Amount */}
        <div>
          <label className="label">Valor da meta *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              className={clsx('input pl-12', errors.targetAmount && 'input-error')}
              placeholder="0,00"
              {...register('targetAmount', { valueAsNumber: true })}
            />
          </div>
          {errors.targetAmount && (
            <p className="mt-1 text-sm text-danger-500">{errors.targetAmount.message}</p>
          )}
        </div>

        {/* Current Amount */}
        <div>
          <label className="label">Valor ja guardado</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              className="input pl-12"
              placeholder="0,00"
              {...register('currentAmount', { valueAsNumber: true })}
            />
          </div>
          {targetAmount > 0 && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">Progresso</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(currentAmount)} de {formatCurrency(targetAmount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: selectedColor || '#3B82F6',
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">
                {progress.toFixed(1)}% concluido
              </p>
            </div>
          )}
        </div>

        {/* Target Date */}
        <div>
          <label className="label">Data limite *</label>
          <input
            type="date"
            className={clsx('input', errors.targetDate && 'input-error')}
            {...register('targetDate')}
          />
          {errors.targetDate && (
            <p className="mt-1 text-sm text-danger-500">{errors.targetDate.message}</p>
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
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar meta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
