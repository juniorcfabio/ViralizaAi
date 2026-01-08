
import React, { useState, useEffect } from 'react';
import { User, UserStatus, FeatureKey } from '../../types';
import { useAuth, AdminUserData } from '../../contexts/AuthContextFixed';

interface UserFormModalProps {
    user: User | null;
    onClose: () => void;
    onSave: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
    const { addUser, updateUser, platformUsers } = useAuth();
    
    const [formData, setFormData] = useState<AdminUserData & { addOns: FeatureKey[] }>({
        name: '',
        email: '',
        password: '',
        plan: 'Mensal',
        status: 'Ativo',
        type: 'client',
        addOns: [],
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Password is not edited here for security
                plan: user.plan || 'Mensal',
                status: user.status,
                type: 'client',
                addOns: user.addOns || []
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddOnChange = (feature: FeatureKey) => {
        const currentAddOns = formData.addOns || [];
        if (currentAddOns.includes(feature)) {
            setFormData({ ...formData, addOns: currentAddOns.filter(f => f !== feature) });
        } else {
            setFormData({ ...formData, addOns: [...currentAddOns, feature] });
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validação de formato de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Por favor, insira um endereço de e-mail válido.');
            return;
        }

        // Verifica se o e-mail já existe (ignorando o usuário atual em caso de edição)
        const emailExists = platformUsers.some(
            u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== user?.id
        );

        if (emailExists) {
            setError('Este e-mail já está associado a outro usuário.');
            return;
        }

        if (user) {
            // Editing existing user
            updateUser(user.id, {
                name: formData.name,
                email: formData.email,
                plan: formData.plan,
                status: formData.status,
                addOns: formData.addOns,
                // Do not update password if field is empty
                ...(formData.password && { password: formData.password })
            });
        } else {
            // Adding new user
            if (!formData.password) {
                setError('A senha é obrigatória para novos usuários.');
                return;
            }
            addUser(formData);
        }
        
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">{user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-dark mb-1">E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-dark mb-1">Senha</label>
                        <div className="flex gap-2">
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? 'Deixe em branco para não alterar' : ''} className="flex-1 bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                            {user && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newPassword = Math.random().toString(36).slice(-8);
                                        setFormData({ ...formData, password: newPassword });
                                        alert(`Nova senha gerada: ${newPassword}\nCopie esta senha e forneça ao usuário.`);
                                    }}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                    title="Gerar nova senha aleatória"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Plano</label>
                            <select name="plan" value={formData.plan} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                                <option>Mensal</option>
                                <option>Trimestral</option>
                                <option>Semestral</option>
                                <option>Anual</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm text-gray-dark mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                                <option>Ativo</option>
                                <option>Inativo</option>
                                <option>Pendente</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4 mt-2">
                        <label className="block text-sm text-gray-dark mb-2">Funcionalidades Extras (Add-ons)</label>
                        <div className="flex items-center gap-2 bg-primary p-3 rounded border border-gray-600">
                             <input 
                                type="checkbox" 
                                checked={formData.addOns.includes('viralPrediction')} 
                                onChange={() => handleAddOnChange('viralPrediction')}
                                className="w-4 h-4 text-accent bg-secondary border-gray-500 rounded focus:ring-accent"
                            />
                            <span className="text-sm">Motor de Previsão Viral</span>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500 transition-colors">
                        Salvar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
