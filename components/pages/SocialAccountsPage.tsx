import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SocialAccount } from '../../types';
import PaywallModal from '../ui/PaywallModal';

const AddProfileModal: React.FC<{
  onClose: () => void;
  onAdd: (platform: string, username: string) => void;
}> = ({ onClose, onAdd }) => {
  const [platform, setPlatform] = useState('Instagram');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const cleanedUsername = username.startsWith('@') ? username.substring(1) : username;
    onAdd(platform, cleanedUsername);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Adicionar Perfil de Marca</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-dark mb-1">Plataforma</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option>Instagram</option>
              <option>Facebook</option>
              <option>TikTok</option>
              <option>X</option>
              <option>YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-dark mb-1">Nome de Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@seunome"
              required
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500 transition-colors"
          >
            Adicionar Perfil
          </button>
        </form>
      </div>
    </div>
  );
};

const SocialAccountsPage: React.FC = () => {
  const { user, updateUser, isSubscriptionActive } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  if (!user) return null;

  const accounts = user.socialAccounts || [];
  const isActive = isSubscriptionActive();

  const checkAccess = () => {
    if (isActive) return true;
    setShowPaywall(true);
    return false;
  };

  const handleAddAccount = (platform: string, username: string) => {
    if (!user) return;
    const newAccount: SocialAccount = {
      id: Date.now(),
      platform,
      username
    };
    const updatedAccounts = [...accounts, newAccount];
    updateUser(user.id, { socialAccounts: updatedAccounts });
  };

  const handleRemove = (accountId: number) => {
    if (!checkAccess()) return;
    if (user) {
      const updatedAccounts = accounts.filter((acc) => acc.id !== accountId);
      updateUser(user.id, { socialAccounts: updatedAccounts });
    }
  };

  return (
    <>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <header className="flex justify-between items-center mb-8 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold">Perfis de Marca</h2>
          <p className="text-gray-dark">
            Informe à IA quais são seus perfis para gerar estratégias personalizadas.
          </p>
        </div>
        <button
          onClick={() => checkAccess() && setIsModalOpen(true)}
          className={`bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors ${
            !isActive ? 'opacity-70' : ''
          }`}
        >
          Adicionar Perfil
        </button>
      </header>

      <div className="bg-primary/50 border border-accent/30 p-4 rounded-lg mb-8">
        <h4 className="font-bold text-light">Por que adicionar meus perfis?</h4>
        <p className="text-sm text-gray-dark mt-1">
          Ao informar seus perfis, você fornece à nossa IA o contexto necessário para analisar seu
          nicho e criar campanhas de crescimento e funis de venda muito mais eficazes e alinhados
          com sua marca. Não armazenamos senhas nem postamos em seu nome.
        </p>
      </div>

      <div className="bg-secondary p-6 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-primary">
                <th className="p-4">Plataforma</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-8 text-gray-dark">
                    Nenhum perfil de marca adicionado.
                  </td>
                </tr>
              )}
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-primary hover:bg-primary">
                  <td className="p-4 font-bold">{acc.platform}</td>
                  <td className="p-4 text-accent">@{acc.username}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleRemove(acc.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddProfileModal onClose={() => setIsModalOpen(false)} onAdd={handleAddAccount} />
      )}
    </>
  );
};

export default SocialAccountsPage;