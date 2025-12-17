// Configuração da API para diferentes ambientes

export const getApiBaseUrl = (): string => {
  // Em produção, usar variável de ambiente do Vercel
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback para produção (URL real do Railway)
  return 'https://viralizaai-backend-production.up.railway.app';
};

export const API_BASE_URL = getApiBaseUrl();

export const AUTH_TOKEN_STORAGE_KEY = 'viraliza_ai_auth_token_v1';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Configuração para requisições
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('🔗 API Base URL:', API_BASE_URL);
