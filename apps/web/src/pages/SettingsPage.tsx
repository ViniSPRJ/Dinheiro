import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {
  useProfile,
  useUpdateProfile,
  usePreferences,
  useUpdatePreferences,
  useDeleteAccount,
  useExportData,
  currencyOptions,
  themeOptions,
  dateFormatOptions,
} from '../hooks/useSettings';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Tab configuration
const tabs = [
  { id: 'profile', label: 'Perfil', icon: UserCircleIcon },
  { id: 'preferences', label: 'Preferencias', icon: Cog6ToothIcon },
  { id: 'notifications', label: 'Notificacoes', icon: BellIcon },
  { id: 'security', label: 'Seguranca', icon: ShieldCheckIcon },
] as const;

type TabId = typeof tabs[number]['id'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: preferences, isLoading: preferencesLoading } = usePreferences();
  const updateProfile = useUpdateProfile();
  const updatePreferences = useUpdatePreferences();
  const deleteAccount = useDeleteAccount();
  const exportData = useExportData();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name || '',
    },
  });

  const handleProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updatePreferences.mutate({ theme });
    // Apply theme immediately
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto - check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleCurrencyChange = (currency: 'BRL' | 'USD') => {
    updatePreferences.mutate({ currency });
  };

  const handleDateFormatChange = (dateFormat: string) => {
    updatePreferences.mutate({ dateFormat });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'EXCLUIR') {
      deleteAccount.mutate();
      setShowDeleteDialog(false);
    }
  };

  const handleExportData = () => {
    exportData.mutate();
  };

  if (profileLoading || preferencesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="text-sm text-gray-500">Gerencie sua conta e preferencias</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Foto de perfil</h2>
              <div className="mt-4 flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-600">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Sua foto de perfil aparece em comentarios e atividades
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Alterar foto
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="card">
              <h2 className="text-lg font-semibold text-gray-900">Informacoes pessoais</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="label">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="name"
                    className={clsx(
                      'input',
                      profileForm.formState.errors.name && 'border-danger-500'
                    )}
                    {...profileForm.register('name')}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-danger-600">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input bg-gray-50"
                    value={profile?.email || ''}
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    O email nao pode ser alterado
                  </p>
                </div>
                <div>
                  <label className="label">Membro desde</label>
                  <p className="text-gray-900">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfile.isPending || !profileForm.formState.isDirty}
                  className="btn-primary disabled:opacity-50"
                >
                  {updateProfile.isPending ? 'Salvando...' : 'Salvar alteracoes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Theme */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Aparencia</h2>
              <p className="mt-1 text-sm text-gray-500">
                Escolha como o Dinheiro deve aparecer para voce
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {themeOptions.map((option) => {
                  const isSelected = preferences?.theme === option.value;
                  const Icon =
                    option.value === 'light'
                      ? SunIcon
                      : option.value === 'dark'
                      ? MoonIcon
                      : ComputerDesktopIcon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleThemeChange(option.value)}
                      className={clsx(
                        'relative flex flex-col items-center rounded-lg border-2 p-4 transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {isSelected && (
                        <CheckIcon className="absolute right-2 top-2 h-5 w-5 text-primary-600" />
                      )}
                      <Icon
                        className={clsx(
                          'h-8 w-8',
                          isSelected ? 'text-primary-600' : 'text-gray-400'
                        )}
                      />
                      <span
                        className={clsx(
                          'mt-2 font-medium',
                          isSelected ? 'text-primary-600' : 'text-gray-900'
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Moeda</h2>
              <p className="mt-1 text-sm text-gray-500">
                Moeda padrao para exibicao de valores
              </p>
              <div className="mt-4 space-y-2">
                {currencyOptions.map((option) => {
                  const isSelected = preferences?.currency === option.value;
                  return (
                    <label
                      key={option.value}
                      className={clsx(
                        'flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">
                          {option.symbol}
                        </span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                      <input
                        type="radio"
                        name="currency"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => handleCurrencyChange(option.value)}
                        className="h-5 w-5 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date Format */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Formato de data</h2>
              <p className="mt-1 text-sm text-gray-500">
                Como as datas devem ser exibidas
              </p>
              <div className="mt-4 space-y-2">
                {dateFormatOptions.map((option) => {
                  const isSelected = preferences?.dateFormat === option.value;
                  return (
                    <label
                      key={option.value}
                      className={clsx(
                        'flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div>
                        <span className="font-medium text-gray-900">{option.label}</span>
                        <span className="ml-2 text-sm text-gray-500">({option.example})</span>
                      </div>
                      <input
                        type="radio"
                        name="dateFormat"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => handleDateFormatChange(option.value)}
                        className="h-5 w-5 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Notificacoes por email</h2>
              <p className="mt-1 text-sm text-gray-500">
                Escolha quais emails voce deseja receber
              </p>
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">Resumo semanal</span>
                    <p className="text-sm text-gray-500">
                      Receba um resumo semanal das suas financas
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">Alertas de orcamento</span>
                    <p className="text-sm text-gray-500">
                      Seja notificado quando atingir limites de orcamento
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">Metas atingidas</span>
                    <p className="text-sm text-gray-500">
                      Celebre quando atingir suas metas financeiras
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">Novidades e dicas</span>
                    <p className="text-sm text-gray-500">
                      Receba dicas de financas pessoais e novidades do app
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Notificacoes push</h2>
              <p className="mt-1 text-sm text-gray-500">
                Notificacoes no navegador e celular
              </p>
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">Transacoes</span>
                    <p className="text-sm text-gray-500">
                      Notificacoes de novas transacoes importadas
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">Lembretes de contas</span>
                    <p className="text-sm text-gray-500">
                      Lembre-se de pagar contas proximas do vencimento
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Data Export */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Exportar dados</h2>
              <p className="mt-1 text-sm text-gray-500">
                Baixe uma copia de todos os seus dados (LGPD)
              </p>
              <button
                type="button"
                onClick={handleExportData}
                disabled={exportData.isPending}
                className="btn-secondary mt-4"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                {exportData.isPending ? 'Exportando...' : 'Exportar meus dados'}
              </button>
            </div>

            {/* Change Password */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900">Alterar senha</h2>
              <p className="mt-1 text-sm text-gray-500">
                Atualize sua senha regularmente para manter sua conta segura
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="label">
                    Senha atual
                  </label>
                  <input type="password" id="currentPassword" className="input" />
                </div>
                <div>
                  <label htmlFor="newPassword" className="label">
                    Nova senha
                  </label>
                  <input type="password" id="newPassword" className="input" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirmar nova senha
                  </label>
                  <input type="password" id="confirmPassword" className="input" />
                </div>
              </div>
              <button type="button" className="btn-primary mt-4">
                Alterar senha
              </button>
            </div>

            {/* Danger Zone */}
            <div className="card border-danger-200 bg-danger-50">
              <h2 className="text-lg font-semibold text-danger-700">Zona de perigo</h2>
              <p className="mt-2 text-sm text-danger-600">
                Acoes irreversiveis relacionadas a sua conta. Tenha cuidado.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="btn-danger mt-4"
              >
                <TrashIcon className="h-5 w-5" />
                Excluir minha conta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmText('');
        }}
        onConfirm={handleDeleteAccount}
        title="Excluir conta"
        message={
          <div className="space-y-4">
            <p>
              Esta acao e <strong>permanente e irreversivel</strong>. Todos os seus dados
              serao excluidos, incluindo:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Todas as contas bancarias</li>
              <li>Todas as transacoes</li>
              <li>Todos os orcamentos e metas</li>
              <li>Todos os investimentos</li>
              <li>Historico e configuracoes</li>
            </ul>
            <div>
              <label htmlFor="deleteConfirm" className="block text-sm font-medium text-gray-700">
                Digite <strong>EXCLUIR</strong> para confirmar:
              </label>
              <input
                type="text"
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="input mt-2"
                placeholder="EXCLUIR"
              />
            </div>
          </div>
        }
        confirmText="Excluir permanentemente"
        type="danger"
        confirmDisabled={deleteConfirmText !== 'EXCLUIR'}
      />
    </div>
  );
}
