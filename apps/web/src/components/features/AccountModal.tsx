import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../ui/Modal';
import { Account, useCreateAccount, useUpdateAccount } from '../../hooks/useAccounts';
import { useEffect } from 'react';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CRYPTO', 'CASH', 'LOAN', 'PROPERTY', 'OTHER']),
  institution: z.string().max(100).optional(),
  currency: z.enum(['BRL', 'USD']),
  initialBalance: z.number(),
  color: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
}

const accountTypes = [
  { value: 'CHECKING', label: 'Conta Corrente', icon: '🏦' },
  { value: 'SAVINGS', label: 'Poupanca', icon: '🐷' },
  { value: 'CREDIT_CARD', label: 'Cartao de Credito', icon: '💳' },
  { value: 'INVESTMENT', label: 'Investimentos', icon: '📈' },
  { value: 'CRYPTO', label: 'Criptomoedas', icon: '🪙' },
  { value: 'CASH', label: 'Dinheiro', icon: '💵' },
  { value: 'LOAN', label: 'Emprestimo', icon: '📝' },
  { value: 'PROPERTY', label: 'Imoveis', icon: '🏠' },
  { value: 'OTHER', label: 'Outros', icon: '📦' },
];

const defaultColors = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

const banks = [
  'Nubank',
  'Itau',
  'Bradesco',
  'Banco do Brasil',
  'Santander',
  'Caixa',
  'Inter',
  'C6 Bank',
  'PicPay',
  'Mercado Pago',
  'BTG Pactual',
  'XP Investimentos',
  'Rico',
  'Clear',
  'Binance',
  'Outro',
];

export default function AccountModal({ isOpen, onClose, account }: AccountModalProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const isEditing = !!account;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'CHECKING',
      institution: '',
      currency: 'BRL',
      initialBalance: 0,
      color: defaultColors[0],
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type as AccountFormData['type'],
        institution: account.institution || '',
        currency: account.currency as AccountFormData['currency'],
        initialBalance: Number(account.initialBalance),
        color: account.color || defaultColors[0],
      });
    } else {
      reset({
        name: '',
        type: 'CHECKING',
        institution: '',
        currency: 'BRL',
        initialBalance: 0,
        color: defaultColors[0],
      });
    }
  }, [account, reset]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (isEditing && account) {
        await updateAccount.mutateAsync({ id: account.id, data });
      } else {
        await createAccount.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Conta' : 'Nova Conta'}
      description={isEditing ? 'Atualize os dados da sua conta' : 'Adicione uma nova conta para rastrear'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Account Name */}
        <div>
          <label className="label">Nome da conta *</label>
          <input
            type="text"
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="Ex: Nubank Conta Corrente"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-danger-500">{errors.name.message}</p>
          )}
        </div>

        {/* Account Type */}
        <div>
          <label className="label">Tipo de conta *</label>
          <div className="grid grid-cols-3 gap-2">
            {accountTypes.map((type) => (
              <label
                key={type.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  watch('type') === type.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={type.value}
                  className="sr-only"
                  {...register('type')}
                />
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm font-medium text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Institution */}
        <div>
          <label className="label">Instituicao</label>
          <select className="input" {...register('institution')}>
            <option value="">Selecione</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>

        {/* Initial Balance */}
        <div>
          <label className="label">
            {isEditing ? 'Saldo inicial' : 'Saldo atual'} *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
            <input
              type="number"
              step="0.01"
              className={`input pl-10 ${errors.initialBalance ? 'input-error' : ''}`}
              placeholder="0,00"
              {...register('initialBalance', { valueAsNumber: true })}
            />
          </div>
          {errors.initialBalance && (
            <p className="mt-1 text-sm text-danger-500">{errors.initialBalance.message}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="label">Moeda</label>
          <select className="input" {...register('currency')}>
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dolar (USD)</option>
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="label">Cor</label>
          <div className="flex flex-wrap gap-2">
            {defaultColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`h-8 w-8 rounded-full transition-transform ${
                  selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-primary-500' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
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
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar conta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
