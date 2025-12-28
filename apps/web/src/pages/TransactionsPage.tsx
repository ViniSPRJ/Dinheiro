import { useState, useMemo } from 'react';
import { useTransactions, useDeleteTransaction, Transaction } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionModal from '../components/features/TransactionModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import clsx from 'clsx';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateGroup(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  if (isThisWeek(date, { locale: ptBR })) return format(date, 'EEEE', { locale: ptBR });
  if (isThisMonth(date)) return format(date, "d 'de' MMMM", { locale: ptBR });
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
  });

  return groups;
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useTransactions({
    search: search || undefined,
    type: typeFilter as 'EXPENSE' | 'INCOME' | 'TRANSFER' | undefined,
    categoryId: categoryFilter || undefined,
    accountId: accountFilter || undefined,
    limit: 50,
    page,
  });

  const { data: accountsData } = useAccounts();
  const { data: categories } = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const groupedTransactions = useMemo(() => {
    if (!data?.transactions) return {};
    return groupTransactionsByDate(data.transactions);
  }, [data?.transactions]);

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmTransaction) {
      await deleteTransaction.mutateAsync(deleteConfirmTransaction.id);
      setDeleteConfirmTransaction(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setAccountFilter('');
    setPage(1);
  };

  const hasActiveFilters = search || typeFilter || categoryFilter || accountFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transacoes</h1>
          <p className="text-sm text-gray-500">
            {data?.pagination.total || 0} transacoes
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Nova transacao
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transacoes..."
              className="input pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input w-40"
            value={typeFilter}
            aria-label="Filtrar por tipo"
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os tipos</option>
            <option value="EXPENSE">Despesas</option>
            <option value="INCOME">Receitas</option>
            <option value="TRANSFER">Transferencias</option>
          </select>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'btn-secondary',
              showFilters && 'bg-primary-50 text-primary-600'
            )}
          >
            <FunnelIcon className="h-5 w-5" />
            Mais filtros
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                !
              </span>
            )}
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-lg bg-gray-50 p-4">
            <div className="min-w-[200px]">
              <label className="label">Conta</label>
              <select
                className="input"
                value={accountFilter}
                aria-label="Filtrar por conta"
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas as contas</option>
                {accountsData?.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="label">Categoria</label>
              <select
                className="input"
                value={categoryFilter}
                aria-label="Filtrar por categoria"
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas as categorias</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-end btn-ghost text-danger-600"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transactions list */}
      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/4 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="py-12 text-center">
            <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma transacao encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters
                ? 'Tente ajustar os filtros'
                : 'Adicione sua primeira transacao'}
            </p>
            {!hasActiveFilters && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5" />
                Adicionar transacao
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(groupedTransactions).map(([dateKey, transactions]) => (
              <div key={dateKey} className="py-4 first:pt-0 last:pb-0">
                <h3 className="mb-3 text-sm font-medium text-gray-500 capitalize">
                  {formatDateGroup(dateKey)}
                </h3>
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onEdit={() => handleEdit(tx)}
                      onDelete={() => setDeleteConfirmTransaction(tx)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={data.pagination.page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Pagina {data.pagination.page} de {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            disabled={data.pagination.page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Proxima
          </button>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={selectedTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmTransaction}
        onClose={() => setDeleteConfirmTransaction(null)}
        onConfirm={handleDelete}
        title="Excluir transacao"
        message={`Tem certeza que deseja excluir "${deleteConfirmTransaction?.description}"?`}
        confirmText="Excluir"
        isLoading={deleteTransaction.isPending}
      />
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}

function TransactionItem({ transaction: tx, onEdit, onDelete }: TransactionItemProps) {
  const TypeIcon =
    tx.type === 'INCOME'
      ? ArrowUpIcon
      : tx.type === 'EXPENSE'
      ? ArrowDownIcon
      : ArrowsRightLeftIcon;

  return (
    <div className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: tx.category?.color || '#6366f1' }}
        >
          {tx.category?.icon ? (
            <span className="text-sm">{tx.category.icon}</span>
          ) : (
            <TypeIcon className="h-5 w-5 text-white" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{tx.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{tx.category?.name || 'Sem categoria'}</span>
            <span>-</span>
            <span>{tx.account?.name || 'Sem conta'}</span>
            {tx.mlCategorized && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary-50 px-1.5 py-0.5 text-xs font-medium text-primary-600">
                IA
              </span>
            )}
            {tx.status === 'PENDING' && (
              <span className="badge-warning">Pendente</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'text-lg font-semibold',
            tx.type === 'INCOME' && 'text-success-600',
            tx.type === 'EXPENSE' && 'text-danger-600',
            tx.type === 'TRANSFER' && 'text-gray-600'
          )}
        >
          {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
          {formatCurrency(Number(tx.amount))}
        </span>

        <Menu as="div" className="relative opacity-0 transition-opacity group-hover:opacity-100">
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onEdit}
                    className={clsx(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm',
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    )}
                  >
                    <PencilIcon className="h-4 w-4" />
                    Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onDelete}
                    className={clsx(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm',
                      active ? 'bg-danger-50 text-danger-600' : 'text-danger-500'
                    )}
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
    </div>
  );
}
