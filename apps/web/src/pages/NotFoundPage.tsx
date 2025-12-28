import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Pagina nao encontrada</h2>
        <p className="mt-2 text-gray-600">
          A pagina que voce esta procurando nao existe ou foi movida.
        </p>
        <Link to="/dashboard" className="btn-primary mt-8 inline-flex">
          Voltar para o Dashboard
        </Link>
      </div>
    </div>
  );
}
