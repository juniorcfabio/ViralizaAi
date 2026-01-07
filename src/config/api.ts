// Configuração da API para diferentes ambientes

export const getApiBaseUrl = (): string => {
  // Sistema totalmente local - não depende de backend externo
  // Todas as funcionalidades são processadas no frontend
  return 'https://viralizaai.vercel.app/api';
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
console.log('🔧 Environment Variables Check:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD
});
