import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import clsx from 'clsx';
import Modal from '../ui/Modal';
import { useCreateDividend } from '../../hooks/useDividends';
import { useInvestments } from '../../hooks/useInvestments';

const dividendSchema = z.object({
  investmentId: z.string().min(1, 'Selecione um investimento'),
  type: z.enum(['DIVIDENDO', 'JCP', 'RENDIMENTO']),
  amountPerShare: z.number().positive('Valor por cota/acao deve ser positivo'),
  totalAmount: z.number().positive('Valor total deve ser positivo'),
  paymentDate: z.string().min(1, 'Data e obrigatoria'),
  withholdingTax: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type DividendFormData = z.infer<typeof dividendSchema>;

interface DividendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DividendModal({ isOpen, onClose }: DividendModalProps) {
  const createDividend = useCreateDividend();
  const { data: investmentsData } = useInvestments();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DividendFormData>({
    resolver: zodResolver(dividendSchema),
    defaultValues: {
      type: 'DIVIDENDO',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: DividendFormData) => {
    try {
      await createDividend.mutateAsync(data);
      reset({ type: 'DIVIDENDO', paymentDate: format(new Date(), 'yyyy-MM-dd') });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lancar provento" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Investimento *</label>
          <select
            className={clsx('input', errors.investmentId && 'input-error')}
            aria-label="Selecionar investimento"
            {...register('investmentId')}
          >
            <option value="">Selecione...</option>
            {investmentsData?.investments.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.ticker ? `${inv.name} (${inv.ticker})` : inv.name}
              </option>
            ))}
          </select>
          {errors.investmentId && (
            <p className="mt-1 text-sm text-danger-500">{errors.investmentId.message}</p>
          )}
        </div>

        <div>
          <label className="label">Tipo</label>
          <select className="input" aria-label="Tipo de provento" {...register('type')}>
            <option value="DIVIDENDO">Dividendo</option>
            <option value="JCP">JCP (Juros sobre Capital Proprio)</option>
            <option value="RENDIMENTO">Rendimento</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Valor por cota/acao *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.000001"
                className={clsx('input pl-12', errors.amountPerShare && 'input-error')}
                placeholder="0,00"
                {...register('amountPerShare', { valueAsNumber: true })}
              />
            </div>
            {errors.amountPerShare && (
              <p className="mt-1 text-sm text-danger-500">{errors.amountPerShare.message}</p>
            )}
          </div>

          <div>
            <label className="label">Valor total recebido *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                className={clsx('input pl-12', errors.totalAmount && 'input-error')}
                placeholder="0,00"
                {...register('totalAmount', { valueAsNumber: true })}
              />
            </div>
            {errors.totalAmount && (
              <p className="mt-1 text-sm text-danger-500">{errors.totalAmount.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Data de pagamento *</label>
            <input
              type="date"
              className={clsx('input', errors.paymentDate && 'input-error')}
              {...register('paymentDate')}
            />
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-danger-500">{errors.paymentDate.message}</p>
            )}
          </div>

          <div>
            <label className="label">IR retido na fonte (JCP)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                className="input pl-12"
                placeholder="0,00"
                {...register('withholdingTax', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <textarea
            className="input min-h-[60px] resize-none"
            placeholder="Adicione notas ou observacoes..."
            {...register('notes')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Lancar provento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
