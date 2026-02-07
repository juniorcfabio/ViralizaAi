// COMPONENTE DE MIGRAÇÃO AUTOMÁTICA SUPABASE
import React, { useEffect, useState } from 'react';
import { useAutoMigration } from '../hooks/useSupabaseStorage';

interface SupabaseMigrationProps {
  children: React.ReactNode;
}

export const SupabaseMigration: React.FC<SupabaseMigrationProps> = ({ children }) => {
  const { migrationStatus } = useAutoMigration();
  const [showStatus, setShowStatus] = useState(true);

  // Auto-hide status após 5 segundos se completado
  useEffect(() => {
    if (migrationStatus === 'completed') {
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [migrationStatus]);

  const getStatusMessage = () => {
    switch (migrationStatus) {
      case 'migrating':
        return {
          message: '🔄 Migrando dados para Supabase...',
          color: 'bg-blue-500',
          textColor: 'text-white'
        };
      case 'completed':
        return {
          message: '✅ Dados migrados com sucesso! Sistema 100% seguro.',
          color: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'error':
        return {
          message: '❌ Erro na migração. Tentando novamente...',
          color: 'bg-red-500',
          textColor: 'text-white'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <>
      {/* Status da Migração */}
      {showStatus && statusInfo && (
        <div className={`fixed top-4 right-4 z-50 ${statusInfo.color} ${statusInfo.textColor} px-4 py-2 rounded-lg shadow-lg transition-all duration-300`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{statusInfo.message}</span>
            {migrationStatus === 'migrating' && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            {migrationStatus === 'completed' && (
              <button
                onClick={() => setShowStatus(false)}
                className="ml-2 text-white hover:text-gray-200 transition-colors"
                title="Fechar"
              >
                ×
              </button>
            )}
          </div>
          
          {migrationStatus === 'completed' && (
            <div className="text-xs mt-1 opacity-90">
              Sincronização automática ativa a cada 30s
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da aplicação */}
      {children}
    </>
  );
};

export default SupabaseMigration;
