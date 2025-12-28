import { useAuthStore } from '../stores/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="text-sm text-gray-500">Gerencie sua conta e preferencias</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Nome</label>
            <input type="text" className="input" defaultValue={user?.name || ''} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" defaultValue={user?.email || ''} disabled />
          </div>
        </div>
        <button className="btn-primary mt-6">Salvar alteracoes</button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Preferencias</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Moeda</label>
            <select className="input">
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dolar Americano ($)</option>
            </select>
          </div>
          <div>
            <label className="label">Tema</label>
            <select className="input">
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="auto">Automatico</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card border-danger-200 bg-danger-50">
        <h2 className="text-lg font-semibold text-danger-700">Zona de Perigo</h2>
        <p className="mt-2 text-sm text-danger-600">
          Acoes irreversiveis relacionadas a sua conta
        </p>
        <button className="btn-danger mt-4">Excluir minha conta</button>
      </div>
    </div>
  );
}
