import { PlusIcon } from '@heroicons/react/24/outline';

export default function InvestmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
          <p className="text-sm text-gray-500">Acompanhe sua carteira de investimentos</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Novo investimento
        </button>
      </div>

      <div className="card">
        <p className="text-center text-gray-500 py-12">
          Pagina de investimentos em desenvolvimento...
        </p>
      </div>
    </div>
  );
}
