import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import {
  HomeIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  ChartPieIcon,
  ChartBarIcon,
  FlagIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Contas', href: '/accounts', icon: CreditCardIcon },
  { name: 'Transacoes', href: '/transactions', icon: ArrowsRightLeftIcon },
  { name: 'Orcamentos', href: '/budgets', icon: ChartPieIcon },
  { name: 'Investimentos', href: '/investments', icon: ChartBarIcon },
  { name: 'Metas', href: '/goals', icon: FlagIcon },
  { name: 'Relatorios', href: '/analytics', icon: ChartBarIcon },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Dinheiro" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-green-600">Dinheiro</span>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <Cog6ToothIcon className="h-5 w-5" />
              Configuracoes
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4">
            {/* Add transaction button */}
            <button type="button" className="btn-primary hidden sm:flex">
              <PlusIcon className="h-5 w-5" />
              <span>Nova transacao</span>
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-lg p-2 hover:bg-gray-100"
              aria-label="Notificacoes"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-xs text-white">
                3
              </span>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Mobile FAB */}
        <button
          type="button"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 sm:hidden"
          aria-label="Nova transacao"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
