import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

type GrowthEnginePricing = {
  quinzenal: number;
  mensal: number;
  anual: number;
};

const STORAGE_KEY = 'viraliza_admin_growth_engine_config_v1';
const PRICING_STORAGE_KEY = 'viraliza_growth_engine_pricing_v1';

const defaultConfig: GrowthEngineGlobalConfig = {
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

const defaultPricing: GrowthEnginePricing = {
  quinzenal: 49.9,
  mensal: 79.9,
  anual: 199.9
};

const AdminGrowthEngineConfigPage: React.FC = () => {
  const { platformUsers } = useAuth();
  const [config, setConfig] = useState<GrowthEngineGlobalConfig>(defaultConfig);
  const [pricing, setPricing] = useState<GrowthEnginePricing>(defaultPricing);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig({ ...defaultConfig, ...JSON.parse(stored) });
      }
    } catch {
    }

    try {
      const storedPricing = localStorage.getItem(PRICING_STORAGE_KEY);
      if (storedPricing) {
        const parsed = JSON.parse(storedPricing) as Partial<GrowthEnginePricing>;
        setPricing({
          quinzenal: parsed.quinzenal ?? defaultPricing.quinzenal,
          mensal: parsed.mensal ?? defaultPricing.mensal,
          anual: parsed.anual ?? defaultPricing.anual
        });
      }
    } catch {
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(pricing));
    showNotification('Configurações do Motor de Crescimento salvas com sucesso!');
  };

  const handleTierChange = (
    tier: TierKey,
    field: keyof GrowthEngineTierLimits,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tier]: {
          ...prev.tiers[tier],
          [field]: value
        }
      }
    }));
  };

  const activeAddOnUsers = platformUsers.filter(
    (u) => u.type === 'client' && (u.addOns || []).includes('growthEngine')
  );

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Motor de Crescimento – Configurações Admin</h2>
        <p className="text-gray-dark">
          Controle global de limites, regras e intensidade do Motor de Crescimento
          Viraliza.
        </p>
      </header>

      {notification && (
        <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-secondary p-5 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-dark mb-1">Status do Motor</p>
          <p className="text-2xl font-bold mb-2">
            {config.enabled ? 'Ativado' : 'Desativado'}
          </p>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              className="h-4 w-4 text-accent bg-primary border-gray-600 focus:ring-accent rounded"
            />
            <span className="text-sm text-gray-200">
              Permitir uso do Motor de Crescimento para todos os usuários com add-on
              ativo.
            </span>
          </label>
        </div>

        <div className="bg-secondary p-5 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-dark mb-1">Usuários com Motor Ativo</p>
          <p className="text-2xl font-bold mb-2">
            {activeAddOnUsers.length} / {config.maxUsersWithAddOn}
          </p>
          <input
            type="number"
            min={1}
            className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
            value={config.maxUsersWithAddOn}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                maxUsersWithAddOn: Number(e.target.value) || 0
              }))
            }
          />
          <p className="text-xs text-gray-400 mt-1">
            Limite máximo de contas que podem ter o add-on ativo ao mesmo tempo.
          </p>
        </div>

        <div className="bg-secondary p-5 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-dark mb-1">Foco padrão das estratégias</p>
          <select
            value={config.defaultFocus}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                defaultFocus: e.target.value as GrowthEngineGlobalConfig['defaultFocus']
              }))
            }
            className="w-full bg-primary p-2 rounded border border-gray-700 text-sm mb-2"
          >
            <option value="growth">Crescimento de seguidores</option>
            <option value="engagement">Engajamento</option>
            <option value="sales">Vendas e conversões</option>
          </select>
          <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowDemoWithoutApiKey}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  allowDemoWithoutApiKey: e.target.checked
                }))
              }
              className="h-4 w-4 text-accent bg-primary border-gray-600 focus:ring-accent rounded"
            />
            <span className="text-xs text-gray-300">
              Permitir modo DEMO (sem chave Gemini) com limites reduzidos.
            </span>
          </label>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg border border-gray-800 mb-8">
        <h3 className="text-xl font-bold mb-2">Preços do Motor de Crescimento</h3>
        <p className="text-sm text-gray-dark mb-4">
          Defina quanto será cobrado por período do add-on (valores em R$).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-dark mb-1">
              Quinzenal (15 dias)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
              value={pricing.quinzenal}
              onChange={(e) =>
                setPricing((prev) => ({
                  ...prev,
                  quinzenal: Number(e.target.value) || 0
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-dark mb-1">Mensal</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
              value={pricing.mensal}
              onChange={(e) =>
                setPricing((prev) => ({
                  ...prev,
                  mensal: Number(e.target.value) || 0
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-dark mb-1">Anual</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full bg-primary p-2 rounded border border-gray-700 text-sm"
              value={pricing.anual}
              onChange={(e) =>
                setPricing((prev) => ({
                  ...prev,
                  anual: Number(e.target.value) || 0
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg border border-gray-800 mb-8">
        <h3 className="text-xl font-bold mb-2">Regras Globais de Monetização</h3>
        <p className="text-sm text-gray-dark mb-4">
          Defina como a receita do Motor de Crescimento será distribuída pela
          plataforma (ex.: afiliados, marketing, reserva, etc.).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-dark mb-1">
              Percentual reservado (afiliados / marketing / fundos)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={config.revenueSharePercent}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    revenueSharePercent: Number(e.target.value) || 0
                  }))
                }
                className="flex-1"
              />
              <span className="text-sm font-semibold">
                {config.revenueSharePercent}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Este valor é apenas de controle interno para relatórios e não impacta
              diretamente o gateway de pagamento.
            </p>
          </div>
          <div className="bg-primary p-3 rounded-lg text-xs text-gray-300">
            <p className="font-semibold mb-1">Sugestão de uso</p>
            <ul className="list-disc list-inside space-y-1">
              <li>10–20% para afiliados.</li>
              <li>5–10% para tráfego pago / marketing.</li>
              <li>Resto mantido como margem da plataforma.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg border border-gray-800 mb-8">
        <h3 className="text-xl font-bold mb-2">
          Limites por Período do Motor de Crescimento
        </h3>
        <p className="text-sm text-gray-dark mb-4">
          Ajuste quantas gerações por dia e quantos dias futuros cada período do add-on
          pode planejar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { key: 'quinzenal', label: 'Quinzenal (15 dias)' },
              { key: 'mensal', label: 'Mensal' },
              { key: 'anual', label: 'Anual' }
            ] as { key: TierKey; label: string }[]
          ).map((tier) => {
            const limits = config.tiers[tier.key];
            return (
              <div
                key={tier.key}
                className="bg-primary p-4 rounded-lg border border-gray-700"
              >
                <h4 className="font-semibold mb-2">{tier.label}</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Máx. ideias por dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-secondary p-2 rounded border border-gray-700"
                      value={limits.maxIdeasPerDay}
                      onChange={(e) =>
                        handleTierChange(
                          tier.key,
                          'maxIdeasPerDay',
                          Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Máx. roteiros por dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-secondary p-2 rounded border border-gray-700"
                      value={limits.maxScriptsPerDay}
                      onChange={(e) =>
                        handleTierChange(
                          tier.key,
                          'maxScriptsPerDay',
                          Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Quantos dias futuros pode planejar
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-secondary p-2 rounded border border-gray-700"
                      value={limits.maxDaysInAdvance}
                      onChange={(e) =>
                        handleTierChange(
                          tier.key,
                          'maxDaysInAdvance',
                          Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Intensidade da IA (1–10)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={limits.aiIntensity}
                      onChange={(e) =>
                        handleTierChange(
                          tier.key,
                          'aiIntensity',
                          Number(e.target.value) || 1
                        )
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {limits.aiIntensity <= 4
                        ? 'Sugestões mais conservadoras.'
                        : limits.aiIntensity <= 7
                        ? 'Equilíbrio entre segurança e agressividade.'
                        : 'Sugestões mais agressivas e ousadas.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end mb-12">
        <button
          onClick={handleSave}
          className="bg-accent text-light font-semibold py-3 px-8 rounded-full hover:bg-blue-500 transition-colors"
        >
          Salvar Configurações do Motor
        </button>
      </div>
    </>
  );
};

export default AdminGrowthEngineConfigPage;