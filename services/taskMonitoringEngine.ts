import { GeolocationService } from './geolocationService';

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  category: 'marketing' | 'content' | 'analytics' | 'engagement' | 'monetization' | 'growth';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number; // em minutos
  businessImpact: number; // 1-10 (impacto no negócio)
  completed: boolean;
  completedAt?: Date;
  dueTime: string; // formato HH:MM
  streak: number; // dias consecutivos completados
  aiRecommendation?: string;
  performanceBoost: number; // % de boost na performance
}

export interface BusinessMetrics {
  overallPerformance: number; // 0-100%
  completionRate: number; // % de tarefas completadas
  streakDays: number;
  productivityScore: number;
  revenueImpact: number; // impacto estimado na receita
  growthMomentum: number; // momentum de crescimento
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  nextMilestone: string;
}

export interface TaskAlert {
  id: string;
  taskId: string;
  type: 'overdue' | 'urgent' | 'critical' | 'streak_break';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  action: string;
  timeRemaining?: number;
  businessRisk: string;
}

class TaskMonitoringEngine {
  private tasks: Map<string, DailyTask> = new Map();
  private userStreak: number = 0;
  private lastActiveDate: string = '';
  private geolocationService: GeolocationService;
  private performanceHistory: number[] = [];
  private aiInsights: string[] = [];

  constructor() {
    this.geolocationService = new GeolocationService();
    this.initializeDefaultTasks();
    this.loadUserProgress();
    this.startRealTimeMonitoring();
  }

  private initializeDefaultTasks(): void {
    const defaultTasks: DailyTask[] = [
      {
        id: 'morning_analytics',
        title: '📊 Análise Matinal de Performance',
        description: 'Revisar métricas do dia anterior e definir metas do dia',
        category: 'analytics',
        priority: 'critical',
        estimatedTime: 15,
        businessImpact: 9,
        completed: false,
        dueTime: '09:00',
        streak: 0,
        performanceBoost: 25,
        aiRecommendation: 'Essencial para identificar oportunidades e ajustar estratégias rapidamente'
      },
      {
        id: 'content_creation',
        title: '✍️ Criação de Conteúdo Viral',
        description: 'Criar pelo menos 3 posts otimizados para engajamento máximo',
        category: 'content',
        priority: 'critical',
        estimatedTime: 45,
        businessImpact: 10,
        completed: false,
        dueTime: '10:30',
        streak: 0,
        performanceBoost: 40,
        aiRecommendation: 'Conteúdo consistente é a base do crescimento orgânico exponencial'
      },
      {
        id: 'engagement_boost',
        title: '🚀 Turbinada de Engajamento',
        description: 'Interagir com 50+ comentários e responder todas as mensagens',
        category: 'engagement',
        priority: 'high',
        estimatedTime: 30,
        businessImpact: 8,
        completed: false,
        dueTime: '14:00',
        streak: 0,
        performanceBoost: 30,
        aiRecommendation: 'Engajamento ativo multiplica o alcance orgânico em até 300%'
      },
      {
        id: 'lead_generation',
        title: '🎯 Geração de Leads Qualificados',
        description: 'Capturar pelo menos 10 novos leads através das ferramentas ViralizaAi',
        category: 'marketing',
        priority: 'critical',
        estimatedTime: 60,
        businessImpact: 10,
        completed: false,
        dueTime: '16:00',
        streak: 0,
        performanceBoost: 50,
        aiRecommendation: 'Leads qualificados são o combustível do crescimento sustentável'
      },
      {
        id: 'conversion_optimization',
        title: '💰 Otimização de Conversões',
        description: 'Analisar e otimizar pelo menos 2 funis de vendas',
        category: 'monetization',
        priority: 'high',
        estimatedTime: 40,
        businessImpact: 9,
        completed: false,
        dueTime: '17:30',
        streak: 0,
        performanceBoost: 35,
        aiRecommendation: 'Pequenas otimizações podem aumentar receita em 200%+'
      },
      {
        id: 'growth_strategy',
        title: '📈 Estratégia de Crescimento',
        description: 'Implementar 1 nova estratégia de crescimento ou otimizar existente',
        category: 'growth',
        priority: 'medium',
        estimatedTime: 35,
        businessImpact: 8,
        completed: false,
        dueTime: '19:00',
        streak: 0,
        performanceBoost: 25,
        aiRecommendation: 'Inovação constante mantém você à frente da concorrência'
      },
      {
        id: 'evening_review',
        title: '🌙 Revisão Noturna e Planejamento',
        description: 'Revisar resultados do dia e planejar otimizações para amanhã',
        category: 'analytics',
        priority: 'high',
        estimatedTime: 20,
        businessImpact: 7,
        completed: false,
        dueTime: '21:00',
        streak: 0,
        performanceBoost: 20,
        aiRecommendation: 'Reflexão diária acelera o aprendizado e melhoria contínua'
      }
    ];

    defaultTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  private loadUserProgress(): void {
    try {
      const saved = localStorage.getItem('viraliza_task_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.userStreak = data.streak || 0;
        this.lastActiveDate = data.lastActiveDate || '';
        this.performanceHistory = data.performanceHistory || [];
        
        // Restaurar progresso das tarefas
        if (data.tasks) {
          Object.entries(data.tasks).forEach(([id, taskData]: [string, any]) => {
            const task = this.tasks.get(id);
            if (task) {
              task.completed = taskData.completed || false;
              task.completedAt = taskData.completedAt ? new Date(taskData.completedAt) : undefined;
              task.streak = taskData.streak || 0;
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  }

  private saveUserProgress(): void {
    try {
      const taskData: Record<string, any> = {};
      this.tasks.forEach((task, id) => {
        taskData[id] = {
          completed: task.completed,
          completedAt: task.completedAt,
          streak: task.streak
        };
      });

      const data = {
        streak: this.userStreak,
        lastActiveDate: this.lastActiveDate,
        performanceHistory: this.performanceHistory,
        tasks: taskData
      };

      localStorage.setItem('viraliza_task_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }

  private startRealTimeMonitoring(): void {
    // Verificar a cada minuto
    setInterval(() => {
      this.updateTaskStatus();
      this.generateAIInsights();
    }, 60000);

    // Reset diário à meia-noite
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.resetDailyTasks();
      }
    }, 60000);
  }

  private updateTaskStatus(): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    this.tasks.forEach(task => {
      if (!task.completed && currentTime > task.dueTime) {
        // Tarefa atrasada - gerar alerta
        this.generateTaskAlert(task, 'overdue');
      }
    });
  }

  private generateTaskAlert(task: DailyTask, type: TaskAlert['type']): TaskAlert {
    const alert: TaskAlert = {
      id: `alert_${task.id}_${Date.now()}`,
      taskId: task.id,
      type,
      severity: task.priority === 'critical' ? 'critical' : 'warning',
      message: this.getAlertMessage(task, type),
      action: this.getAlertAction(task, type),
      businessRisk: this.getBusinessRisk(task)
    };

    return alert;
  }

  private getAlertMessage(task: DailyTask, type: string): string {
    switch (type) {
      case 'overdue':
        return `⚠️ TAREFA CRÍTICA ATRASADA: ${task.title}`;
      case 'urgent':
        return `🔥 URGENTE: ${task.title} deve ser completada em breve`;
      case 'critical':
        return `🚨 CRÍTICO: ${task.title} impacta diretamente sua receita`;
      case 'streak_break':
        return `💔 SEQUÊNCIA EM RISCO: Complete ${task.title} para manter sua sequência`;
      default:
        return `📋 ${task.title} precisa de atenção`;
    }
  }

  private getAlertAction(task: DailyTask, type: string): string {
    switch (type) {
      case 'overdue':
        return 'Complete AGORA para evitar perda de performance';
      case 'urgent':
        return 'Priorize esta tarefa nos próximos 30 minutos';
      case 'critical':
        return 'AÇÃO IMEDIATA NECESSÁRIA - Impacto direto no faturamento';
      case 'streak_break':
        return 'Complete hoje para manter momentum de crescimento';
      default:
        return 'Clique para ver detalhes e completar';
    }
  }

  private getBusinessRisk(task: DailyTask): string {
    const impact = task.businessImpact;
    if (impact >= 9) return 'ALTO RISCO: Pode reduzir receita em até 30%';
    if (impact >= 7) return 'MÉDIO RISCO: Pode impactar crescimento em até 15%';
    if (impact >= 5) return 'BAIXO RISCO: Pode reduzir eficiência em até 10%';
    return 'RISCO MÍNIMO: Impacto limitado na performance';
  }

  private generateAIInsights(): void {
    const completionRate = this.getCompletionRate();
    const performance = this.calculateOverallPerformance();
    
    const insights = [
      `🤖 IA detectou: ${completionRate}% de conclusão hoje`,
      `📊 Performance atual: ${performance}% (${this.getPerformanceLevel(performance)})`,
      `🎯 Próxima tarefa crítica: ${this.getNextCriticalTask()?.title || 'Nenhuma pendente'}`,
      `🔥 Sequência atual: ${this.userStreak} dias`,
      `💡 Dica IA: ${this.getPersonalizedTip()}`
    ];

    this.aiInsights = insights;
  }

  private getPerformanceLevel(performance: number): string {
    if (performance >= 90) return 'EXCEPCIONAL 🚀';
    if (performance >= 80) return 'EXCELENTE ⭐';
    if (performance >= 70) return 'BOM 👍';
    if (performance >= 60) return 'REGULAR ⚠️';
    return 'CRÍTICO 🚨';
  }

  private getPersonalizedTip(): string {
    const tips = [
      'Tarefas matinais aumentam produtividade em 40%',
      'Engajamento consistente multiplica alcance por 3x',
      'Análise diária de métricas acelera crescimento em 200%',
      'Conteúdo viral criado pela manhã tem 60% mais engajamento',
      'Otimização de funis pode dobrar sua taxa de conversão'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  private resetDailyTasks(): void {
    const today = new Date().toDateString();
    
    // Verificar se manteve a sequência
    if (this.lastActiveDate && this.getCompletionRate() >= 80) {
      this.userStreak++;
    } else if (this.getCompletionRate() < 50) {
      this.userStreak = 0; // Reset da sequência se performance foi muito baixa
    }

    // Salvar performance do dia
    this.performanceHistory.push(this.calculateOverallPerformance());
    if (this.performanceHistory.length > 30) {
      this.performanceHistory.shift(); // Manter apenas últimos 30 dias
    }

    // Reset das tarefas
    this.tasks.forEach(task => {
      task.completed = false;
      task.completedAt = undefined;
    });

    this.lastActiveDate = today;
    this.saveUserProgress();
  }

  public completeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.completed = true;
    task.completedAt = new Date();
    task.streak++;

    this.saveUserProgress();
    return true;
  }

  public getTasks(): DailyTask[] {
    return Array.from(this.tasks.values());
  }

  public getCompletedTasks(): DailyTask[] {
    return this.getTasks().filter(task => task.completed);
  }

  public getPendingTasks(): DailyTask[] {
    return this.getTasks().filter(task => !task.completed);
  }

  public getCriticalTasks(): DailyTask[] {
    return this.getTasks().filter(task => !task.completed && task.priority === 'critical');
  }

  public getNextCriticalTask(): DailyTask | null {
    const criticalTasks = this.getCriticalTasks();
    if (criticalTasks.length === 0) return null;
    
    // Ordenar por horário
    return criticalTasks.sort((a, b) => a.dueTime.localeCompare(b.dueTime))[0];
  }

  public getCompletionRate(): number {
    const total = this.tasks.size;
    const completed = this.getCompletedTasks().length;
    return Math.round((completed / total) * 100);
  }

  public calculateOverallPerformance(): number {
    const completionRate = this.getCompletionRate();
    const criticalTasksCompleted = this.getCompletedTasks().filter(t => t.priority === 'critical').length;
    const totalCriticalTasks = this.getTasks().filter(t => t.priority === 'critical').length;
    
    const criticalBonus = totalCriticalTasks > 0 ? (criticalTasksCompleted / totalCriticalTasks) * 30 : 0;
    const streakBonus = Math.min(this.userStreak * 2, 20);
    
    return Math.min(completionRate + criticalBonus + streakBonus, 100);
  }

  public getBusinessMetrics(): BusinessMetrics {
    const performance = this.calculateOverallPerformance();
    const completionRate = this.getCompletionRate();
    const criticalPending = this.getCriticalTasks().length;
    
    return {
      overallPerformance: performance,
      completionRate,
      streakDays: this.userStreak,
      productivityScore: Math.round(performance * 0.9 + (this.userStreak * 2)),
      revenueImpact: this.calculateRevenueImpact(),
      growthMomentum: this.calculateGrowthMomentum(),
      riskLevel: criticalPending >= 3 ? 'critical' : criticalPending >= 2 ? 'high' : criticalPending >= 1 ? 'medium' : 'low',
      nextMilestone: this.getNextMilestone()
    };
  }

  private calculateRevenueImpact(): number {
    const completedTasks = this.getCompletedTasks();
    const totalBoost = completedTasks.reduce((sum, task) => sum + task.performanceBoost, 0);
    return Math.round(totalBoost * 0.8); // 80% do boost teórico
  }

  private calculateGrowthMomentum(): number {
    if (this.performanceHistory.length < 3) return 50;
    
    const recent = this.performanceHistory.slice(-3);
    const trend = recent[2] - recent[0];
    return Math.max(0, Math.min(100, 50 + trend));
  }

  private getNextMilestone(): string {
    const streak = this.userStreak;
    if (streak < 7) return `${7 - streak} dias para Sequência Semanal`;
    if (streak < 30) return `${30 - streak} dias para Sequência Mensal`;
    if (streak < 100) return `${100 - streak} dias para Sequência Centenária`;
    return 'LENDA - Sequência Épica Ativa!';
  }

  public getActiveAlerts(): TaskAlert[] {
    const alerts: TaskAlert[] = [];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.tasks.forEach(task => {
      if (!task.completed) {
        if (currentTime > task.dueTime) {
          alerts.push(this.generateTaskAlert(task, 'overdue'));
        } else if (task.priority === 'critical') {
          const dueMinutes = this.getMinutesUntilDue(task.dueTime);
          if (dueMinutes <= 60) {
            alerts.push(this.generateTaskAlert(task, 'urgent'));
          }
        }
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private getMinutesUntilDue(dueTime: string): number {
    const now = new Date();
    const [hours, minutes] = dueTime.split(':').map(Number);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    if (dueDate < now) return -1; // Já passou
    return Math.floor((dueDate.getTime() - now.getTime()) / 60000);
  }

  public getAIInsights(): string[] {
    return this.aiInsights;
  }

  public exportDailyReport(): any {
    return {
      date: new Date().toDateString(),
      metrics: this.getBusinessMetrics(),
      tasks: this.getTasks(),
      alerts: this.getActiveAlerts(),
      insights: this.getAIInsights(),
      performance: this.calculateOverallPerformance(),
      streak: this.userStreak
    };
  }
}

export default TaskMonitoringEngine;
