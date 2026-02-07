// 🔒 PÁGINA ADMIN PROFISSIONAL - ACESSO RESTRITO
import React, { useState, useEffect } from 'react';
import AdminPanelProfessional from '../components/admin/AdminPanelProfessional';

const AdminPanelPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔐 VERIFICAR SE JÁ ESTÁ AUTENTICADO
  useEffect(() => {
    const savedKey = localStorage.getItem('admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
      verifyAdminAccess(savedKey);
    }
  }, []);

  const verifyAdminAccess = async (key: string) => {
    setLoading(true);
    setError('');

    try {
      // 🔍 TESTAR ACESSO COM UMA API ADMIN
      const response = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': key }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_key', key);
      } else {
        setError('Chave de administrador inválida');
        setIsAuthenticated(false);
        localStorage.removeItem('admin_key');
      }
    } catch (error) {
      setError('Erro ao verificar acesso admin');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      verifyAdminAccess(adminKey.trim());
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey('');
    localStorage.removeItem('admin_key');
  };

  // 🔐 TELA DE LOGIN ADMIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Acesso Administrativo
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Área restrita - Somente administradores
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="admin-key" className="sr-only">
                Chave de Administrador
              </label>
              <input
                id="admin-key"
                name="admin-key"
                type="password"
                required
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Digite a chave de administrador"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm">❌ {error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    🔐 Acessar Painel Admin
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ⚠️ Acesso monitorado e registrado
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🖥️ PAINEL ADMIN AUTENTICADO
  return (
    <div>
      {/* BARRA DE LOGOUT */}
      <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-sm">🔒 Modo Administrador Ativo</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-700 hover:bg-red-800 px-3 py-1 rounded"
        >
          🚪 Sair
        </button>
      </div>

      {/* PAINEL PRINCIPAL */}
      <AdminPanelProfessional />
    </div>
  );
};

export default AdminPanelPage;
