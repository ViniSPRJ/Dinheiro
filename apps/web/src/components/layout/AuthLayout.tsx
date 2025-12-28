import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-primary-600 lg:px-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Dinheiro" className="h-16 w-16 object-contain rounded-lg bg-white/10 p-1" />
            <div>
              <h1 className="text-4xl font-bold text-white">Dinheiro</h1>
              <p className="text-xl text-primary-100">Controle de Gastos</p>
            </div>
          </div>
          <p className="text-lg text-primary-100">Seu copiloto financeiro brasileiro</p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Categorizacao automatica com IA</h3>
                <p className="text-sm text-primary-200">Suas transacoes sao categorizadas automaticamente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Orcamentos inteligentes</h3>
                <p className="text-sm text-primary-200">Sugestoes baseadas no seu historico</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Controle de investimentos</h3>
                <p className="text-sm text-primary-200">Acompanhe acoes, FIIs, crypto e mais</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - auth form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Dinheiro" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-green-600">Dinheiro</h1>
                <p className="text-sm text-gray-500">Controle de Gastos</p>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
