import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import Modal from '../ui/Modal';
import {
  Investment,
  InvestmentType,
  useCreateInvestment,
  useUpdateInvestment,
  investmentTypeConfig,
} from '../../hooks/useInvestments';
import { useAccounts } from '../../hooks/useAccounts';
import clsx from 'clsx';

const investmentSchema = z.object({
  type: z.enum([
    'STOCK',
    'FII',
    'CRYPTO',
    'TESOURO_DIRETO',
    'CDB',
    'LCI',
    'LCA',
    'FUND',
    'PROPERTY',
    'OTHER',
  ]),
  name: z.string().min(1, 'Nome e obrigatorio').max(200),
  ticker: z.string().max(20).optional(),
  quantity: z.number().positive().optional(),
  averagePrice: z.number().positive('Preco deve ser positivo'),
  totalInvested: z.number().positive('Valor deve ser positivo'),
  accountId: z.string().optional(),
  institution: z.string().max(100).optional(),
  interestRate: z.number().optional(),
  maturityDate: z.string().optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
  acquisitionDate: z.string().min(1, 'Data e obrigatoria'),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment?: Investment | null;
}

const investmentTypes: { value: InvestmentType; label: string; description: string }[] = [
  { value: 'STOCK', label: 'Acoes', description: 'Acoes de empresas listadas' },
  { value: 'FII', label: 'FIIs', description: 'Fundos Imobiliarios' },
  { value: 'CRYPTO', label: 'Crypto', description: 'Criptomoedas' },
  { value: 'TESOURO_DIRETO', label: 'Tesouro Direto', description: 'Titulos publicos' },
  { value: 'CDB', label: 'CDB', description: 'Certificado de Deposito' },
  { value: 'LCI', label: 'LCI', description: 'Letra de Credito Imobiliario' },
  { value: 'LCA', label: 'LCA', description: 'Letra de Credito Agro' },
  { value: 'FUND', label: 'Fundos', description: 'Fundos de investimento' },
  { value: 'PROPERTY', label: 'Imoveis', description: 'Imoveis fisicos' },
  { value: 'OTHER', label: 'Outros', description: 'Outros investimentos' },
];

export default function InvestmentModal({
  isOpen,
  onClose,
  investment,
}: InvestmentModalProps) {
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();
  const { data: accountsData } = useAccounts();

  const isEditing = !!investment;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      type: 'STOCK',
      name: '',
      ticker: '',
      averagePrice: 0,
      totalInvested: 0,
      acquisitionDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const selectedType = watch('type');
  const quantity = watch('quantity');
  const averagePrice = watch('averagePrice');

  // Auto-calculate total invested when quantity and price change
  useEffect(() => {
    if (quantity && averagePrice) {
      setValue('totalInvested', quantity * averagePrice);
    }
  }, [quantity, averagePrice, setValue]);

  // Show different fields based on investment type
  const showTickerField = useMemo(() => {
    return ['STOCK', 'FII', 'CRYPTO'].includes(selectedType);
  }, [selectedType]);

  const showQuantityField = useMemo(() => {
    return ['STOCK', 'FII', 'CRYPTO', 'FUND'].includes(selectedType);
  }, [selectedType]);

  const showInterestRateField = useMemo(() => {
    return ['TESOURO_DIRETO', 'CDB', 'LCI', 'LCA'].includes(selectedType);
  }, [selectedType]);

  const showMaturityField = useMemo(() => {
    return ['TESOURO_DIRETO', 'CDB', 'LCI', 'LCA'].includes(selectedType);
  }, [selectedType]);

  useEffect(() => {
    if (investment) {
      reset({
        type: investment.type,
        name: investment.name,
        ticker: investment.ticker || '',
        quantity: investment.quantity || undefined,
        averagePrice: Number(investment.averagePrice),
        totalInvested: Number(investment.totalInvested),
        accountId: investment.accountId || undefined,
        institution: investment.institution || '',
        interestRate: investment.interestRate || undefined,
        maturityDate: investment.maturityDate
          ? format(new Date(investment.maturityDate), 'yyyy-MM-dd')
          : '',
        estimatedValue: investment.estimatedValue
          ? Number(investment.estimatedValue)
          : undefined,
        notes: investment.notes || '',
        acquisitionDate: format(new Date(investment.acquisitionDate), 'yyyy-MM-dd'),
      });
    } else {
      reset({
        type: 'STOCK',
        name: '',
        ticker: '',
        averagePrice: 0,
        totalInvested: 0,
        acquisitionDate: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [investment, reset]);

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      const submitData = {
        ...data,
        ticker: data.ticker || undefined,
        accountId: data.accountId || undefined,
        institution: data.institution || undefined,
        interestRate: data.interestRate || undefined,
        maturityDate: data.maturityDate || undefined,
        estimatedValue: data.estimatedValue || undefined,
        notes: data.notes || undefined,
      };

      if (isEditing && investment) {
        await updateInvestment.mutateAsync({ id: investment.id, data: submitData });
      } else {
        await createInvestment.mutateAsync(submitData);
      }
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Investimento' : 'Novo Investimento'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Investment Type */}
        {!isEditing && (
          <div>
            <label className="label">Tipo de investimento *</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {investmentTypes.slice(0, 6).map((type) => {
                const config = investmentTypeConfig[type.value];
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('type', type.value)}
                    className={clsx(
                      'rounded-lg border-2 p-3 text-left transition-all',
                      selectedType === type.value
                        ? `border-current ${config.color} ${config.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p
                      className={clsx(
                        'text-sm font-medium',
                        selectedType === type.value ? config.color : 'text-gray-900'
                      )}
                    >
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {investmentTypes.slice(6).map((type) => {
                const config = investmentTypeConfig[type.value];
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('type', type.value)}
                    className={clsx(
                      'rounded-lg border-2 p-2 text-center transition-all',
                      selectedType === type.value
                        ? `border-current ${config.color} ${config.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p
                      className={clsx(
                        'text-sm font-medium',
                        selectedType === type.value ? config.color : 'text-gray-900'
                      )}
                    >
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Name and Ticker */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome *</label>
            <input
              type="text"
              className={clsx('input', errors.name && 'input-error')}
              placeholder="Ex: Petrobras, Bitcoin, Tesouro IPCA+"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-danger-500">{errors.name.message}</p>
            )}
          </div>

          {showTickerField && (
            <div>
              <label className="label">Ticker/Codigo</label>
              <input
                type="text"
                className="input uppercase"
                placeholder="Ex: PETR4, BTC, KNRI11"
                {...register('ticker')}
              />
            </div>
          )}
        </div>

        {/* Quantity and Price */}
        <div className="grid gap-4 sm:grid-cols-2">
          {showQuantityField && (
            <div>
              <label className="label">Quantidade</label>
              <input
                type="number"
                step="0.00000001"
                className="input"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
              />
            </div>
          )}

          <div>
            <label className="label">Preco medio *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                className={clsx('input pl-12', errors.averagePrice && 'input-error')}
                placeholder="0,00"
                {...register('averagePrice', { valueAsNumber: true })}
              />
            </div>
            {errors.averagePrice && (
              <p className="mt-1 text-sm text-danger-500">{errors.averagePrice.message}</p>
            )}
          </div>
        </div>

        {/* Total Invested */}
        <div>
          <label className="label">Total investido *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              className={clsx('input pl-12', errors.totalInvested && 'input-error')}
              placeholder="0,00"
              {...register('totalInvested', { valueAsNumber: true })}
            />
          </div>
          {errors.totalInvested && (
            <p className="mt-1 text-sm text-danger-500">{errors.totalInvested.message}</p>
          )}
        </div>

        {/* Interest Rate and Maturity (for fixed income) */}
        {(showInterestRateField || showMaturityField) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {showInterestRateField && (
              <div>
                <label className="label">Taxa de juros (% a.a.)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    className="input pr-8"
                    placeholder="0,00"
                    {...register('interestRate', { valueAsNumber: true })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
              </div>
            )}

            {showMaturityField && (
              <div>
                <label className="label">Data de vencimento</label>
                <input type="date" className="input" {...register('maturityDate')} />
              </div>
            )}
          </div>
        )}

        {/* Acquisition Date and Institution */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Data de aquisicao *</label>
            <input
              type="date"
              className={clsx('input', errors.acquisitionDate && 'input-error')}
              {...register('acquisitionDate')}
            />
            {errors.acquisitionDate && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.acquisitionDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Instituicao</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: XP, Rico, Nubank"
              {...register('institution')}
            />
          </div>
        </div>

        {/* Account */}
        <div>
          <label className="label">Conta vinculada</label>
          <select className="input" aria-label="Selecionar conta" {...register('accountId')}>
            <option value="">Nenhuma conta vinculada</option>
            {accountsData?.accounts
              .filter((a) => a.type === 'INVESTMENT')
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        </div>

        {/* Current Value (optional) */}
        <div>
          <label className="label">Valor atual estimado (opcional)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              className="input pl-12"
              placeholder="0,00"
              {...register('estimatedValue', { valueAsNumber: true })}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Se nao informado, sera calculado com base na quantidade x preco medio
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Adicione notas ou observacoes..."
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
          <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
            {isSubmitting
              ? 'Salvando...'
              : isEditing
              ? 'Salvar alteracoes'
              : 'Adicionar investimento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
