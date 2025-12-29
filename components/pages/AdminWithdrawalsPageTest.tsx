import React from 'react';

const AdminWithdrawalsPageTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🛡️ Gerenciar Saques - TESTE
          </h1>
          <p className="text-blue-200">
            Página de teste para verificar se o roteamento está funcionando
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Status do Sistema</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span className="text-white">Página carregada com sucesso</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span className="text-white">Roteamento funcionando</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span className="text-white">Estilos aplicados corretamente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalsPageTest;
