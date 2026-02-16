
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { User, UserStatus } from '../../types';
import UserFormModal from '../ui/UserFormModal';
import UserAccountReset from '../ui/UserAccountReset';

const USERS_PER_PAGE = 7;

interface ApiUser {
    id: string;
    name: string;
    email: string;
    plan: string | null;
    status: string;
    created_at: string;
    last_sign_in: string | null;
    is_affiliate: boolean;
    affiliate_code: string | null;
}

type SortKey = 'name' | 'email' | 'plan' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const AdminUsersPage: React.FC = () => {
    const { deleteUsers, updateUser } = useAuth();
    
    // State for real users from API
    const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    
    // State for CRUD and UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [notification, setNotification] = useState('');
    
    // State for interactivity
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });

    // Buscar usuários reais do Supabase via API
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                if (data.success && data.users) {
                    setApiUsers(data.users);
                    console.log(`✅ ${data.users.length} usuários carregados do Supabase`);
                }
            } catch (e) {
                console.error('❌ Erro ao buscar usuários:', e);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = () => {
        showNotification(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário adicionado com sucesso!');
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Tem certeza que deseja excluir ${selectedUserIds.length} usuário(s)?`)) {
            deleteUsers(selectedUserIds);
            setSelectedUserIds([]);
            showNotification(`${selectedUserIds.length} usuário(s) excluído(s).`);
        }
    };

    const filteredUsers = useMemo(() => {
        return apiUsers
            .filter(u =>
                (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
                (statusFilter === '' || u.status === statusFilter)
            );
    }, [apiUsers, searchTerm, statusFilter]);

    const sortedUsers = useMemo(() => {
        const sortableItems = [...filteredUsers];
        sortableItems.sort((a, b) => {
            const aValue = (a as any)[sortConfig.key] || '';
            const bValue = (b as any)[sortConfig.key] || '';
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredUsers, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return sortedUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [sortedUsers, currentPage]);

    const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);

    const handleSelectUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(paginatedUsers.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };
    
    const getStatusChip = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-green-500 bg-opacity-20 text-green-300';
            case 'Inativo': return 'bg-red-500 bg-opacity-20 text-red-300';
            case 'Pendente': return 'bg-yellow-500 bg-opacity-20 text-yellow-300';
            default: return 'bg-gray-500 bg-opacity-20 text-gray-300';
        }
    };

    return (
        <>
            <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Gerenciamento de Usuários</h2>
                    <p className="text-gray-dark">Adicione, edite ou remova usuários da plataforma.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors"
                >
                    + Adicionar Usuário
                </button>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}

            {/* Ferramenta de Reset de Conta */}
            <div className="mb-6">
                <UserAccountReset />
            </div>

            <div className="bg-secondary p-6 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent flex-1 min-w-[200px]"
                        />
                         <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
                            className="bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            <option value="">Todos Status</option>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                            <option value="Pendente">Pendente</option>
                        </select>
                    </div>
                    {selectedUserIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-full transition-colors w-full md:w-auto"
                        >
                            Excluir Selecionados ({selectedUserIds.length})
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-dark uppercase bg-primary">
                            <tr>
                                <th className="p-3 w-4">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedUserIds.length > 0 && selectedUserIds.length === paginatedUsers.length} className="w-4 h-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent"/>
                                </th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>Nome</th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('email')}>Email</th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('plan')}>Plano</th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}>Status</th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('created_at')}>Data de Cadastro</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingUsers ? (
                                <tr><td colSpan={7} className="p-6 text-center text-gray-400">Carregando usuários do Supabase...</td></tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr><td colSpan={7} className="p-6 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
                            ) : paginatedUsers.map(user => (
                                <tr key={user.id} className="border-t border-primary hover:bg-primary/50">
                                    <td className="p-3">
                                        <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => handleSelectUser(user.id)} className="w-4 h-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent"/>
                                    </td>
                                    <td className="p-3 font-medium">
                                        {user.name}
                                        {user.is_affiliate && <span className="ml-1 text-xs text-green-400">🤝</span>}
                                    </td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">{user.plan || <span className="text-gray-500">Sem plano</span>}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusChip(user.status)}`}>{user.status}</span>
                                    </td>
                                    <td className="p-3">{user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                                    updateUser(user.id, { status: newStatus });
                                                    setApiUsers(prev => prev.map(u => u.id === user.id ? {...u, status: newStatus} : u));
                                                    showNotification(`Usuário ${newStatus === 'Ativo' ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
                                                }}
                                                className={`text-sm px-2 py-1 rounded ${user.status === 'Ativo' ? 'text-red-400 hover:bg-red-500 hover:bg-opacity-20' : 'text-green-400 hover:bg-green-500 hover:bg-opacity-20'}`}
                                            >
                                                {user.status === 'Ativo' ? 'Bloquear' : 'Desbloquear'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                     <span className="text-sm text-gray-dark">
                        Mostrando {paginatedUsers.length} de {sortedUsers.length} usuários
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-primary p-2 rounded disabled:opacity-50">&lt;</button>
                        <span className="text-sm">Página {currentPage} de {totalPages}</span>
                         <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="bg-primary p-2 rounded disabled:opacity-50">&gt;</button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <UserFormModal
                    user={editingUser}
                    onClose={handleCloseModal}
                    onSave={handleSaveUser}
                />
            )}
        </>
    );
};

export default AdminUsersPage;
