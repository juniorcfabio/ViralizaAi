// 🌍🔥 DASHBOARD SIMPLES DO SISTEMA DE AFILIADOS
'use client';

import React, { useState, useEffect } from 'react';

export default function AffiliateSimpleDashboard() {
  const [affiliateData, setAffiliateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [payoutData, setPayoutData] = useState({ pixKey: '' });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAffiliateDashboard();
  }, []);

  const loadAffiliateDashboard = async () => {
    try {
      const response = await fetch('/api/affiliate/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setAffiliateData(data.dashboard);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAffiliate = async () => {
    try {
      const response = await fetch('/api/affiliate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadAffiliateDashboard();
      }
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
    }
  };

  const copyAffiliateLink = async () => {
    if (affiliateData?.afiliado?.link) {
      await navigator.clipboard.writeText(affiliateData.afiliado.link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const requestPayout = async () => {
    if (!payoutData.pixKey) {
      alert('Por favor, insira sua chave PIX');
      return;
    }

    try {
      const response = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dadosPagamento: { pixKey: payoutData.pixKey }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Saque solicitado com sucesso!');
        await loadAffiliateDashboard();
      } else {
        alert(data.error || 'Erro ao solicitar saque');
      }
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      alert('Erro ao solicitar saque');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 2s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#fff'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#1f2937' }}>
            🌍🔥 Sistema de Afiliados
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>
            Transforme-se em um vendedor automático e ganhe 30% de comissão em cada venda!
          </p>
          
          <div style={{ 
            background: 'linear-gradient(to right, #f0fdf4, #eff6ff)', 
            padding: '30px', 
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#1f2937' }}>Como Funciona:</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '20px',
              fontSize: '0.9rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👤</div>
                <span>Torne-se afiliado</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔗</div>
                <span>Compartilhe seu link</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎯</div>
                <span>Usuário se cadastra</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
                <span>Você ganha 30%</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={createAffiliate}
            style={{
              background: 'linear-gradient(to right, #16a34a, #2563eb)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🚀 Tornar-se Afiliado Agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          background: 'linear-gradient(to right, #16a34a, #2563eb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          🌍🔥 Painel do Afiliado
        </h1>
        <p style={{ color: '#6b7280' }}>
          Código: <span style={{ 
            background: '#f3f4f6', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            border: '1px solid #d1d5db'
          }}>
            {affiliateData.afiliado.codigo}
          </span>
        </p>
      </div>

      {/* Link de Afiliado */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '30px',
        backgroundColor: '#fff'
      }}>
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🔗 Seu Link de Afiliado
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            value={affiliateData.afiliado.link} 
            readOnly 
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}
          />
          <button 
            onClick={copyAffiliateLink}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: copySuccess ? '#10b981' : '#fff',
              color: copySuccess ? '#fff' : '#374151',
              cursor: 'pointer'
            }}
          >
            {copySuccess ? '✅' : '📋'}
          </button>
        </div>
        {copySuccess && (
          <p style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '10px' }}>
            ✅ Link copiado!
          </p>
        )}
      </div>

      {/* Métricas Principais */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 5px 0' }}>Total Ganho</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                R$ {affiliateData.financeiro.totalComissoes.toFixed(2)}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>💰</div>
          </div>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 5px 0' }}>Disponível</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
                R$ {affiliateData.financeiro.disponivelSaque.toFixed(2)}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>💸</div>
          </div>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 5px 0' }}>Conversões</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#7c3aed', margin: 0 }}>
                {affiliateData.estatisticas.totalConversoes}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>🎯</div>
          </div>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 5px 0' }}>Taxa Conversão</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>
                {affiliateData.estatisticas.taxaConversao}%
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>📈</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          {[
            { id: 'overview', label: '📊 Visão Geral' },
            { id: 'commissions', label: '💰 Comissões' },
            { id: 'payout', label: '💸 Saque' },
            { id: 'stats', label: '📈 Estatísticas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#fff'
            }}>
              <h3 style={{ marginBottom: '20px' }}>📊 Performance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Total de Clicks:</span>
                  <span style={{ fontWeight: 'bold' }}>{affiliateData.estatisticas.totalClicks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Total de Indicações:</span>
                  <span style={{ fontWeight: 'bold' }}>{affiliateData.estatisticas.totalIndicacoes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Total de Vendas:</span>
                  <span style={{ fontWeight: 'bold' }}>{affiliateData.estatisticas.totalVendas}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Taxa de Conversão:</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                    {affiliateData.estatisticas.taxaConversao}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#fff'
            }}>
              <h3 style={{ marginBottom: '20px' }}>📅 Este Mês</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Comissões:</span>
                  <span style={{ fontWeight: 'bold' }}>{affiliateData.periodo.comissoesEsteMes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Valor Ganho:</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                    R$ {affiliateData.periodo.valorEsteMes.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Comissão:</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                    {affiliateData.configuracao.percentualComissao}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payout' && (
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#fff',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '10px' }}>💸 Solicitar Saque</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
              Saque mínimo: R$ {affiliateData.financeiro.minimumPayout.toFixed(2)}
            </p>

            <div style={{ 
              background: '#eff6ff', 
              padding: '15px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#1e40af', margin: 0 }}>
                💰 Valor disponível para saque: <strong>R$ {affiliateData.financeiro.disponivelSaque.toFixed(2)}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>
                Chave PIX:
              </label>
              <input
                placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
                value={payoutData.pixKey}
                onChange={(e) => setPayoutData({ ...payoutData, pixKey: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <button 
              onClick={requestPayout}
              disabled={!affiliateData.financeiro.proximoSaque || !payoutData.pixKey}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: (!affiliateData.financeiro.proximoSaque || !payoutData.pixKey) ? '#d1d5db' : '#2563eb',
                color: 'white',
                fontSize: '1rem',
                cursor: (!affiliateData.financeiro.proximoSaque || !payoutData.pixKey) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {affiliateData.financeiro.proximoSaque ? 
                '💸 Solicitar Saque' : 
                `Mínimo R$ ${affiliateData.financeiro.minimumPayout.toFixed(2)}`
              }
            </button>

            <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', marginTop: '10px' }}>
              ⏱️ Processamento: 1-3 dias úteis
            </p>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <h3 style={{ marginBottom: '20px' }}>💰 Histórico de Comissões</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {affiliateData.comissoes.length > 0 ? (
                affiliateData.comissoes.map((comissao, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>
                        R$ {comissao.valor.toFixed(2)}
                      </p>
                      <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                        {new Date(comissao.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: comissao.status === 'confirmada' ? '#dcfce7' : '#f3f4f6',
                      color: comissao.status === 'confirmada' ? '#166534' : '#374151'
                    }}>
                      {comissao.status}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  Nenhuma comissão ainda. Compartilhe seu link para começar a ganhar!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
