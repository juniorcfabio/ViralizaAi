// 🚀 CENTRO DE COMANDO CINEMATOGRÁFICO DO IMPÉRIO
// Interface estilo NASA + Cyberpunk para controle total

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import '../../styles/command-center.css';

interface DadosGlobais {
  receitaTotal: number;
  receitaHoje: number;
  usuariosTotal: number;
  usuariosAtivos: number;
  usuariosOnline: number;
  automacaoAtiva: boolean;
  iaExecutivaAtiva: boolean;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  statusGeral: string;
}

const AdminCommandCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [dados, setDados] = useState<DadosGlobais | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [modoNarrador, setModoNarrador] = useState(false);

  // 📡 CARREGAR DADOS EM TEMPO REAL
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await fetch('/api/admin/command-center');
        const data = await response.json();
        
        if (data.success) {
          setDados(data.dados);
          
          // Verificar alertas
          verificarAlertas(data.dados);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    // Carregar imediatamente
    carregarDados();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(carregarDados, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // 🔊 SISTEMA DE NARRAÇÃO
  useEffect(() => {
    if (modoNarrador && dados) {
      narrarStatus(dados);
    }
  }, [dados, modoNarrador]);

  // 🚨 VERIFICAR ALERTAS
  const verificarAlertas = (dadosAtuais: DadosGlobais) => {
    const novosAlertas: string[] = [];
    
    if (dadosAtuais.cpuUsage > 80) {
      novosAlertas.push('⚠️ CPU usage crítico detectado');
    }
    
    if (dadosAtuais.memoryUsage > 85) {
      novosAlertas.push('🚨 Memória em nível crítico');
    }
    
    if (dadosAtuais.uptime < 99) {
      novosAlertas.push('📉 Uptime abaixo do esperado');
    }
    
    setAlertas(novosAlertas);
  };

  // 🔊 FUNÇÃO DE NARRAÇÃO
  const narrarStatus = (dadosAtuais: DadosGlobais) => {
    if ('speechSynthesis' in window) {
      const texto = `Centro de comando operacional. ${dadosAtuais.usuariosOnline} usuários online. Sistema ${dadosAtuais.statusGeral}.`;
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  // 🎛️ CONTROLAR SISTEMAS
  const toggleSistema = async (automacao: boolean, iaExecutiva: boolean) => {
    try {
      const response = await fetch('/api/admin/toggle-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automacao_total: automacao,
          ia_executiva: iaExecutiva,
          admin_id: user?.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Narrar mudança se modo narrador ativo
        if (modoNarrador) {
          const texto = automacao ? 'Automação total ativada' : iaExecutiva ? 'IA executiva ativada' : 'Sistemas desativados';
          const utterance = new SpeechSynthesisUtterance(texto);
          utterance.lang = 'pt-BR';
          speechSynthesis.speak(utterance);
        }
        
        // Recarregar dados
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao alterar sistema:', error);
    }
  };

  if (loading) {
    return (
      <div className="command-center-loading">
        <div className="loading-grid"></div>
        <div className="loading-text">
          <h1>🚀 INICIALIZANDO CENTRO DE COMANDO</h1>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="command-center">
      {/* FUNDO ANIMADO */}
      <div className="background-grid"></div>
      <div className="background-particles"></div>

      {/* HEADER */}
      <header className="command-header">
        <h1 className="holograma">🌍 GLOBAL CONTROL SYSTEM</h1>
        <div className="status-indicator">
          <span className={`status-dot ${dados?.statusGeral}`}></span>
          <span>OPERATIONAL</span>
        </div>
      </header>

      {/* ALERTAS CRÍTICOS */}
      {alertas.length > 0 && (
        <div className="alertas-criticos">
          {alertas.map((alerta, index) => (
            <div key={index} className="alerta-item">
              {alerta}
            </div>
          ))}
        </div>
      )}

      {/* GRID PRINCIPAL */}
      <div className="command-grid">
        
        {/* MÉTRICAS PRINCIPAIS */}
        <div className="metrics-section">
          <HudCard 
            title="RECEITA GLOBAL" 
            value={`R$ ${dados?.receitaTotal?.toLocaleString() || '0'}`}
            subtitle={`Hoje: R$ ${dados?.receitaHoje?.toLocaleString() || '0'}`}
            type="revenue"
          />
          
          <HudCard 
            title="USUÁRIOS ATIVOS" 
            value={dados?.usuariosAtivos || 0}
            subtitle={`Total: ${dados?.usuariosTotal || 0}`}
            type="users"
          />
          
          <HudCard 
            title="ONLINE AGORA" 
            value={dados?.usuariosOnline || 0}
            subtitle="Sessões ativas"
            type="online"
          />
          
          <HudCard 
            title="UPTIME" 
            value={`${dados?.uptime || 0}%`}
            subtitle="Disponibilidade"
            type="uptime"
          />
        </div>

        {/* STATUS DOS SISTEMAS */}
        <div className="systems-section">
          <div className="system-status">
            <h3>🤖 STATUS DOS SISTEMAS</h3>
            
            <div className="system-item">
              <span>Automação Total:</span>
              <span className={`status ${dados?.automacaoAtiva ? 'active' : 'inactive'}`}>
                {dados?.automacaoAtiva ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
            
            <div className="system-item">
              <span>IA Executiva:</span>
              <span className={`status ${dados?.iaExecutivaAtiva ? 'active' : 'inactive'}`}>
                {dados?.iaExecutivaAtiva ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
            
            <div className="system-item">
              <span>CPU Usage:</span>
              <span className={`status ${(dados?.cpuUsage || 0) > 80 ? 'critical' : 'normal'}`}>
                {dados?.cpuUsage?.toFixed(1) || 0}%
              </span>
            </div>
            
            <div className="system-item">
              <span>Memory:</span>
              <span className={`status ${(dados?.memoryUsage || 0) > 85 ? 'critical' : 'normal'}`}>
                {dados?.memoryUsage?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="controls-section">
          <h3>🎛️ CONTROLES DO IMPÉRIO</h3>
          
          <div className="control-buttons">
            <button 
              className="control-btn activate"
              onClick={() => toggleSistema(true, false)}
            >
              🟢 ATIVAR AUTOMAÇÃO
            </button>
            
            <button 
              className="control-btn activate"
              onClick={() => toggleSistema(false, true)}
            >
              🧠 ATIVAR IA EXECUTIVA
            </button>
            
            <button 
              className="control-btn both"
              onClick={() => toggleSistema(true, true)}
            >
              ⚡ ATIVAR TUDO
            </button>
            
            <button 
              className="control-btn shutdown"
              onClick={() => toggleSistema(false, false)}
            >
              🔴 DESLIGAR TUDO
            </button>
          </div>

          <div className="narrator-control">
            <button 
              className={`control-btn narrator ${modoNarrador ? 'active' : ''}`}
              onClick={() => setModoNarrador(!modoNarrador)}
            >
              {modoNarrador ? '🔊 NARRADOR ON' : '🔇 NARRADOR OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="command-footer">
        <div className="footer-info">
          <span>Última atualização: {new Date().toLocaleTimeString()}</span>
          <span>Comandante: {user?.name}</span>
          <span>Nível de acesso: SUPREMO</span>
        </div>
      </footer>
    </div>
  );
};

// 💡 COMPONENTE DE CARD HUD
interface HudCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  type: 'revenue' | 'users' | 'online' | 'uptime';
}

const HudCard: React.FC<HudCardProps> = ({ title, value, subtitle, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'revenue': return '💰';
      case 'users': return '👥';
      case 'online': return '🟢';
      case 'uptime': return '⚡';
      default: return '📊';
    }
  };

  return (
    <div className={`hud-card ${type}`}>
      <div className="card-icon">{getIcon()}</div>
      <div className="card-content">
        <h4>{title}</h4>
        <h2>{value}</h2>
        {subtitle && <span className="subtitle">{subtitle}</span>}
      </div>
      <div className="card-pulse"></div>
    </div>
  );
};

export default AdminCommandCenterPage;
