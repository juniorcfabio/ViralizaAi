import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserAccountReset: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addUser, deleteUsers, platformUsers } = useAuth();

    const resetUserAccount = async () => {
        if (!email.trim()) {
            setMessage('❌ Por favor, informe o e-mail');
            return;
        }

        setIsLoading(true);
        setMessage('🔄 Resetando conta...');

        try {
            // 1. Remover usuário existente se houver
            const existingUser = platformUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                await deleteUsers([existingUser.id]);
                console.log('✅ Usuário existente removido:', existingUser.email);
            }

            // 2. Criar nova conta limpa
            const newUser = {
                id: `user_${Date.now()}`,
                name: email.includes('juniorviralizaai') ? 'Junior Viralizaai' : 'Usuário',
                email: email.toLowerCase().trim(),
                cpf: '12345678910',
                type: 'client' as const,
                status: 'Ativo' as const,
                joinedDate: new Date().toISOString().split('T')[0],
                socialAccounts: [],
                paymentMethods: [],
                billingHistory: [],
                plan: 'Plano Mensal',
                trialStartDate: new Date().toISOString(),
                trialFollowers: 0,
                trialSales: 0,
                password: '123456' // Senha temporária
            };

            await addUser(newUser);

            setMessage(`✅ Conta resetada com sucesso!
            
📧 Email: ${email}
🔑 Senha temporária: 123456
            
⚠️ IMPORTANTE: Faça login com a senha temporária e altere imediatamente no perfil.`);

            console.log('✅ Nova conta criada:', newUser);

        } catch (error) {
            console.error('❌ Erro ao resetar conta:', error);
            setMessage('❌ Erro ao resetar conta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-secondary p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4 text-center text-accent">🔧 Reset de Conta</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">E-mail da conta:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juniorviralizaai@gmail.com"
                        className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={isLoading}
                    />
                </div>

                <button
                    onClick={resetUserAccount}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? '🔄 Resetando...' : '🔧 Resetar Conta Completamente'}
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

            <div className="mt-6 p-3 bg-yellow-900 text-yellow-100 rounded text-sm">
                <strong>⚠️ Atenção:</strong> Esta ferramenta remove completamente a conta existente e cria uma nova com senha temporária "123456". Use apenas se não conseguir fazer login de forma alguma.
            </div>
        </div>
    );
};

export default UserAccountReset;
