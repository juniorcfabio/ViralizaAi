// Sistema de tratamento de erros robusto para APIs e recursos
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ timestamp: Date; error: string; context: string }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  logError(error: any, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.errorLog.push({
      timestamp: new Date(),
      error: errorMessage,
      context
    });

    // Manter apenas os últimos 100 erros
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    console.error(`[${context}] ${errorMessage}`, error);
  }

  async handleApiCall<T>(
    apiCall: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | null> {
    try {
      return await apiCall();
    } catch (error) {
      this.logError(error, context);
      
      if (fallback !== undefined) {
        console.log(`Using fallback for ${context}:`, fallback);
        return fallback;
      }
      
      return null;
    }
  }

  getRecentErrors(limit: number = 10): Array<{ timestamp: Date; error: string; context: string }> {
    return this.errorLog.slice(-limit);
  }

  clearErrors(): void {
    this.errorLog = [];
  }
}

export default ErrorHandler;
