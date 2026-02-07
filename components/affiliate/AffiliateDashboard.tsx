// 🌍🔥 DASHBOARD DO SISTEMA DE AFILIADOS
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  Eye, 
  MousePointer,
  Banknote,
  Calendar,
  Share2,
  Target,
  Award,
  Clock
} from 'lucide-react';

export default function AffiliateDashboard() {
  const [affiliateData, setAffiliateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [payoutData, setPayoutData] = useState({ pixKey: '' });

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🌍🔥 Sistema de Afiliados</CardTitle>
            <CardDescription>
              Transforme-se em um vendedor automático e ganhe 30% de comissão em cada venda!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Como Funciona:</h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="flex flex-col items-center">
                    <Users className="h-8 w-8 text-blue-600 mb-2" />
                    <span>Torne-se afiliado</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Share2 className="h-8 w-8 text-green-600 mb-2" />
                    <span>Compartilhe seu link</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Target className="h-8 w-8 text-purple-600 mb-2" />
                    <span>Usuário se cadastra</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
                    <span>Você ganha 30%</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={createAffiliate} size="lg" className="bg-gradient-to-r from-green-600 to-blue-600">
                🚀 Tornar-se Afiliado Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🌍🔥 Painel do Afiliado
        </h1>
        <p className="text-gray-600 mt-2">
          Código: <Badge variant="outline" className="font-mono">{affiliateData.afiliado.codigo}</Badge>
        </p>
      </div>

      {/* Link de Afiliado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Seu Link de Afiliado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={affiliateData.afiliado.link} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button onClick={copyAffiliateLink} variant="outline">
              {copySuccess ? '✅' : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {copySuccess && (
            <p className="text-green-600 text-sm mt-2">✅ Link copiado!</p>
          )}
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ganho</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {affiliateData.financeiro.totalComissoes.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponível</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {affiliateData.financeiro.disponivelSaque.toFixed(2)}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversões</p>
                <p className="text-2xl font-bold text-purple-600">
                  {affiliateData.estatisticas.totalConversoes}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa Conversão</p>
                <p className="text-2xl font-bold text-orange-600">
                  {affiliateData.estatisticas.taxaConversao}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="commissions">💰 Comissões</TabsTrigger>
          <TabsTrigger value="payout">💸 Saque</TabsTrigger>
          <TabsTrigger value="stats">📈 Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Clicks:</span>
                  <span className="font-semibold">{affiliateData.estatisticas.totalClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Indicações:</span>
                  <span className="font-semibold">{affiliateData.estatisticas.totalIndicacoes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Vendas:</span>
                  <span className="font-semibold">{affiliateData.estatisticas.totalVendas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Conversão:</span>
                  <span className="font-semibold text-green-600">
                    {affiliateData.estatisticas.taxaConversao}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📅 Este Mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Comissões:</span>
                  <span className="font-semibold">{affiliateData.periodo.comissoesEsteMes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Ganho:</span>
                  <span className="font-semibold text-green-600">
                    R$ {affiliateData.periodo.valorEsteMes.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comissão:</span>
                  <span className="font-semibold text-blue-600">
                    {affiliateData.configuracao.percentualComissao}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>💰 Histórico de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliateData.comissoes.length > 0 ? (
                  affiliateData.comissoes.map((comissao, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">R$ {comissao.valor.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(comissao.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={comissao.status === 'confirmada' ? 'default' : 'secondary'}>
                        {comissao.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma comissão ainda. Compartilhe seu link para começar a ganhar!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>💸 Solicitar Saque</CardTitle>
              <CardDescription>
                Saque mínimo: R$ {affiliateData.financeiro.minimumPayout.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  💰 Valor disponível para saque: <strong>R$ {affiliateData.financeiro.disponivelSaque.toFixed(2)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chave PIX:</label>
                <Input
                  placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
                  value={payoutData.pixKey}
                  onChange={(e) => setPayoutData({ ...payoutData, pixKey: e.target.value })}
                />
              </div>

              <Button 
                onClick={requestPayout}
                disabled={!affiliateData.financeiro.proximoSaque || !payoutData.pixKey}
                className="w-full"
              >
                {affiliateData.financeiro.proximoSaque ? 
                  '💸 Solicitar Saque' : 
                  `Mínimo R$ ${affiliateData.financeiro.minimumPayout.toFixed(2)}`
                }
              </Button>

              <p className="text-xs text-gray-500 text-center">
                ⏱️ Processamento: 1-3 dias úteis
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📈 Estatísticas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Clicks no Link</span>
                  </div>
                  <span className="font-semibold">{affiliateData.estatisticas.totalClicks}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Indicações</span>
                  </div>
                  <span className="font-semibold">{affiliateData.estatisticas.totalIndicacoes}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Vendas Convertidas</span>
                  </div>
                  <span className="font-semibold">{affiliateData.estatisticas.totalVendas}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Taxa de Conversão</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {affiliateData.estatisticas.taxaConversao}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚙️ Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Percentual de Comissão:</span>
                  <span className="font-semibold text-green-600">
                    {affiliateData.configuracao.percentualComissao}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cookie de Tracking:</span>
                  <span className="font-semibold">
                    {affiliateData.configuracao.cookieExpiration} dias
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saque Mínimo:</span>
                  <span className="font-semibold">
                    R$ {affiliateData.financeiro.minimumPayout.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="default">
                    {affiliateData.afiliado.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
