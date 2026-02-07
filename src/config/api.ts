// Configuração da API para diferentes ambientes

export const getApiBaseUrl = (): string => {
  // Sistema totalmente local - não depende de backend externo
  // Todas as funcionalidades são processadas no frontend
  return 'https://viralizaai.vercel.app/api';
};

export const API_BASE_URL = getApiBaseUrl();

// DEPRECATED: Auth tokens now managed by Supabase Auth
export const AUTH_TOKEN_STORAGE_KEY = 'viraliza_ai_auth_token_v1';

export const getAuthToken = (): string | null => {
  console.warn('⚠️ DEPRECATED: Use Supabase session instead');
  return null;
};

export const setAuthToken = (token: string) => {
  console.warn('⚠️ DEPRECATED: Use Supabase session instead');
};

export const clearAuthToken = () => {
  console.warn('⚠️ DEPRECATED: Use Supabase session instead');
};

export const getAuthHeaders = (): Record<string, string> => {
  console.warn('⚠️ DEPRECATED: Use Supabase session instead');
  return {};
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
