import React from 'react';

function DebugPage() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e', 
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1>🔍 DEBUG - VIRALIZA.AI</h1>
      <p>Verificando ambiente de produção...</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>📊 Informações do Ambiente:</h2>
        <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        <p><strong>Node Environment:</strong> {process.env.NODE_ENV || 'Não definido'}</p>
        <p><strong>Vite API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Não definido'}</p>
        <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Não definido'}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🔧 Teste de Componentes:</h2>
        <p>✅ React está funcionando</p>
        <p>✅ CSS está carregando</p>
        <p>✅ JavaScript está executando</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🚀 Ações:</h2>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Ir para Home
        </button>
        <button 
          onClick={() => console.log('Debug: Botão clicado!')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Testar Console
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>📝 Logs:</h2>
        <div id="logs" style={{ 
          backgroundColor: '#000', 
          padding: '10px', 
          borderRadius: '5px',
          height: '200px',
          overflow: 'auto'
        }}>
          <p style={{ color: '#0f0' }}>✅ Debug page carregou com sucesso!</p>
        </div>
      </div>
    </div>
  );
}

export default DebugPage;
