import { PlusIcon } from '@heroicons/react/24/outline';

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
          <p className="text-sm text-gray-500">Defina e acompanhe suas metas financeiras</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Nova meta
        </button>
      </div>

      <div className="card">
        <p className="text-center text-gray-500 py-12">
          Pagina de metas em desenvolvimento...
        </p>
      </div>
    </div>
  );
}
