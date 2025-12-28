import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useCreateAccount } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useCreateBudget } from '../hooks/useBudgets';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  BuildingLibraryIcon,
  CreditCardIcon,
  BanknotesIcon,
  WalletIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const steps = [
  { id: 1, title: 'Bem-vindo', description: 'Conheca o Dinheiro' },
  { id: 2, title: 'Primeira conta', description: 'Adicione sua conta' },
  { id: 3, title: 'Categorias', description: 'Escolha suas categorias' },
  { id: 4, title: 'Orcamentos', description: 'Configure seus orcamentos' },
  { id: 5, title: 'Concluido', description: 'Tudo pronto!' },
];

const accountTypes = [
  { value: 'CHECKING', label: 'Conta Corrente', icon: BuildingLibraryIcon },
  { value: 'SAVINGS', label: 'Poupanca', icon: BanknotesIcon },
  { value: 'CREDIT_CARD', label: 'Cartao de Credito', icon: CreditCardIcon },
  { value: 'CASH', label: 'Dinheiro', icon: WalletIcon },
];

const accountSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'OTHER']),
  initialBalance: z.number(),
  institution: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface BudgetAmount {
  categoryId: string;
  amount: number;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetAmounts, setBudgetAmounts] = useState<BudgetAmount[]>([]);
  const [accountCreated, setAccountCreated] = useState(false);

  const navigate = useNavigate();
  const createAccount = useCreateAccount();
  const createBudget = useCreateBudget();
  const { data: expenseCategories } = useCategories('EXPENSE');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'CHECKING',
      initialBalance: 0,
    },
  });

  const selectedType = watch('type');

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleCreateAccount = async (data: AccountFormData) => {
    setIsLoading(true);
    try {
      await createAccount.mutateAsync({
        name: data.name,
        type: data.type,
        initialBalance: data.initialBalance,
        institution: data.institution,
      });
      setAccountCreated(true);
      toast.success('Conta criada com sucesso!');
      handleNext();
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  }, []);

  const handleCategoriesNext = () => {
    // Initialize budget amounts for selected categories
    const initialBudgets = selectedCategories.map((categoryId) => ({
      categoryId,
      amount: 0,
    }));
    setBudgetAmounts(initialBudgets);
    handleNext();
  };

  const updateBudgetAmount = (categoryId: string, amount: number) => {
    setBudgetAmounts((prev) =>
      prev.map((b) => (b.categoryId === categoryId ? { ...b, amount } : b))
    );
  };

  const handleCreateBudgets = async () => {
    setIsLoading(true);
    try {
      const budgetsToCreate = budgetAmounts.filter((b) => b.amount > 0);

      for (const budget of budgetsToCreate) {
        await createBudget.mutateAsync({
          categoryId: budget.categoryId,
          amount: budget.amount,
          period: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0],
        });
      }

      if (budgetsToCreate.length > 0) {
        toast.success(`${budgetsToCreate.length} orcamento(s) criado(s)!`);
      }
      handleNext();
    } catch {
      toast.error('Erro ao criar orcamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await api.post('/users/me/complete-onboarding');
      toast.success('Configuracao concluida!');
      navigate('/dashboard');
    } catch {
      toast.error('Erro ao concluir configuracao');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryById = (categoryId: string) => {
    return expenseCategories?.find((c) => c.id === categoryId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Progress bar */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                    currentStep > step.id && 'bg-success-500 text-white',
                    currentStep === step.id && 'bg-primary-600 text-white',
                    currentStep < step.id && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={clsx(
                      'mx-2 h-1 w-12 rounded transition-all',
                      currentStep > step.id ? 'bg-success-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-gray-900">
              {steps[currentStep - 1].title}
            </p>
            <p className="text-xs text-gray-500">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center animate-fade-in">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
                <SparklesIcon className="h-12 w-12 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold text-gray-900">
                Bem-vindo ao Dinheiro!
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Vamos configurar sua conta em poucos passos para voce comecar a
                controlar suas financas de forma inteligente.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <BuildingLibraryIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Adicione suas contas</p>
                    <p className="text-sm text-gray-500">Bancos, cartoes, carteira</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
                    <CheckIcon className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Escolha categorias</p>
                    <p className="text-sm text-gray-500">Personalize sua experiencia</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100">
                    <BanknotesIcon className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Configure orcamentos</p>
                    <p className="text-sm text-gray-500">Controle seus gastos</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary mt-8 w-full"
              >
                Vamos comecar
              </button>
            </div>
          )}

          {/* Step 2: First Account */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit(handleCreateAccount)} className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">
                Adicione sua primeira conta
              </h2>
              <p className="mt-2 text-gray-600">
                Pode ser sua conta corrente, cartao de credito, ou carteira.
              </p>

              {/* Account Type Selection */}
              <div className="mt-6">
                <label className="label">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-3">
                  {accountTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setValue('type', type.value as AccountFormData['type'])}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                        selectedType === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <type.icon
                        className={clsx(
                          'h-6 w-6',
                          selectedType === type.value
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        )}
                      />
                      <span
                        className={clsx(
                          'font-medium',
                          selectedType === type.value
                            ? 'text-primary-900'
                            : 'text-gray-700'
                        )}
                      >
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="label">Nome da conta *</label>
                  <input
                    type="text"
                    className={clsx('input', errors.name && 'input-error')}
                    placeholder="Ex: Nubank, Itau, Carteira"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-danger-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Instituicao (opcional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Nubank, Bradesco, etc."
                    {...register('institution')}
                  />
                </div>

                <div>
                  <label className="label">Saldo atual</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="input pl-12"
                      placeholder="0,00"
                      {...register('initialBalance', { valueAsNumber: true })}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Para cartao de credito, deixe 0 ou informe a fatura atual como negativo
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn-secondary flex-1"
                  disabled={isLoading}
                >
                  Pular
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando...' : 'Adicionar conta'}
                </button>
              </div>

              {accountCreated && (
                <p className="mt-4 text-center text-sm text-success-600">
                  <CheckIcon className="mr-1 inline h-4 w-4" />
                  Conta criada! Voce pode adicionar mais depois.
                </p>
              )}
            </form>
          )}

          {/* Step 3: Categories */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">
                Escolha suas categorias
              </h2>
              <p className="mt-2 text-gray-600">
                Selecione as categorias que mais usa para criar orcamentos.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {expenseCategories?.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={clsx(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                      selectedCategories.includes(category.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        selectedCategories.includes(category.id)
                          ? 'text-primary-900'
                          : 'text-gray-700'
                      )}
                    >
                      {category.name}
                    </span>
                    {selectedCategories.includes(category.id) && (
                      <CheckIcon className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>

              {selectedCategories.length > 0 && (
                <p className="mt-4 text-center text-sm text-primary-600">
                  {selectedCategories.length} categoria(s) selecionada(s)
                </p>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn-secondary flex-1"
                  disabled={isLoading}
                >
                  Pular
                </button>
                <button
                  type="button"
                  onClick={handleCategoriesNext}
                  className="btn-primary flex-1"
                  disabled={isLoading || selectedCategories.length === 0}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Budgets */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">
                Configure seus orcamentos
              </h2>
              <p className="mt-2 text-gray-600">
                Defina limites mensais para controlar seus gastos.
              </p>

              {budgetAmounts.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {budgetAmounts.map((budget) => {
                    const category = getCategoryById(budget.categoryId);
                    if (!category) return null;
                    return (
                      <div
                        key={budget.categoryId}
                        className="flex items-center justify-between rounded-lg border bg-white p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-medium text-gray-900">
                            {category.name}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-32 pl-10 text-right"
                            placeholder="0"
                            value={budget.amount || ''}
                            onChange={(e) =>
                              updateBudgetAmount(
                                budget.categoryId,
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-gray-500">
                    Nenhuma categoria selecionada. Voce pode criar orcamentos depois.
                  </p>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn-secondary flex-1"
                  disabled={isLoading}
                >
                  Pular
                </button>
                <button
                  type="button"
                  onClick={handleCreateBudgets}
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando...' : 'Criar orcamentos'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center animate-fade-in">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-success-400 to-success-600 shadow-lg">
                <CheckIcon className="h-12 w-12 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold text-gray-900">
                Tudo pronto!
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Sua conta esta configurada. Agora voce pode comecar a controlar
                suas financas com o Dinheiro.
              </p>

              <div className="mt-8 space-y-3 text-left">
                {accountCreated && (
                  <div className="flex items-center gap-3 rounded-lg bg-success-50 p-4">
                    <CheckIcon className="h-5 w-5 text-success-600" />
                    <span className="text-success-700">Conta bancaria adicionada</span>
                  </div>
                )}
                {selectedCategories.length > 0 && (
                  <div className="flex items-center gap-3 rounded-lg bg-success-50 p-4">
                    <CheckIcon className="h-5 w-5 text-success-600" />
                    <span className="text-success-700">
                      {selectedCategories.length} categoria(s) selecionada(s)
                    </span>
                  </div>
                )}
                {budgetAmounts.filter((b) => b.amount > 0).length > 0 && (
                  <div className="flex items-center gap-3 rounded-lg bg-success-50 p-4">
                    <CheckIcon className="h-5 w-5 text-success-600" />
                    <span className="text-success-700">
                      {budgetAmounts.filter((b) => b.amount > 0).length} orcamento(s)
                      configurado(s)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="btn-primary mt-8 w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Finalizando...' : 'Ir para o Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
