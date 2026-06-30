import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';
import Modal from '../ui/Modal';
import {
  Transaction,
  useCreateTransaction,
  useUpdateTransaction,
  useExtractReceipt,
} from '../../hooks/useTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useCategorySuggestion } from '../../hooks/useCategorySuggestion';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  CheckIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const transactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descricao e obrigatoria').max(500),
  date: z.string().min(1, 'Data e obrigatoria'),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  transferFromId: z.string().optional(),
  transferToId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'RECONCILED']),
  notes: z.string().max(1000).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  defaultType?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
}

const transactionTypes = [
  { value: 'EXPENSE', label: 'Despesa', icon: ArrowDownIcon, color: 'text-danger-600 bg-danger-50' },
  { value: 'INCOME', label: 'Receita', icon: ArrowUpIcon, color: 'text-success-600 bg-success-50' },
  { value: 'TRANSFER', label: 'Transferencia', icon: ArrowsRightLeftIcon, color: 'text-primary-600 bg-primary-50' },
] as const;

export default function TransactionModal({
  isOpen,
  onClose,
  transaction,
  defaultType = 'EXPENSE',
}: TransactionModalProps) {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const { data: accountsData } = useAccounts();
  const { data: expenseCategories } = useCategories('EXPENSE');
  const { data: incomeCategories } = useCategories('INCOME');
  const { suggestion, isLoading: isSuggesting, suggest, clearSuggestion } = useCategorySuggestion();
  const extractReceipt = useExtractReceipt();

  const isEditing = !!transaction;
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    transactionTypes.findIndex((t) => t.value === defaultType)
  );
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: 0,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'CONFIRMED',
    },
  });

  const currentType = watch('type');
  const description = watch('description');
  const currentCategoryId = watch('categoryId');

  const categories = useMemo(() => {
    if (currentType === 'EXPENSE') return expenseCategories || [];
    if (currentType === 'INCOME') return incomeCategories || [];
    return [];
  }, [currentType, expenseCategories, incomeCategories]);

  // Trigger AI suggestion when description changes
  useEffect(() => {
    if (!isEditing && description && currentType !== 'TRANSFER') {
      suggest({ description });
      setSuggestionApplied(false);
    }
  }, [description, isEditing, currentType, suggest]);

  // Auto-apply suggestion if confidence is high and no category selected
  useEffect(() => {
    if (
      suggestion &&
      suggestion.confidence > 0.6 &&
      !currentCategoryId &&
      !suggestionApplied
    ) {
      // Find matching category in our list
      const matchingCategory = categories.find(
        (c) => c.id === suggestion.categoryId || c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
      );
      if (matchingCategory) {
        setValue('categoryId', matchingCategory.id);
        setSuggestionApplied(true);
      }
    }
  }, [suggestion, currentCategoryId, suggestionApplied, categories, setValue]);

  useEffect(() => {
    if (transaction) {
      const typeIndex = transactionTypes.findIndex((t) => t.value === transaction.type);
      setSelectedTabIndex(typeIndex >= 0 ? typeIndex : 0);
      reset({
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description,
        date: format(new Date(transaction.date), 'yyyy-MM-dd'),
        categoryId: transaction.categoryId || undefined,
        accountId: transaction.accountId || undefined,
        status: transaction.status,
        notes: transaction.notes || undefined,
      });
      clearSuggestion();
    } else {
      const typeIndex = transactionTypes.findIndex((t) => t.value === defaultType);
      setSelectedTabIndex(typeIndex >= 0 ? typeIndex : 0);
      reset({
        type: defaultType,
        amount: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'CONFIRMED',
      });
      clearSuggestion();
      setSuggestionApplied(false);
    }
  }, [transaction, defaultType, reset, clearSuggestion]);

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
    setValue('type', transactionTypes[index].value);
    setValue('categoryId', undefined);
    clearSuggestion();
    setSuggestionApplied(false);
  };

  const applySuggestion = () => {
    if (suggestion) {
      const matchingCategory = categories.find(
        (c) => c.id === suggestion.categoryId || c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
      );
      if (matchingCategory) {
        setValue('categoryId', matchingCategory.id);
        setSuggestionApplied(true);
      }
    }
  };

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const extraction = await extractReceipt.mutateAsync(file).catch(() => null);
    if (!extraction || !extraction.available) return;

    if (extraction.amount) setValue('amount', extraction.amount);
    if (extraction.date) setValue('date', extraction.date);
    // Setting description re-triggers the existing AI category suggestion
    // effect above, so the OCR-derived merchant flows through the same
    // confidence-badge UI text entry already uses -- no separate suggestion
    // path needed for the OCR case.
    if (extraction.merchant) setValue('description', extraction.merchant);
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (isEditing && transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, data });
      } else {
        await createTransaction.mutateAsync(data);
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
      title={isEditing ? 'Editar Transacao' : 'Nova Transacao'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Transaction Type Tabs */}
        {!isEditing && (
          <Tab.Group selectedIndex={selectedTabIndex} onChange={handleTabChange}>
            <Tab.List className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {transactionTypes.map((type) => (
                <Tab
                  key={type.value}
                  className={({ selected }) =>
                    clsx(
                      'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all focus:outline-none',
                      selected
                        ? `${type.color} shadow-sm`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </Tab>
              ))}
            </Tab.List>
          </Tab.Group>
        )}

        {/* Receipt OCR import */}
        {!isEditing && (
          <div>
            <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 text-sm">
              <DocumentArrowUpIcon className="h-4 w-4" />
              {extractReceipt.isPending ? 'Lendo recibo...' : 'Importar recibo (foto ou PDF)'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleReceiptUpload}
                disabled={extractReceipt.isPending}
              />
            </label>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="label">Valor *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-gray-400">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              className={clsx(
                'input pl-14 text-2xl font-bold',
                errors.amount && 'input-error',
                currentType === 'INCOME' && 'text-success-600',
                currentType === 'EXPENSE' && 'text-danger-600',
                currentType === 'TRANSFER' && 'text-primary-600'
              )}
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              autoFocus
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-danger-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="label">Descricao *</label>
          <input
            type="text"
            className={clsx('input', errors.description && 'input-error')}
            placeholder="Ex: Supermercado, Salario, etc."
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger-500">{errors.description.message}</p>
          )}
        </div>

        {/* Date and Account (side by side) */}
        <div className="grid gap-4 sm:grid-cols-2">
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

          {currentType !== 'TRANSFER' ? (
            <div>
              <label className="label">Conta</label>
              <select className="input" aria-label="Selecionar conta" {...register('accountId')}>
                <option value="">Selecione uma conta</option>
                {accountsData?.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">De (origem)</label>
              <select className="input" aria-label="Conta de origem" {...register('transferFromId')}>
                <option value="">Selecione</option>
                {accountsData?.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Transfer To Account */}
        {currentType === 'TRANSFER' && (
          <div>
            <label className="label">Para (destino)</label>
            <select className="input" aria-label="Conta de destino" {...register('transferToId')}>
              <option value="">Selecione</option>
              {accountsData?.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category with AI Suggestion (only for expense/income) */}
        {currentType !== 'TRANSFER' && (
          <div>
            <label className="label flex items-center gap-2">
              Categoria
              {(isSuggesting || suggestion) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                  <SparklesIcon className="h-3 w-3" />
                  {isSuggesting ? 'Analisando...' : 'IA'}
                </span>
              )}
            </label>
            <select
              className="input"
              aria-label="Selecionar categoria"
              {...register('categoryId')}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            {/* AI Suggestion Badge */}
            {suggestion && !suggestionApplied && suggestion.confidence > 0.3 && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-primary-50 p-3">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-primary-600" />
                  <div className="text-sm">
                    <span className="text-gray-600">Sugestao: </span>
                    <span className="font-semibold text-primary-600">
                      {suggestion.categoryIcon} {suggestion.categoryName}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      ({Math.round(suggestion.confidence * 100)}% confianca)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="btn-ghost text-sm text-primary-600"
                >
                  <CheckIcon className="h-4 w-4" />
                  Aplicar
                </button>
              </div>
            )}

            {suggestionApplied && suggestion && (
              <p className="mt-1 flex items-center gap-1 text-xs text-success-600">
                <CheckIcon className="h-3 w-3" />
                Categoria sugerida pela IA aplicada
              </p>
            )}
          </div>
        )}

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <div className="flex gap-2">
            {[
              { value: 'CONFIRMED', label: 'Confirmada', color: 'bg-success-50 text-success-600 border-success-200' },
              { value: 'PENDING', label: 'Pendente', color: 'bg-warning-50 text-warning-600 border-warning-200' },
            ].map((status) => (
              <label
                key={status.value}
                className={clsx(
                  'flex-1 cursor-pointer rounded-lg border-2 p-3 text-center text-sm font-medium transition-all',
                  watch('status') === status.value
                    ? status.color
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  value={status.value}
                  className="sr-only"
                  {...register('status')}
                />
                {status.label}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Adicione notas ou detalhes..."
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
            className={clsx(
              'btn flex-1',
              currentType === 'EXPENSE' && 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
              currentType === 'INCOME' && 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500',
              currentType === 'TRANSFER' && 'btn-primary'
            )}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Salvando...'
              : isEditing
              ? 'Salvar'
              : currentType === 'EXPENSE'
              ? 'Adicionar despesa'
              : currentType === 'INCOME'
              ? 'Adicionar receita'
              : 'Adicionar transferencia'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
