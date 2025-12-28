import { GLOBAL_NICHES, getRecommendedNiches } from '../data/globalNiches';
import GeolocationService from './geolocationService';

export interface EbookChapter {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  methodology?: string;
  tips?: string[];
}

export interface GeneratedEbook {
  title: string;
  niche: string;
  chapters: EbookChapter[];
  totalPages: number;
  generatedAt: string;
}

interface EbookGenerationParams {
  businessType: string;
  businessName: string;
  targetAudience: string;
  businessGoals: string[];
}

const getBusinessTypeInfo = (businessType: string) => {
  const businessMap: Record<string, { name: string; focus: string; keywords: string[] }> = {
    'loja_massas': {
      name: 'Loja de Massas ao Vivo',
      focus: 'experiência culinária, frescor, tradição italiana',
      keywords: ['massas frescas', 'culinária italiana', 'experiência gastronômica', 'tradição familiar']
    },
    'restaurante': {
      name: 'Restaurante',
      focus: 'experiência gastronômica, atendimento, ambiente',
      keywords: ['gastronomia', 'experiência culinária', 'atendimento premium', 'ambiente acolhedor']
    },
    'academia': {
      name: 'Academia de Musculação',
      focus: 'transformação física, saúde, resultados',
      keywords: ['fitness', 'musculação', 'transformação corporal', 'saúde e bem-estar']
    },
    'consultoria': {
      name: 'Consultoria Empresarial',
      focus: 'resultados, estratégia, crescimento',
      keywords: ['estratégia empresarial', 'crescimento', 'resultados', 'otimização de processos']
    },
    'padaria': {
      name: 'Padaria',
      focus: 'tradição, frescor, comunidade',
      keywords: ['panificação artesanal', 'produtos frescos', 'tradição familiar', 'comunidade local']
    },
    'loja_roupas': {
      name: 'Loja de Roupas',
      focus: 'estilo, tendências, personalidade',
      keywords: ['moda', 'estilo pessoal', 'tendências', 'expressão individual']
    },
    'salao_beleza': {
      name: 'Salão de Beleza',
      focus: 'autoestima, cuidados, transformação',
      keywords: ['beleza', 'autoestima', 'cuidados pessoais', 'transformação visual']
    },
    'clinica_medica': {
      name: 'Clínica Médica',
      focus: 'saúde, prevenção, cuidados',
      keywords: ['saúde', 'prevenção', 'cuidados médicos', 'bem-estar']
    },
    'escola_idiomas': {
      name: 'Escola de Idiomas',
      focus: 'comunicação, oportunidades, crescimento',
      keywords: ['aprendizado', 'comunicação', 'oportunidades profissionais', 'crescimento pessoal']
    },
    'pet_shop': {
      name: 'Pet Shop',
      focus: 'cuidados com pets, amor animal, bem-estar',
      keywords: ['cuidados pet', 'amor animal', 'bem-estar animal', 'produtos especializados']
    },
    'loja_doces': {
      name: 'Loja de Doces',
      focus: 'momentos especiais, sabor, tradição',
      keywords: ['doces artesanais', 'momentos especiais', 'sabores únicos', 'tradição doceira']
    },
    'oficina_mecanica': {
      name: 'Oficina Mecânica',
      focus: 'confiança, segurança, expertise',
      keywords: ['manutenção automotiva', 'confiança', 'segurança veicular', 'expertise técnica']
    },
    'farmacia': {
      name: 'Farmácia',
      focus: 'saúde, cuidados, orientação',
      keywords: ['medicamentos', 'saúde', 'orientação farmacêutica', 'cuidados preventivos']
    },
    'loja_moveis': {
      name: 'Loja de Móveis',
      focus: 'ambientes, funcionalidade, estilo',
      keywords: ['decoração', 'ambientes funcionais', 'design de interiores', 'qualidade de vida']
    },
    'curso_online': {
      name: 'Curso Online',
      focus: 'conhecimento, transformação, oportunidades',
      keywords: ['educação digital', 'transformação profissional', 'conhecimento especializado', 'oportunidades']
    },
    'agencia_viagens': {
      name: 'Agência de Viagens',
      focus: 'experiências, descobertas, memórias',
      keywords: ['turismo', 'experiências únicas', 'descobertas', 'memórias inesquecíveis']
    },
    'loja_esportes': {
      name: 'Loja de Esportes',
      focus: 'performance, saúde, superação',
      keywords: ['equipamentos esportivos', 'performance atlética', 'saúde física', 'superação pessoal']
    },
    'studio_fotografia': {
      name: 'Studio de Fotografia',
      focus: 'memórias, arte, momentos únicos',
      keywords: ['fotografia profissional', 'memórias eternas', 'arte visual', 'momentos especiais']
    },
    'clinica_veterinaria': {
      name: 'Clínica Veterinária',
      focus: 'saúde animal, cuidados, amor pelos pets',
      keywords: ['saúde animal', 'cuidados veterinários', 'amor pelos pets', 'bem-estar animal']
    },
    'outro': {
      name: 'Negócio Personalizado',
      focus: 'excelência, inovação, resultados',
      keywords: ['excelência', 'inovação', 'resultados excepcionais', 'diferenciação no mercado']
    }
  };

  return businessMap[businessType] || businessMap['outro'];
};

const generateChapterContent = (
  chapterNumber: number,
  title: string,
  businessInfo: any,
  businessName: string,
  targetAudience: string,
  businessGoals: string[]
): EbookChapter => {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000);
  
  // URLs de imagens profissionais do Unsplash (600x400px)
  const imageUrls = [
    `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&h=400&fit=crop&crop=center`,
    `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop&crop=center`
  ];

  const selectedImageUrl = imageUrls[(chapterNumber + randomSeed) % imageUrls.length];

  // Metodologias proprietárias exclusivas
  const methodologies = [
    'ConversionMax Pro™',
    'SmartFlow AI™',
    'Emotional Trigger Mapping™',
    'Value Stacking 3.0™',
    'Pain Point Amplification™',
    'Big Data Analytics Pro™',
    'Neuromarketing Advanced™',
    'Customer Journey Optimization™',
    'Viral Content Formula™',
    'Revenue Acceleration System™',
    'Engagement Maximizer Pro™',
    'Trust Building Framework™',
    'Social Proof Amplifier™',
    'Conversion Psychology™',
    'Digital Dominance Strategy™'
  ];

  const selectedMethodology = methodologies[(chapterNumber + timestamp) % methodologies.length];

  // Conteúdo ultra-técnico e vendável (1.5+ páginas)
  const content = `
    <div class="chapter-intro">
      <p><strong>Bem-vindo ao Capítulo ${chapterNumber}</strong> - Este é um dos capítulos mais importantes do seu guia de transformação para ${businessName}. Aqui você descobrirá estratégias ultra-avançadas que podem revolucionar completamente seus resultados.</p>
    </div>

    <div class="section">
      <h3>🎯 Análise Estratégica Avançada</h3>
      <p>No contexto de ${businessInfo.name.toLowerCase()}, é fundamental compreender que ${targetAudience.toLowerCase()} possui necessidades muito específicas que vão além do óbvio. Nossa pesquisa proprietária com mais de 10.000 empresas similares revelou padrões comportamentais únicos que podem ser explorados estrategicamente.</p>
      
      <p>A metodologia <strong>${selectedMethodology}</strong> que desenvolvemos especificamente para este nicho demonstrou resultados excepcionais: empresas que implementaram essas estratégias viram um aumento médio de <strong>${180 + (chapterNumber * 15)}% nas conversões</strong> em apenas 30 dias.</p>
    </div>

    <div class="methodology">
      <h3>🔬 Metodologia Proprietária: ${selectedMethodology}</h3>
      <p>Esta metodologia exclusiva foi desenvolvida através de anos de pesquisa e testes com mais de 500 empresas do segmento de ${businessInfo.name.toLowerCase()}. Os resultados são consistentemente superiores aos métodos tradicionais.</p>
      
      <p><strong>Componentes principais:</strong></p>
      <ul>
        <li><strong>Análise Comportamental Avançada:</strong> Mapeamento detalhado dos gatilhos emocionais específicos do seu público</li>
        <li><strong>Otimização de Conversão Inteligente:</strong> Algoritmos proprietários que identificam os pontos de maior impacto</li>
        <li><strong>Personalização Dinâmica:</strong> Adaptação em tempo real baseada no comportamento do cliente</li>
        <li><strong>Métricas Preditivas:</strong> Antecipação de tendências e oportunidades de mercado</li>
      </ul>
    </div>

    <div class="section">
      <h3>📊 Caso de Sucesso Real</h3>
      <p>A empresa <strong>"${businessName} Premium"</strong> (nome alterado por questões de privacidade) implementou exatamente essas estratégias e obteve resultados extraordinários:</p>
      
      <ul>
        <li><strong>Aumento de ${220 + (chapterNumber * 20)}% no faturamento</strong> em 60 dias</li>
        <li><strong>Redução de ${35 + (chapterNumber * 5)}% no custo de aquisição</strong> de clientes</li>
        <li><strong>Melhoria de ${85 + (chapterNumber * 10)}% na retenção</strong> de clientes</li>
        <li><strong>ROI de ${340 + (chapterNumber * 30)}%</strong> no primeiro trimestre</li>
      </ul>
      
      <p>O proprietário relatou: <em>"Nunca imaginei que mudanças aparentemente simples pudessem gerar resultados tão impressionantes. Em 3 meses, conseguimos superar todo o faturamento do ano anterior."</em></p>
    </div>

    <div class="section">
      <h3>⚡ Implementação Prática Passo a Passo</h3>
      <p>Agora vamos à parte prática. Siga exatamente estes passos para implementar a estratégia em ${businessName}:</p>
      
      <p><strong>Semana 1 - Preparação Estratégica:</strong></p>
      <ol>
        <li>Realize uma auditoria completa dos seus processos atuais</li>
        <li>Identifique os 3 principais pontos de atrito na jornada do cliente</li>
        <li>Mapeie os gatilhos emocionais específicos do seu público-alvo</li>
        <li>Configure as ferramentas de monitoramento necessárias</li>
      </ol>
      
      <p><strong>Semana 2 - Otimização Inicial:</strong></p>
      <ol>
        <li>Implemente as primeiras melhorias identificadas</li>
        <li>Configure testes A/B para validar as mudanças</li>
        <li>Estabeleça métricas de acompanhamento detalhadas</li>
        <li>Treine sua equipe nos novos processos</li>
      </ol>
    </div>

    <div class="tips">
      <h4>💡 Dicas Avançadas de Implementação</h4>
      <ul>
        <li><strong>Timing é crucial:</strong> Implemente as mudanças gradualmente para não impactar a operação atual</li>
        <li><strong>Monitore constantemente:</strong> Use dashboards em tempo real para acompanhar o impacto das mudanças</li>
        <li><strong>Teste continuamente:</strong> Nunca pare de testar novas variações e otimizações</li>
        <li><strong>Documente tudo:</strong> Mantenha registros detalhados do que funciona e do que não funciona</li>
        <li><strong>Escale gradualmente:</strong> Após validar os resultados, expanda as estratégias para outros canais</li>
      </ul>
    </div>

    <div class="section">
      <h3>🚨 Erros Críticos a Evitar</h3>
      <p>Nossa experiência com milhares de implementações revelou 7 erros críticos que podem comprometer completamente seus resultados:</p>
      
      <ol>
        <li><strong>Implementação apressada:</strong> Pular etapas de validação pode gerar resultados negativos</li>
        <li><strong>Falta de monitoramento:</strong> Não acompanhar métricas detalhadas impede otimizações</li>
        <li><strong>Resistência à mudança:</strong> Não envolver a equipe no processo de transformação</li>
        <li><strong>Foco em métricas erradas:</strong> Priorizar vanity metrics ao invés de resultados reais</li>
        <li><strong>Abandono precoce:</strong> Desistir antes de dar tempo suficiente para os resultados aparecerem</li>
        <li><strong>Falta de personalização:</strong> Aplicar estratégias genéricas sem adaptar ao seu contexto</li>
        <li><strong>Negligenciar o follow-up:</strong> Não manter contato consistente com os clientes</li>
      </ol>
    </div>

    <div class="section">
      <h3>📈 Métricas de Sucesso e KPIs</h3>
      <p>Para garantir que você está no caminho certo, monitore estas métricas essenciais:</p>
      
      <p><strong>Métricas Primárias (acompanhe diariamente):</strong></p>
      <ul>
        <li>Taxa de conversão geral</li>
        <li>Custo por aquisição (CPA)</li>
        <li>Valor médio do pedido (AOV)</li>
        <li>Taxa de retenção de clientes</li>
      </ul>
      
      <p><strong>Métricas Secundárias (acompanhe semanalmente):</strong></p>
      <ul>
        <li>Net Promoter Score (NPS)</li>
        <li>Lifetime Value (LTV)</li>
        <li>Taxa de churn</li>
        <li>Tempo médio de conversão</li>
      </ul>
    </div>

    <div class="section">
      <h3>🎯 Próximos Passos Estratégicos</h3>
      <p>Após implementar as estratégias deste capítulo, você estará pronto para avançar para o próximo nível. No próximo capítulo, abordaremos técnicas ainda mais avançadas que podem multiplicar seus resultados.</p>
      
      <p>Lembre-se: o sucesso em ${businessInfo.name.toLowerCase()} não acontece por acaso. É resultado de estratégias bem planejadas, implementação consistente e otimização contínua. Com as ferramentas e conhecimentos que você está adquirindo neste guia, você tem tudo o que precisa para transformar ${businessName} em uma referência no mercado.</p>
    </div>
  `;

  const tips = [
    `Implemente as estratégias gradualmente para ${businessInfo.name.toLowerCase()}`,
    `Monitore as métricas específicas do seu nicho de ${businessInfo.focus}`,
    `Personalize a abordagem para ${targetAudience.toLowerCase()}`,
    `Teste continuamente diferentes variações das estratégias`,
    `Documente todos os resultados para otimização futura`
  ];

  return {
    id: chapterNumber,
    title,
    content,
    imageUrl: selectedImageUrl,
    methodology: selectedMethodology,
    tips
  };
};

export const generateEbook = async (params: EbookGenerationParams): Promise<GeneratedEbook> => {
  const { businessType, businessName, targetAudience, businessGoals } = params;
  const businessInfo = getBusinessTypeInfo(businessType);
  
  const chapters: EbookChapter[] = [
    {
      ...generateChapterContent(1, `Entendendo o Cliente Ideal de ${businessName}`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(2, `Estratégias de Posicionamento para ${businessInfo.name}`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(3, `Criando uma Proposta de Valor Irresistível`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(4, `Marketing Digital Avançado para ${businessInfo.name}`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(5, `Otimização de Conversões e Vendas`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(6, `Fidelização e Retenção de Clientes`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(7, `Automação e Sistemas Inteligentes`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(8, `Análise de Dados e Métricas Avançadas`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(9, `Expansão e Crescimento Sustentável`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(10, `Inovação e Diferenciação Competitiva`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(11, `Gestão de Relacionamento com Cliente (CRM)`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(12, `Estratégias de Precificação Inteligente`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(13, `Marketing de Conteúdo e Autoridade`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(14, `Parcerias Estratégicas e Networking`, businessInfo, businessName, targetAudience, businessGoals),
    },
    {
      ...generateChapterContent(15, `Plano de Ação de 90 Dias para Transformação`, businessInfo, businessName, targetAudience, businessGoals),
    }
  ];

  const totalPages = Math.ceil(chapters.length * 1.8); // 1.8 páginas por capítulo em média

  return {
    title: `Guia Definitivo para Revolucionar ${businessName}`,
    niche: businessInfo.name,
    chapters,
    totalPages,
    generatedAt: new Date().toISOString()
  };
};
