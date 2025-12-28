import { useState } from 'react';
import { useAccounts, useDeleteAccount, useArchiveAccount, Account } from '../hooks/useAccounts';
import { PlusIcon, CreditCardIcon, EllipsisVerticalIcon, ArchiveBoxIcon, PencilIcon, TrashIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import AccountModal from '../components/features/AccountModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const accountTypeLabels: Record<string, { label: string; icon: string }> = {
  CHECKING: { label: 'Conta Corrente', icon: '🏦' },
  SAVINGS: { label: 'Poupanca', icon: '🐷' },
  CREDIT_CARD: { label: 'Cartao de Credito', icon: '💳' },
  INVESTMENT: { label: 'Investimentos', icon: '📈' },
  CRYPTO: { label: 'Criptomoedas', icon: '🪙' },
  CASH: { label: 'Dinheiro', icon: '💵' },
  LOAN: { label: 'Emprestimo', icon: '📝' },
  PROPERTY: { label: 'Imoveis', icon: '🏠' },
  OTHER: { label: 'Outros', icon: '📦' },
};

export default function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<Account | null>(null);

  const { data, isLoading } = useAccounts(showArchived);
  const deleteAccount = useDeleteAccount();
  const archiveAccount = useArchiveAccount();

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmAccount) {
      await deleteAccount.mutateAsync(deleteConfirmAccount.id);
      setDeleteConfirmAccount(null);
    }
  };

  const handleArchive = async (account: Account) => {
    await archiveAccount.mutateAsync({ id: account.id, archive: !account.isArchived });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const activeAccounts = data?.accounts.filter((a) => !a.isArchived) || [];
  const archivedAccounts = data?.accounts.filter((a) => a.isArchived) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-sm text-gray-500">
            Saldo total: {formatCurrency(data?.totalBalance || 0)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Mostrar arquivadas
          </label>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5" />
            Nova conta
          </button>
        </div>
      </div>

      {/* Active Accounts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeAccounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={() => handleEdit(account)}
            onDelete={() => setDeleteConfirmAccount(account)}
            onArchive={() => handleArchive(account)}
          />
        ))}

        {activeAccounts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12">
            <CreditCardIcon className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conta</h3>
            <p className="mt-1 text-sm text-gray-500">Adicione sua primeira conta</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary mt-4"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar conta
            </button>
          </div>
        )}
      </div>

      {/* Archived Accounts */}
      {showArchived && archivedAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Contas Arquivadas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archivedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => handleEdit(account)}
                onDelete={() => setDeleteConfirmAccount(account)}
                onArchive={() => handleArchive(account)}
                isArchived
              />
            ))}
          </div>
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmAccount}
        onClose={() => setDeleteConfirmAccount(null)}
        onConfirm={handleDelete}
        title="Excluir conta"
        message={`Tem certeza que deseja excluir a conta "${deleteConfirmAccount?.name}"? Esta acao nao pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={deleteAccount.isPending}
      />
    </div>
  );
}

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  isArchived?: boolean;
}

function AccountCard({ account, onEdit, onDelete, onArchive, isArchived }: AccountCardProps) {
  const typeInfo = accountTypeLabels[account.type] || { label: account.type, icon: '📦' };

  return (
    <div
      className={`card transition-shadow hover:shadow-md ${
        isArchived ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: account.color || '#6366f1' }}
          >
            {typeInfo.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500">{typeInfo.label}</p>
          </div>
        </div>

        <Menu as="div" className="relative">
          <Menu.Button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onEdit}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <PencilIcon className="h-4 w-4" />
                    Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onArchive}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {isArchived ? (
                      <>
                        <ArchiveBoxXMarkIcon className="h-4 w-4" />
                        Desarquivar
                      </>
                    ) : (
                      <>
                        <ArchiveBoxIcon className="h-4 w-4" />
                        Arquivar
                      </>
                    )}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onDelete}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                      active ? 'bg-danger-50 text-danger-600' : 'text-danger-500'
                    }`}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Excluir
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div className="mt-4">
        <p className={`text-2xl font-bold ${
          Number(account.currentBalance) >= 0 ? 'text-gray-900' : 'text-danger-600'
        }`}>
          {formatCurrency(Number(account.currentBalance))}
        </p>
        {account.institution && (
          <p className="mt-1 text-sm text-gray-500">{account.institution}</p>
        )}
      </div>

      {isArchived && (
        <div className="mt-3">
          <span className="badge bg-gray-100 text-gray-600">Arquivada</span>
        </div>
      )}
    </div>
  );
}
