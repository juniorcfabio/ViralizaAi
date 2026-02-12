import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextFixed';

const TaskMonitoringPage: React.FC = () => {
  const { user } = useAuth();

  // Redirecionar usuários comuns para o dashboard
  if (user?.type !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirecionar para o módulo administrativo
  return <Navigate to="/admin/task-monitoring" replace />;
};

export default TaskMonitoringPage;
