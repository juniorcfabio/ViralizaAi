// services/appModeService.ts

export const REAL_MODE_KEY = 'viraliza_ai_real_mode';

/**
 * Retorna true se o modo real estiver ativado no painel admin.
 * Hoje isso é controlado apenas via localStorage.
 */
export const isRealModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(REAL_MODE_KEY) === 'on';
};

/**
 * Liga ou desliga o modo real e persiste no localStorage.
 */
export const setRealMode = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REAL_MODE_KEY, enabled ? 'on' : 'off');
};