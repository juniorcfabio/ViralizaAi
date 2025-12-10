import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { generateGrowthCampaign } from '../../services/geminiService';

type Platform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'facebook'
  | 'site'
  | 'loja';

interface ProfileInfo {
  niche: string;
  targetAudience: string;
  mainOffer: string;
  tone: string;
  languages: string;
  platforms: Platform[];
}

interface ViralIdea {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  goal: 'engagement' | 'sales' | 'growth';
}

interface ScriptIdea {
  id: string;
  hook: string;
  structure: string;
  cta: string;
  duration: 'short' | 'medium' | 'long';
  platform: Platform;
}

type TierKey = 'quinzenal' | 'mensal' | 'anual';

interface GrowthEngineTierLimits {
  maxIdeasPerDay: number;
  maxScriptsPerDay: number;
  maxDaysInAdvance: number;
  aiIntensity: number;
}

interface GrowthEngineGlobalConfig {
  enabled: boolean;
  defaultFocus: 'growth' | 'engagement' | 'sales';
  allowDemoWithoutApiKey: boolean;
  maxUsersWithAddOn: number;
  tiers: Record<TierKey, GrowthEngineTierLimits>;
  revenueSharePercent: number;
}

const ADMIN_GE_STORAGE_KEY = 'viraliza_admin_growth_engine_config_v1';

const defaultAdminGrowthConfig: GrowthEngineGlobalConfig = {
  enabled: true,
  defaultFocus: 'growth',
  allowDemoWithoutApiKey: true,
  maxUsersWithAddOn: 1000,
  revenueSharePercent: 20,
  tiers: {
    quinzenal: {
      maxIdeasPerDay: 15,
      maxScriptsPerDay: 10,
      maxDaysInAdvance: 15,
      aiIntensity: 7
    },
    mensal: {
      maxIdeasPerDay: 30,
      maxScriptsPerDay: 20,
      maxDaysInAdvance: 30,
      aiIntensity: 8
    },
    anual: {
      maxIdeasPerDay: 60,
      maxScriptsPerDay: 40,
      maxDaysInAdvance: 90,
      aiIntensity: 9
    }
  }
};

const platformLabels: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  site: 'Site / Blog',
  loja: 'Loja Online'
};

const loadAdminGrowthConfig = (): GrowthEngineGlobalConfig => {
  try {
    const stored = localStorage.getItem(ADMIN_GE_STORAGE_KEY);
    if (!stored) return defaultAdminGrowthConfig;
    return { ...defaultAdminGrowthConfig, ...JSON.parse(stored) };
  } catch {
    return defaultAdminGrowthConfig;
  }
};

const mapPlanLabelToTier = (label: string | null): TierKey => {
  if (!label) return 'mensal';
  if (label.toLowerCase().includes('quinzenal')) return 'quinzenal';
  if (label.toLowerCase().includes('anual')) return 'anual';
  return 'mensal';
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const loadDailyUsage = (userId: string) => {
  try {
    const key = `growthEngine_usage_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveDailyUsage = (userId: string, usage: any) => {
  try {
    const key = `growthEngine_usage_${userId}`;
    localStorage.setItem(key, JSON.stringify(usage));
  } catch {
  }
};

const UserGrowthEnginePage: React.FC = () => {
  const { user, isSubscriptionActive, hasAccess } = useAuth();
  const navigate = useNavigate();

  const adminConfig = loadAdminGrowthConfig();

  const [profile, setProfile] = useState<ProfileInfo>({
    niche: '',
    targetAudience: '',
    mainOffer: '',
    tone: '',
    languages: '',
    platforms: ['instagram', 'tiktok']
  });

  const [focus, setFocus] = useState<'engagement' | 'sales' | 'growth'>(
    adminConfig.defaultFocus
  );

  const [viralIdeas, setViralIdeas] = useState<ViralIdea[]>([]);
  const [scriptIdeas, setScriptIdeas] = useState<ScriptIdea[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);

  const subscriptionActive = isSubscriptionActive();
  const hasGrowthEngine = hasAccess('growthEngine');

  const userGrowthPlanLabel =
    (user && localStorage.getItem(`growthEngine_plan_${user.id}`)) || null;
  const userTierKey: TierKey = mapPlanLabelToTier(userGrowthPlanLabel);
  const tierLimits = adminConfig.tiers[userTierKey];

  const [days, setDays] = useState(
    Math.min(30, tierLimits.maxDaysInAdvance || 30)
  );

  const todayUsage = (() => {
    if (!user) return { ideas: 0, scripts: 0 };
    const today = getTodayKey();
    const usage = loadDailyUsage(user.id);
    return usage[today] || { ideas: 0, scripts: 0 };
  })();

  const handleProfileChange = <K extends keyof ProfileInfo>(
    key: K,
    value: ProfileInfo[K]
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlatform = (platform: Platform) => {
    setProfile((prev) => {
      const has = prev.platforms.includes(platform);
      return {
        ...prev,
        platforms: has
          ? prev.platforms.filter((p) => p !== platform)
          : [...prev.platforms, platform]
      };
    });
  };

  const buildBusinessInfo = () => {
    const parts: string[] = [];
    if (profile.niche) parts.push(`Nicho/segmento: ${profile.niche}`);
    if (profile.targetAudience) parts.push(`Público-alvo: ${profile.targetAudience}`);
    if (profile.mainOffer) parts.push(`Oferta principal: ${profile.mainOffer}`);
    if (profile.tone) parts.push(`Tom de voz: ${profile.tone}`);
    if (profile.languages) parts.push(`Idiomas: ${profile.languages}`);
    return parts.join(' | ');
  };

  const getMainPlatformLabel = () => {
    const main = profile.platforms[0] || 'instagram';
    return platformLabels[main];
  };

  const mapFocusToToneExtra = () => {
    if (focus === 'sales') return 'Foco máximo em conversão e vendas.';
    if (focus === 'engagement')
      return 'Foco em engajamento, comentários e compartilhamentos.';
    return 'Foco em crescimento acelerado de seguidores e alcance orgânico.';
  };

  const generateIdeasWithAIOrMock = async () => {
    if (!profile.niche || !profile.targetAudience || profile.platforms.length === 0) {
      alert('Preencha nicho, público-alvo e selecione ao menos uma plataforma.');
      return;
    }

    if (user) {
      const today = getTodayKey();
      const usage = loadDailyUsage(user.id);
      const todayUsageLocal = usage[today] || { ideas: 0, scripts: 0 };

      if (todayUsageLocal.ideas >= tierLimits.maxIdeasPerDay) {
        alert(
          `Você atingiu o limite diário de ideias do seu plano (${userGrowthPlanLabel ||
            userTierKey}). Tente novamente amanhã.`
        );
        return;
      }
    }

    setIsGeneratingIdeas(true);
    try {
      const businessInfo = `${buildBusinessInfo()} | ${mapFocusToToneExtra()}`;
      const mainPlatformLabel = getMainPlatformLabel();

      const campaign = await generateGrowthCampaign(
        businessInfo,
        mainPlatformLabel,
        profile.tone || 'Profissional',
        { reach: 'global', city: '' }
      );

      if (!campaign || !campaign.posts || campaign.posts.length === 0) {
        throw new Error('Nenhum post retornado pela IA');
      }

      const selectedPlatforms = profile.platforms.length
        ? profile.platforms
        : (['instagram'] as Platform[]);

      const ideas: ViralIdea[] = campaign.posts.map((post, idx) => {
        const platform = selectedPlatforms[idx % selectedPlatforms.length];
        return {
          id: `ai_idea_${idx}`,
          platform,
          goal: focus,
          title: post.title || `Ideia ${idx + 1}`,
          description: post.content || 'Conteúdo sugerido pela IA.'
        };
      });

      setViralIdeas(ideas);

      if (user) {
        const today = getTodayKey();
        const usage = loadDailyUsage(user.id);
        const todayUsageLocal = usage[today] || { ideas: 0, scripts: 0 };
        const newCount = todayUsageLocal.ideas + 1;
        usage[today] = { ...todayUsageLocal, ideas: newCount };
        saveDailyUsage(user.id, usage);
      }
    } catch {
      const ideas: ViralIdea[] = profile.platforms.map((platform, idx) => ({
        id: `fallback_idea_${idx}`,
        platform,
        goal: focus,
        title:
          focus === 'sales'
            ? `Oferta irresistível em ${platformLabels[platform]} para ${profile.targetAudience}`
            : focus === 'engagement'
            ? `Desafio viral para ${profile.targetAudience} em ${platformLabels[platform]}`
            : `Série de conteúdo para crescer rápido em ${platformLabels[platform]}`,
        description:
          focus === 'sales'
            ? `Post com prova social, benefício claro e CTA direto para sua oferta principal: ${profile.mainOffer}.`
            : focus === 'engagement'
            ? `Conteúdo interativo com perguntas, enquetes e chamadas para comentários, usando um tom ${profile.tone}.`
            : `Sequência de posts em formato de série, educando o público em ${profile.niche} e guiando até sua oferta.`
      }));
      setViralIdeas(ideas);

      if (user) {
        const today = getTodayKey();
        const usage = loadDailyUsage(user.id);
        const todayUsageLocal = usage[today] || { ideas: 0, scripts: 0 };
        const newCount = todayUsageLocal.ideas + 1;
        usage[today] = { ...todayUsageLocal, ideas: newCount };
        saveDailyUsage(user.id, usage);
      }
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const generateScriptsWithAIOrMock = async () => {
    if (!profile.niche || !profile.targetAudience || profile.platforms.length === 0) {
      alert('Preencha nicho, público-alvo e selecione ao menos uma plataforma.');
      return;
    }

    if (user) {
      const today = getTodayKey();
      const usage = loadDailyUsage(user.id);
      const todayUsageLocal = usage[today] || { ideas: 0, scripts: 0 };

      if (todayUsageLocal.scripts >= tierLimits.maxScriptsPerDay) {
        alert(
          `Você atingiu o limite diário de roteiros do seu plano (${userGrowthPlanLabel ||
            userTierKey}). Tente novamente amanhã.`
        );
        return;
      }
    }

    setIsGeneratingScripts(true);
    try {
      const businessInfo = `${buildBusinessInfo()} | ${mapFocusToToneExtra()}`;
      const mainPlatformLabel = getMainPlatformLabel();

      const campaign = await generateGrowthCampaign(
        businessInfo,
        mainPlatformLabel,
        profile.tone || 'Profissional',
        { reach: 'global', city: '' }
      );

      if (!campaign || !campaign.posts || campaign.posts.length === 0) {
        throw new Error('Nenhum post retornado pela IA');
      }

      const selectedPlatforms = profile.platforms.length
        ? profile.platforms
        : (['instagram'] as Platform[]);

      const scripts: ScriptIdea[] = campaign.posts.map((post, idx) => {
        const platform = selectedPlatforms[idx % selectedPlatforms.length];
        const isLong = platform === 'youtube';
        const hookSource = post.content || post.title || '';
        const hook =
          hookSource.length > 140 ? hookSource.slice(0, 137) + '...' : hookSource;

        return {
          id: `ai_script_${idx}`,
          platform,
          duration: isLong ? 'long' : 'short',
          hook:
            hook ||
            (focus === 'sales'
              ? `Você está perdendo dinheiro porque ainda não usa ${profile.mainOffer} assim...`
              : focus === 'engagement'
              ? `Ninguém fala isso sobre ${profile.niche}, mas você precisa saber...`
              : `O que eu faria hoje se estivesse começando do zero em ${profile.niche}.`),
          structure: isLong
            ? 'Abertura forte, história, conteúdo em 3 blocos, prova social, CTA final.'
            : 'Hook em 3s, dor/desejo, micro-história, benefício principal, CTA rápido.',
          cta:
            focus === 'sales'
              ? 'Arraste para cima / clique no link da bio e garanta sua vaga / produto com condição especial.'
              : 'Comenta uma palavra-chave, manda esse vídeo para um amigo e me segue para a parte 2.'
        };
      });

      setScriptIdeas(scripts);

      if (user) {
        const today = getTodayKey();
        const usage = loadDailyUsage(user.id);
        const todayUsageLocal = usage[today] || { ideas: 0, scripts: 0 };
        const newCount = todayUsageLocal.scripts + 1;
        usage[today] = { ...todayUsageLocal, scripts: newCount };
        saveDailyUsage(user.id, usage);
      }
    } catch {
      const scripts: ScriptIdea[] = profile.platforms.map((platform, idx) => ({
        id: `fallback_script_${idx}`,
        platform,
        duration: platform === 'youtube' ? 'long' : 'short',
        hook:
          focus === 'sales'
            ? `Você está perdendo dinheiro porque ainda não usa ${profile.mainOffer} assim...`
            : focus === 'engagement'
            ? `Ninguém fala isso sobre ${profile.niche}, mas você precisa saber...`
            : `O que eu faria hoje se estivesse começando do zero em ${profile.niche}.`,
        structure:
          platform === 'youtube'
            ? 'Abertura forte, história, conteúdo em 3 blocos, prova social, CTA final.'
            : 'Hook em 3s, dor / desejo, micro-história, benefício principal, CTA rápido.',
        cta:
          focus === 'sales'
            ? 'Arraste para cima / clique no link da bio e garanta sua vaga / produto com condição especial.'
            : 'Comenta uma palavra-chave, manda esse vídeo para um amigo e me segue para a parte 2.'
      }));
      setScriptIdeas(scripts);

      if (user) {
        const today = getTodayKey();
        const usage = loadDailyUsage(user.id);
        const todayUsageLocal = usage[today] || { ideas: 0, scripts: 0 };
        const newCount = todayUsageLocal.scripts + 1;
        usage[today] = { ...todayUsageLocal, scripts: newCount };
        saveDailyUsage(user.id, usage);
      }
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  const calendarDays = Array.from({ length: days }, (_, i) => i + 1);

  const renderLockedState = () => {
    if (!adminConfig.enabled) {
      return (
        <div className="bg-secondary rounded-lg p-6 border border-red-800/60 text-center mt-4">
          <h2 className="text-2xl font-bold mb-2 text-red-300">
            Motor de Crescimento temporariamente desativado
          </h2>
          <p className="text-sm text-gray-300 mb-2 max-w-xl mx-auto">
            O administrador desativou o Motor de Crescimento para manutenção ou ajustes
            globais.
          </p>
          <p className="text-xs text-gray-400">
            Tente novamente mais tarde ou fale com o suporte da plataforma.
          </p>
        </div>
      );
    }

    if (!subscriptionActive) {
      return (
        <div className="bg-secondary rounded-lg p-6 border border-red-800/60 text-center mt-4">
          <h2 className="text-2xl font-bold mb-2 text-red-300">
            Assinatura inativa ou expirada
          </h2>
          <p className="text-sm text-gray-300 mb-4 max-w-xl mx-auto">
            Para acessar o Motor de Crescimento Viraliza, você precisa ter um plano
            ativo. Renove ou ative um plano para liberar todas as ferramentas.
          </p>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors"
          >
            Ir para Faturamento
          </button>
        </div>
      );
    }

    if (!hasGrowthEngine) {
      return (
        <div className="bg-secondary rounded-lg p-6 border border-yellow-700/60 text-center mt-4">
          <h2 className="text-2xl font-bold mb-2 text-yellow-200">
            Ative o Motor de Crescimento Viraliza
          </h2>
          <p className="text-sm text-gray-300 mb-4 max-w-xl mx-auto">
            Este é um módulo avulso, cobrado à parte do seu plano. Com ele você gera
            estratégias, ideias virais e roteiros avançados de conteúdo para acelerar
            seguidores e vendas em múltiplas plataformas.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Após a compra, este painel será liberado automaticamente para sua conta.
          </p>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors"
          >
            Ver planos e ativar Motor de Crescimento
          </button>
        </div>
      );
    }

    return null;
  };

  const locked = !adminConfig.enabled || !subscriptionActive || !hasGrowthEngine;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Motor de crescimento Viraliza</h1>
        <p className="text-gray-400 mt-2 max-w-3xl">
          Motor avançado para transformar suas redes sociais, sites e lojas em máquinas
          de alcance, engajamento e vendas orgânicas, preparado para qualquer idioma e
          mercado.
        </p>
        {user && (
          <p className="text-xs text-gray-500 mt-1">
            Usuário: {user.name} · Plano atual: {user.plan || 'Sem plano definido'}
          </p>
        )}
      </header>

      {!locked && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Período do Motor ativo</p>
            <p className="text-sm font-semibold">
              {userGrowthPlanLabel || 'Não identificado'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Tier interno: <span className="font-mono">{userTierKey}</span>
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Ideias geradas hoje</p>
            <p className="text-lg font-bold text-accent">
              {todayUsage.ideas} / {tierLimits.maxIdeasPerDay}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Limite diário configurado no painel admin.
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Roteiros gerados hoje</p>
            <p className="text-lg font-bold text-accent">
              {todayUsage.scripts} / {tierLimits.maxScriptsPerDay}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Contagem é renovada automaticamente a cada dia.
            </p>
          </div>
        </div>
      )}

      {locked ? (
        renderLockedState()
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-secondary p-6 rounded-lg border border-gray-800">
              <h2 className="text-xl font-bold mb-4">
                Perfil estratégico do seu negócio
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block mb-1 text-gray-300">
                    Nicho / Segmento
                  </label>
                  <input
                    type="text"
                    value={profile.niche}
                    onChange={(e) =>
                      handleProfileChange('niche', e.target.value)
                    }
                    className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
                    placeholder="Ex: Restaurante japonês em bairro residencial"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">
                    Público-alvo principal
                  </label>
                  <input
                    type="text"
                    value={profile.targetAudience}
                    onChange={(e) =>
                      handleProfileChange('targetAudience', e.target.value)
                    }
                    className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
                    placeholder="Ex: Casais jovens, famílias que valorizam qualidade e experiência"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">
                    Oferta principal
                  </label>
                  <input
                    type="text"
                    value={profile.mainOffer}
                    onChange={(e) =>
                      handleProfileChange('mainOffer', e.target.value)
                    }
                    className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
                    placeholder="Ex: Rodízio premium, delivery rápido, menu executivo"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">
                    Tom de voz da marca
                  </label>
                  <input
                    type="text"
                    value={profile.tone}
                    onChange={(e) =>
                      handleProfileChange('tone', e.target.value)
                    }
                    className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
                    placeholder="Ex: Descontraído, especialista, divertido, premium"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">
                    Idiomas que seu público entende
                  </label>
                  <input
                    type="text"
                    value={profile.languages}
                    onChange={(e) =>
                      handleProfileChange('languages', e.target.value)
                    }
                    className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
                    placeholder="Ex: Português, Inglês, Espanhol"
                  />
                </div>
              </div>
            </div>

            <div className="bg-secondary p-6 rounded-lg border border-gray-800 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold mb-4">Foco da campanha</h2>
                <div className="flex gap-2 mb-4">
                  {[
                    { key: 'growth', label: 'Crescimento' },
                    { key: 'engagement', label: 'Engajamento' },
                    { key: 'sales', label: 'Vendas' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setFocus(opt.key as 'engagement' | 'sales' | 'growth')
                      }
                      className={`flex-1 py-2 rounded-full text-sm font-semibold border ${
                        focus === opt.key
                          ? 'bg-accent text-light border-accent'
                          : 'bg-primary text-gray-300 border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">
                    Plataformas alvo
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        'instagram',
                        'tiktok',
                        'youtube',
                        'x',
                        'facebook',
                        'site',
                        'loja'
                      ] as Platform[]
                    ).map((p) => {
                      const active = profile.platforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePlatform(p)}
                          className={`px-3 py-1 rounded-full text-xs border ${
                            active
                              ? 'bg-accent text-light border-accent'
                              : 'bg-primary text-gray-300 border-gray-700 hover:bg-gray-800'
                          }`}
                        >
                          {platformLabels[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400 bg-primary/40 p-3 rounded-lg">
                <p className="font-semibold mb-1">
                  Como o Motor de Crescimento vai agir:
                </p>
                <p>{mapFocusToToneExtra()}</p>
              </div>
            </div>
          </section>

          <section className="bg-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  Calendário de plano viral estratégico
                </h2>
                <p className="text-sm text-gray-400">
                  Defina por quantos dias o motor deve planejar conteúdos e
                  oportunidades de crescimento.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">Dias planejados:</span>
                <span className="text-2xl font-bold text-accent">{days}</span>
              </div>
            </div>
            <input
              type="range"
              min={7}
              max={tierLimits.maxDaysInAdvance}
              value={days}
              onChange={(e) => {
                const value = Number(e.target.value) || 7;
                setDays(Math.min(value, tierLimits.maxDaysInAdvance));
              }}
              className="w-full mb-4"
            />
            <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500">
              {calendarDays.map((d) => (
                <div
                  key={d}
                  className="h-8 flex items-center justify-center bg-primary/40 rounded"
                >
                  Dia {d}
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-secondary p-6 rounded-lg border border-gray-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Ideias de posts virais</h2>
                  <p className="text-sm text-gray-400">
                    A IA cria ideias prontas para posts, carrosséis e vídeos
                    curtos.
                  </p>
                </div>
                <button
                  onClick={generateIdeasWithAIOrMock}
                  disabled={isGeneratingIdeas}
                  className="bg-accent text-light text-sm font-semibold py-2 px-4 rounded-full hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  {isGeneratingIdeas ? 'Gerando...' : 'Gerar ideias'}
                </button>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                {viralIdeas.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Nenhuma ideia gerada ainda. Preencha o perfil do negócio e
                    clique em "Gerar ideias".
                  </p>
                )}
                {viralIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-primary/40 p-3 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        {platformLabels[idea.platform]}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {idea.goal === 'sales'
                          ? 'Foco em vendas'
                          : idea.goal === 'engagement'
                          ? 'Foco em engajamento'
                          : 'Foco em crescimento'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold mb-1">
                      {idea.title}
                    </h3>
                    <p className="text-xs text-gray-300">
                      {idea.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary p-6 rounded-lg border border-gray-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Roteiros otimizados para vídeo
                  </h2>
                  <p className="text-sm text-gray-400">
                    Hooks, estrutura e CTAs prontos para Reels, Shorts, TikTok e
                    YouTube.
                  </p>
                </div>
                <button
                  onClick={generateScriptsWithAIOrMock}
                  disabled={isGeneratingScripts}
                  className="bg-accent text-light text-sm font-semibold py-2 px-4 rounded-full hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  {isGeneratingScripts ? 'Gerando...' : 'Gerar roteiros'}
                </button>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                {scriptIdeas.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Nenhum roteiro gerado ainda. Gere alguns a partir do seu
                    perfil estratégico.
                  </p>
                )}
                {scriptIdeas.map((script) => (
                  <div
                    key={script.id}
                    className="bg-primary/40 p-3 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        {platformLabels[script.platform]}
                      </span>
                      <span className="text-gray-400">
                        {script.duration === 'long'
                          ? 'Vídeo longo'
                          : 'Vídeo curto'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1">
                      Hook: {script.hook}
                    </p>
                    <p className="text-xs text-gray-300 mb-1">
                      Estrutura: {script.structure}
                    </p>
                    <p className="text-xs text-gray-300">CTA: {script.cta}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default UserGrowthEnginePage;