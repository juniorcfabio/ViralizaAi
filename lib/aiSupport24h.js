// 🤖 IA DE SUPORTE AUTOMÁTICO 24H - ATENDENTE INFINITO
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AISupportSystem {
  constructor() {
    this.conversationHistory = new Map();
    this.supportKnowledgeBase = this.initializeKnowledgeBase();
    this.escalationRules = this.initializeEscalationRules();
  }

  // 🧠 BASE DE CONHECIMENTO AUTOMÁTICA
  initializeKnowledgeBase() {
    return {
      planos: {
        basico: { preco: 29.90, ferramentas: 5, limite_uso: 1000 },
        pro: { preco: 79.90, ferramentas: 15, limite_uso: 5000 },
        premium: { preco: 149.90, ferramentas: 'ilimitadas', limite_uso: 'ilimitado' }
      },
      problemas_comuns: {
        login: "Verifique seu email e senha. Se esqueceu a senha, use 'Esqueci minha senha'.",
        pagamento: "Pagamentos são processados pelo Stripe. Verifique seu cartão ou tente outro método.",
        ferramentas: "Cada plano tem acesso a diferentes ferramentas. Verifique seu plano atual.",
        limite: "Você atingiu o limite do seu plano. Considere fazer upgrade."
      },
      intencoes: {
        duvida_plano: ['plano', 'preço', 'valor', 'quanto custa', 'assinatura'],
        problema_tecnico: ['erro', 'bug', 'não funciona', 'problema', 'falha'],
        pagamento: ['pagar', 'cartão', 'cobrança', 'fatura', 'stripe'],
        cancelamento: ['cancelar', 'parar', 'desistir', 'reembolso'],
        upgrade: ['upgrade', 'melhorar', 'mais ferramentas', 'premium']
      }
    };
  }

  // 🚨 REGRAS DE ESCALAÇÃO PARA HUMANOS
  initializeEscalationRules() {
    return {
      keywords_escalacao: ['reembolso', 'processo legal', 'advogado', 'cancelar conta'],
      tentativas_maximas: 3,
      satisfacao_minima: 3,
      tempo_resposta_max: 30000 // 30 segundos
    };
  }

  // 🎯 ANALISAR INTENÇÃO DO USUÁRIO
  async analisarIntencao(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    for (const [intencao, keywords] of Object.entries(this.supportKnowledgeBase.intencoes)) {
      if (keywords.some(keyword => mensagemLower.includes(keyword))) {
        return intencao;
      }
    }
    
    return 'geral';
  }

  // 🤖 GERAR RESPOSTA INTELIGENTE
  async gerarResposta(mensagem, userId, contextoUsuario = {}) {
    try {
      const intencao = await this.analisarIntencao(mensagem);
      const historico = this.conversationHistory.get(userId) || [];
      
      // 🔍 VERIFICAR SE PRECISA ESCALAR
      if (this.deveEscalar(mensagem, historico)) {
        return this.escalarParaHumano(userId, mensagem);
      }

      // 📝 CONTEXTO PERSONALIZADO
      const contextoPersonalizado = this.criarContexto(contextoUsuario, intencao);
      
      // 🧠 GERAR RESPOSTA COM IA
      const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é o assistente de suporte da ViralizaAI, uma plataforma de IA para criação de conteúdo.
            
            CONTEXTO DO USUÁRIO:
            ${contextoPersonalizado}
            
            REGRAS:
            - Seja sempre prestativo e profissional
            - Responda em português brasileiro
            - Se não souber algo, seja honesto
            - Ofereça soluções práticas
            - Mantenha respostas concisas (máximo 200 palavras)
            - Use emojis moderadamente
            
            INTENÇÃO DETECTADA: ${intencao}`
          },
          ...historico.slice(-4), // Últimas 4 mensagens
          { role: "user", content: mensagem }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const respostaIA = resposta.choices[0].message.content;

      // 💾 SALVAR NO HISTÓRICO
      this.salvarConversa(userId, mensagem, respostaIA);

      // 📊 REGISTRAR MÉTRICAS
      await this.registrarMetrica(userId, intencao, 'resolvido_ia');

      return {
        success: true,
        resposta: respostaIA,
        intencao,
        escalado: false,
        tempo_resposta: Date.now()
      };

    } catch (error) {
      console.error('🚨 Erro na IA de suporte:', error);
      return this.respostaFallback();
    }
  }

  // 🎯 CRIAR CONTEXTO PERSONALIZADO
  criarContexto(usuario, intencao) {
    let contexto = `
    Plano atual: ${usuario.plano || 'Não identificado'}
    Status: ${usuario.plano_ativo ? 'Ativo' : 'Inativo'}
    Data cadastro: ${usuario.created_at || 'Não disponível'}
    `;

    // 📊 CONTEXTO ESPECÍFICO POR INTENÇÃO
    switch (intencao) {
      case 'duvida_plano':
        contexto += `\nPlanos disponíveis: ${JSON.stringify(this.supportKnowledgeBase.planos)}`;
        break;
      case 'problema_tecnico':
        contexto += `\nSoluções comuns: ${JSON.stringify(this.supportKnowledgeBase.problemas_comuns)}`;
        break;
      case 'pagamento':
        contexto += `\nÚltimo pagamento: ${usuario.ultimo_pagamento || 'Não encontrado'}`;
        break;
    }

    return contexto;
  }

  // 🚨 VERIFICAR SE DEVE ESCALAR PARA HUMANO
  deveEscalar(mensagem, historico) {
    const mensagemLower = mensagem.toLowerCase();
    
    // 🔍 KEYWORDS DE ESCALAÇÃO
    if (this.escalationRules.keywords_escalacao.some(keyword => 
      mensagemLower.includes(keyword))) {
      return true;
    }

    // 📊 MUITAS TENTATIVAS SEM RESOLUÇÃO
    if (historico.length >= this.escalationRules.tentativas_maximas * 2) {
      return true;
    }

    return false;
  }

  // 👨‍💼 ESCALAR PARA ATENDIMENTO HUMANO
  async escalarParaHumano(userId, mensagem) {
    // 📧 NOTIFICAR EQUIPE DE SUPORTE
    await this.notificarSuporteHumano(userId, mensagem);

    return {
      success: true,
      resposta: `Entendo que você precisa de uma atenção especial. 👨‍💼 
      
      Estou direcionando sua solicitação para nossa equipe de suporte humano, que entrará em contato em até 2 horas.
      
      Número do ticket: #${Date.now()}
      
      Enquanto isso, você pode:
      • Verificar nossa Central de Ajuda
      • Enviar email para suporte@viralizaai.com
      • Acessar o chat ao vivo (horário comercial)`,
      escalado: true,
      ticket_id: Date.now()
    };
  }

  // 💾 SALVAR CONVERSA NO HISTÓRICO
  salvarConversa(userId, pergunta, resposta) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }

    const historico = this.conversationHistory.get(userId);
    historico.push(
      { role: "user", content: pergunta },
      { role: "assistant", content: resposta }
    );

    // 🧹 MANTER APENAS ÚLTIMAS 10 MENSAGENS
    if (historico.length > 10) {
      historico.splice(0, historico.length - 10);
    }

    this.conversationHistory.set(userId, historico);
  }

  // 📊 REGISTRAR MÉTRICAS DE SUPORTE
  async registrarMetrica(userId, intencao, resultado) {
    try {
      // EM PRODUÇÃO: Salvar no banco de dados
      const metrica = {
        user_id: userId,
        intencao,
        resultado,
        timestamp: new Date(),
        session_id: `support_${Date.now()}`
      };

      console.log('📊 Métrica de suporte:', metrica);
      
      // await db.support_metrics.create({ data: metrica });
    } catch (error) {
      console.error('Erro ao registrar métrica:', error);
    }
  }

  // 🔄 RESPOSTA DE FALLBACK
  respostaFallback() {
    return {
      success: true,
      resposta: `Desculpe, estou com dificuldades técnicas no momento. 🤖
      
      Para ajuda imediata:
      • Email: suporte@viralizaai.com
      • WhatsApp: (11) 99999-9999
      • Central de Ajuda: viralizaai.com/ajuda
      
      Estarei de volta em breve!`,
      escalado: true,
      erro: true
    };
  }

  // 📧 NOTIFICAR SUPORTE HUMANO
  async notificarSuporteHumano(userId, mensagem) {
    try {
      // EM PRODUÇÃO: Integrar com sistema de tickets
      console.log(`🚨 ESCALAÇÃO PARA HUMANO:
      Usuário: ${userId}
      Mensagem: ${mensagem}
      Timestamp: ${new Date().toISOString()}`);

      // Aqui você integraria com:
      // - Sistema de tickets (Zendesk, Freshdesk)
      // - Slack/Discord para notificar equipe
      // - Email automático
      
    } catch (error) {
      console.error('Erro ao notificar suporte:', error);
    }
  }

  // 📈 OBTER ESTATÍSTICAS DO SUPORTE
  getSuportStats() {
    return {
      conversas_ativas: this.conversationHistory.size,
      total_interacoes: Array.from(this.conversationHistory.values())
        .reduce((total, conv) => total + conv.length, 0),
      uptime: process.uptime(),
      memoria_usada: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }

  // 🧹 LIMPAR CONVERSAS ANTIGAS
  limparHistoricoAntigo() {
    const agora = Date.now();
    const TEMPO_LIMITE = 24 * 60 * 60 * 1000; // 24 horas

    for (const [userId, historico] of this.conversationHistory.entries()) {
      if (historico.length === 0) continue;
      
      const ultimaInteracao = new Date(historico[historico.length - 1].timestamp || 0);
      
      if (agora - ultimaInteracao.getTime() > TEMPO_LIMITE) {
        this.conversationHistory.delete(userId);
      }
    }
  }
}

// 🚀 INSTÂNCIA GLOBAL
const aiSupport = new AISupportSystem();

// 🔄 LIMPEZA AUTOMÁTICA A CADA HORA
setInterval(() => {
  aiSupport.limparHistoricoAntigo();
}, 60 * 60 * 1000);

export { aiSupport, AISupportSystem };
