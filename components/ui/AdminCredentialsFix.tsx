import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

const AdminCredentialsFix: React.FC = () => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addUser, deleteUsers, platformUsers } = useAuth();

    const fixAdminCredentials = async () => {
        setIsLoading(true);
        setMessage('🔄 Corrigindo credenciais do administrador...');

        try {
            // 1. Remover todos os admins existentes
            const existingAdmins = platformUsers.filter(u => u.type === 'admin');
            if (existingAdmins.length > 0) {
                const adminIds = existingAdmins.map(u => u.id);
                await deleteUsers(adminIds);
                console.log('✅ Admins existentes removidos:', adminIds);
            }

            // 2. Criar novo admin com credenciais corretas
            const newAdmin = {
                id: `admin_${Date.now()}`,
                name: 'Administrador',
                email: 'admin@viralizaai.com',
                cpf: '01484270657',
                type: 'admin' as const,
                status: 'Ativo' as const,
                joinedDate: new Date().toISOString().split('T')[0],
                socialAccounts: [],
                paymentMethods: [],
                billingHistory: [],
                password: '123456'
            };

            await addUser(newAdmin);

            setMessage(`✅ Credenciais do administrador corrigidas!

📧 Email: admin@viralizaai.com
🆔 CPF: 01484270657  
🔑 Senha: 123456

✅ Agora você pode fazer login com essas credenciais.`);

            console.log('✅ Novo admin criado:', newAdmin);

        } catch (error) {
            console.error('❌ Erro ao corrigir credenciais:', error);
            setMessage('❌ Erro ao corrigir credenciais. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const clearAllData = async () => {
        if (!window.confirm('⚠️ ATENÇÃO: Isso vai limpar TODOS os dados locais. Tem certeza?')) {
            return;
        }

        setIsLoading(true);
        setMessage('🔄 Limpando todos os dados...');

        try {
            // Limpar localStorage
            localStorage.clear();
            
            // Limpar sessionStorage
            sessionStorage.clear();

            // Recarregar a página para reinicializar tudo
            window.location.reload();

        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            setMessage('❌ Erro ao limpar dados. Tente novamente.');
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-red-900 bg-opacity-20 border border-red-600 p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4 text-center text-red-400">🔧 Correção de Credenciais Admin</h3>
            
            <div className="space-y-4">
                <div className="bg-yellow-900 bg-opacity-50 p-3 rounded text-sm text-yellow-200">
                    <strong>Problema:</strong> Não consegue fazer login como admin?<br/>
                    <strong>Solução:</strong> Use este botão para recriar o admin com as credenciais corretas.
                </div>

                <button
                    onClick={fixAdminCredentials}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? '🔄 Corrigindo...' : '🔧 Corrigir Credenciais Admin'}
                </button>

                <button
                    onClick={clearAllData}
                    disabled={isLoading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                >
                    🗑️ Limpar Todos os Dados (Emergência)
                </button>

                {message && (
                    <div className={`p-3 rounded text-sm whitespace-pre-line ${
                        message.includes('✅') ? 'bg-green-900 text-green-100' : 
                        message.includes('❌') ? 'bg-red-900 text-red-100' : 
                        'bg-blue-900 text-blue-100'
                    }`}>
                        {message}
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded text-sm text-blue-200">
                <strong>📋 Credenciais Corretas:</strong><br/>
                Email: admin@viralizaai.com<br/>
                CPF: 01484270657<br/>
                Senha: 123456
            </div>
        </div>
    );
};

export default AdminCredentialsFix;
