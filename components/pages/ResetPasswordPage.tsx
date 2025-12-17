import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../src/config/api';

type SubmitState = 'idle' | 'submitting' | 'success';

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const token = useMemo(() => {
    const paramsFromHash = new URLSearchParams(location.search);
    const tokenFromHash = paramsFromHash.get('token');
    if (tokenFromHash) return tokenFromHash;

    // Se o usuário chegou via /reset-password?token=...#/reset-password,
    // o token fica em window.location.search (antes do #)
    const paramsFromPath = new URLSearchParams(window.location.search);
    return paramsFromPath.get('token') || '';
  }, [location.search]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token inválido. Solicite um novo link de redefinição.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setState('submitting');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `Erro ao redefinir senha: ${res.status}`;
        setError(String(msg));
        setState('idle');
        return;
      }

      setState('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao redefinir senha. Tente novamente.');
      setState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-secondary rounded-lg shadow-xl p-6 border border-gray-700">
        <h1 className="text-2xl font-bold mb-2 text-center">Redefinir Senha</h1>
        <p className="text-sm text-gray-dark mb-6 text-center">
          Defina uma nova senha para sua conta.
        </p>

        {state === 'success' ? (
          <div className="space-y-4">
            <p className="text-green-500 text-sm text-center">Senha redefinida com sucesso.</p>
            <Link
              to="/"
              className="block w-full text-center bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 transition-colors"
            >
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={state === 'submitting'}
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={state === 'submitting'}
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={state === 'submitting'}
            >
              {state === 'submitting' ? 'Enviando...' : 'Redefinir Senha'}
            </button>

            <Link to="/" className="block text-center text-gray-dark hover:text-light text-sm">
              Cancelar
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
