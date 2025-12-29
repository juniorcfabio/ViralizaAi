import React, { useState, useEffect, useRef } from 'react';
import TaskMonitoringEngine, { DailyTask, BusinessMetrics, TaskAlert } from '../../services/taskMonitoringEngine';

interface TaskMonitoringDashboardProps {
  onClose: () => void;
}

const TaskMonitoringDashboard: React.FC<TaskMonitoringDashboardProps> = ({ onClose }) => {
  const [engine] = useState(() => new TaskMonitoringEngine());
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [alerts, setAlerts] = useState<TaskAlert[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    updateData();
    const interval = setInterval(() => {
      updateData();
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateData = () => {
    setTasks(engine.getTasks());
    setMetrics(engine.getBusinessMetrics());
    setAlerts(engine.getActiveAlerts());
    setInsights(engine.getAIInsights());
  };

  const handleCompleteTask = (taskId: string) => {
    const success = engine.completeTask(taskId);
    if (success) {
      updateData();
      
      // Verificar se todas as tarefas críticas foram completadas
      const criticalTasks = engine.getCriticalTasks();
      if (criticalTasks.length === 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  };

  const getTaskStatusIcon = (task: DailyTask) => {
    if (task.completed) return '✅';
    if (task.priority === 'critical') return '🚨';
    if (task.priority === 'high') return '🔥';
    return '📋';
  };

  const getTaskStatusColor = (task: DailyTask) => {
    if (task.completed) return 'bg-green-500/20 border-green-500';
    if (task.priority === 'critical') return 'bg-red-500/20 border-red-500 animate-pulse';
    if (task.priority === 'high') return 'bg-orange-500/20 border-orange-500';
    return 'bg-blue-500/20 border-blue-500';
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-400';
    if (performance >= 80) return 'text-blue-400';
    if (performance >= 70) return 'text-yellow-400';
    if (performance >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400 animate-pulse';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const isTaskOverdue = (task: DailyTask) => {
    if (task.completed) return false;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime > task.dueTime;
  };

  const getTimeUntilDue = (dueTime: string) => {
    const now = new Date();
    const [hours, minutes] = dueTime.split(':').map(Number);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    if (dueDate < now) return 'Atrasada';
    
    const diff = dueDate.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft > 0) return `${hoursLeft}h ${minutesLeft}m`;
    return `${minutesLeft}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-blue-500/30">
        
        {/* Celebration Animation */}
        {showCelebration && (
          <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/80">
            <div className="text-center animate-bounce">
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-2">PARABÉNS!</h2>
              <p className="text-xl text-white">Todas as tarefas críticas completadas!</p>
              <p className="text-lg text-green-400">Seu negócio está performando no máximo!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="animate-pulse">🚀</span>
                Monitor de Performance Ultra-Avançado
                <span className="animate-pulse">⚡</span>
              </h1>
              <p className="text-blue-100 mt-2">
                Sistema de IA que monitora seu sucesso em tempo real • {formatTime(currentTime)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar - Métricas */}
          <div className="w-80 bg-black/40 p-6 border-r border-gray-700 overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📊 Métricas do Negócio
            </h3>
            
            {metrics && (
              <div className="space-y-4">
                {/* Performance Geral */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-xl border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Performance Geral</span>
                    <span className={`text-2xl font-bold ${getPerformanceColor(metrics.overallPerformance)}`}>
                      {metrics.overallPerformance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        metrics.overallPerformance >= 90 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        metrics.overallPerformance >= 80 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        metrics.overallPerformance >= 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        'bg-gradient-to-r from-red-400 to-pink-500'
                      }`}
                      style={{ width: `${metrics.overallPerformance}%` }}
                    ></div>
                  </div>
                </div>

                {/* Taxa de Conclusão */}
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-4 rounded-xl border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Taxa de Conclusão</span>
                    <span className="text-2xl font-bold text-green-400">{metrics.completionRate}%</span>
                  </div>
                </div>

                {/* Sequência */}
                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-4 rounded-xl border border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sequência</span>
                    <span className="text-2xl font-bold text-yellow-400">{metrics.streakDays} dias</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{metrics.nextMilestone}</p>
                </div>

                {/* Score de Produtividade */}
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 rounded-xl border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Score Produtividade</span>
                    <span className="text-2xl font-bold text-purple-400">{metrics.productivityScore}</span>
                  </div>
                </div>

                {/* Impacto na Receita */}
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Impacto Receita</span>
                    <span className="text-2xl font-bold text-emerald-400">+{metrics.revenueImpact}%</span>
                  </div>
                </div>

                {/* Momentum de Crescimento */}
                <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 p-4 rounded-xl border border-cyan-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Momentum</span>
                    <span className="text-2xl font-bold text-cyan-400">{metrics.growthMomentum}%</span>
                  </div>
                </div>

                {/* Nível de Risco */}
                <div className={`p-4 rounded-xl border ${
                  metrics.riskLevel === 'critical' ? 'bg-red-600/20 border-red-500/30' :
                  metrics.riskLevel === 'high' ? 'bg-orange-600/20 border-orange-500/30' :
                  metrics.riskLevel === 'medium' ? 'bg-yellow-600/20 border-yellow-500/30' :
                  'bg-green-600/20 border-green-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Nível de Risco</span>
                    <span className={`text-lg font-bold uppercase ${getRiskColor(metrics.riskLevel)}`}>
                      {metrics.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* IA Insights */}
            <div className="mt-6">
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                🤖 Insights da IA
              </h4>
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div key={index} className="bg-blue-600/10 p-3 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-200">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Alertas Críticos */}
            {alerts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2 animate-pulse">
                  🚨 Alertas Críticos
                </h3>
                <div className="grid gap-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border-2 ${
                      alert.severity === 'critical' ? 'bg-red-500/20 border-red-500 animate-pulse' :
                      alert.severity === 'error' ? 'bg-orange-500/20 border-orange-500' :
                      'bg-yellow-500/20 border-yellow-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white">{alert.message}</p>
                          <p className="text-sm text-gray-300 mt-1">{alert.action}</p>
                          <p className="text-xs text-gray-400 mt-2">{alert.businessRisk}</p>
                        </div>
                        <button 
                          onClick={() => {
                            const task = tasks.find(t => t.id === alert.taskId);
                            if (task) setSelectedTask(task);
                          }}
                          className="bg-white/20 px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors"
                        >
                          Ver Tarefa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Tarefas */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                📋 Tarefas do Dia
              </h3>
              
              <div className="grid gap-4">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${getTaskStatusColor(task)} ${
                      isTaskOverdue(task) && !task.completed ? 'animate-pulse' : ''
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getTaskStatusIcon(task)}</span>
                          <h4 className="text-lg font-bold text-white">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            task.priority === 'critical' ? 'bg-red-500 text-white' :
                            task.priority === 'high' ? 'bg-orange-500 text-white' :
                            task.priority === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-300 mb-3">{task.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            ⏰ {task.dueTime} {!task.completed && (
                              <span className={`font-bold ${isTaskOverdue(task) ? 'text-red-400' : 'text-yellow-400'}`}>
                                ({getTimeUntilDue(task.dueTime)})
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            📈 +{task.performanceBoost}% performance
                          </span>
                          <span className="flex items-center gap-1">
                            🔥 {task.streak} sequência
                          </span>
                        </div>
                        
                        {task.aiRecommendation && (
                          <div className="mt-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                            <p className="text-sm text-blue-200">
                              💡 <strong>IA:</strong> {task.aiRecommendation}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col items-end gap-2">
                        {!task.completed ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task.id);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold transition-colors"
                          >
                            ✓ Completar
                          </button>
                        ) : (
                          <div className="text-green-400 font-bold flex items-center gap-2">
                            ✅ Concluída
                            {task.completedAt && (
                              <span className="text-xs text-gray-400">
                                {task.completedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="text-right text-xs text-gray-400">
                          <div>⏱️ {task.estimatedTime}min</div>
                          <div>📊 Impacto: {task.businessImpact}/10</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 p-8 rounded-2xl max-w-2xl w-full border border-blue-500/30">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedTask.title}</h3>
                  <p className="text-gray-300">{selectedTask.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-2xl text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Categoria</div>
                  <div className="text-white font-bold capitalize">{selectedTask.category}</div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Prioridade</div>
                  <div className="text-white font-bold capitalize">{selectedTask.priority}</div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Tempo Estimado</div>
                  <div className="text-white font-bold">{selectedTask.estimatedTime} minutos</div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Impacto no Negócio</div>
                  <div className="text-white font-bold">{selectedTask.businessImpact}/10</div>
                </div>
              </div>
              
              {selectedTask.aiRecommendation && (
                <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30 mb-6">
                  <div className="text-sm text-blue-200">
                    <strong>💡 Recomendação da IA:</strong> {selectedTask.aiRecommendation}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
                >
                  Fechar
                </button>
                {!selectedTask.completed && (
                  <button
                    onClick={() => {
                      handleCompleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold transition-colors"
                  >
                    ✓ Completar Tarefa
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskMonitoringDashboard;
