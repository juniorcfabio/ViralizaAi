import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import FeatureLockedOverlay from '../ui/FeatureLockedOverlay';

const ExpandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
  </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC'];

const DEFAULT_ENGAGEMENT_DATA = [{ name: 'Mês 1', rate: 0.5 }];

const DEFAULT_REACH_DATA = [
  { name: 'TikTok', reach: 1250 },
  { name: 'Facebook', reach: 800 },
  { name: 'Instagram', reach: 2300 },
  { name: 'X', reach: 450 },
  { name: 'Pinterest', reach: 600 },
  { name: 'YouTube', reach: 900 },
  { name: 'Telegram', reach: 200 }
];

const DEFAULT_SALES_FUNNEL_DATA = [
  { name: 'Visualizações', value: 15000 },
  { name: 'Cliques no Link', value: 750 },
  { name: 'Vendas', value: 30 }
];

const DEFAULT_POST_REACH_DATA = [
  { name: 'Dica de Verão', reach: 1200 },
  { name: 'Tutorial Rápido', reach: 980 },
  { name: 'Bastidores', reach: 1500 },
  { name: 'Promoção Especial', reach: 2100 }
];

const DEFAULT_CAMPAIGN_PERFORMANCE_DATA = [
  { name: 'Lançamento Verão', engagement: 400 },
  { name: 'Dia das Mães', engagement: 300 },
  { name: 'Black Friday', engagement: 500 }
];

const AnalyticsPage: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [isReachChartModalOpen, setIsReachChartModalOpen] = useState(false);

  const [engagementData, setEngagementData] = useState<{ name: string; rate: number }[]>([]);
  const [reachData, setReachData] = useState<{ name: string; reach: number }[]>([]);
  const [salesFunnelData, setSalesFunnelData] = useState<{ name: string; value: number }[]>([]);
  const [postReachData, setPostReachData] = useState<{ name: string; reach: number }[]>([]);
  const [campaignPerformanceData, setCampaignPerformanceData] = useState<
    { name: string; engagement: number }[]
  >([]);

  useEffect(() => {
    if (!user || !hasAccess('analytics')) {
      setEngagementData([]);
      setReachData([]);
      setSalesFunnelData([]);
      setPostReachData([]);
      setCampaignPerformanceData([]);
      return;
    }

    const dataKey = `viraliza_analytics_data_${user.id}`;
    const storedData = localStorage.getItem(dataKey);

    if (storedData) {
      try {
        const data = JSON.parse(storedData);

        const safeEngagement =
          Array.isArray(data.engagementData) && data.engagementData.length > 0
            ? data.engagementData
            : DEFAULT_ENGAGEMENT_DATA;

        const safeReach =
          Array.isArray(data.reachData) && data.reachData.length > 0
            ? data.reachData
            : DEFAULT_REACH_DATA;

        const safeFunnel =
          Array.isArray(data.salesFunnelData) && data.salesFunnelData.length > 0
            ? data.salesFunnelData
            : DEFAULT_SALES_FUNNEL_DATA;

        const safePostReach =
          Array.isArray(data.postReachData) && data.postReachData.length > 0
            ? data.postReachData
            : DEFAULT_POST_REACH_DATA;

        const safeCampaign =
          Array.isArray(data.campaignPerformanceData) && data.campaignPerformanceData.length > 0
            ? data.campaignPerformanceData
            : DEFAULT_CAMPAIGN_PERFORMANCE_DATA;

        setEngagementData(safeEngagement);
        setReachData(safeReach);
        setSalesFunnelData(safeFunnel);
        setPostReachData(safePostReach);
        setCampaignPerformanceData(safeCampaign);
      } catch {
        setEngagementData(DEFAULT_ENGAGEMENT_DATA);
        setReachData(DEFAULT_REACH_DATA);
        setSalesFunnelData(DEFAULT_SALES_FUNNEL_DATA);
        setPostReachData(DEFAULT_POST_REACH_DATA);
        setCampaignPerformanceData(DEFAULT_CAMPAIGN_PERFORMANCE_DATA);
      }
    } else {
      setEngagementData(DEFAULT_ENGAGEMENT_DATA);
      setReachData(DEFAULT_REACH_DATA);
      setSalesFunnelData(DEFAULT_SALES_FUNNEL_DATA);
      setPostReachData(DEFAULT_POST_REACH_DATA);
      setCampaignPerformanceData(DEFAULT_CAMPAIGN_PERFORMANCE_DATA);
    }

    const interval = setInterval(() => {
      setEngagementData((prev) => {
        if (prev.length === 0) return DEFAULT_ENGAGEMENT_DATA;
        const lastRate = prev[prev.length - 1].rate;
        const newRate = Math.min(8.0, lastRate + Math.random() * 0.2);
        const newPoint = {
          name: `Mês ${prev.length + 1}`,
          rate: parseFloat(newRate.toFixed(2))
        };
        return [...prev, newPoint].slice(-6);
      });

      setReachData((prev) =>
        (prev.length ? prev : DEFAULT_REACH_DATA)
          .map((item) => ({
            ...item,
            reach: item.reach + Math.floor(Math.random() * (item.name === 'TikTok' ? 150 : 50))
          }))
          .sort((a, b) => b.reach - a.reach)
      );

      setSalesFunnelData((prev) => {
        const base = prev.length ? prev : DEFAULT_SALES_FUNNEL_DATA;
        const views = base[0].value + Math.floor(Math.random() * 2000);
        const clicks = base[1].value + Math.floor(Math.random() * 60);
        const sales = base[2].value + (Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0);
        return [
          { name: 'Visualizações', value: views },
          { name: 'Cliques no Link', value: clicks },
          { name: 'Vendas', value: sales }
        ];
      });

      setPostReachData((prev) =>
        (prev.length ? prev : DEFAULT_POST_REACH_DATA)
          .map((post) => ({
            ...post,
            reach: post.reach + Math.floor(Math.random() * 25)
          }))
          .sort((a, b) => b.reach - a.reach)
      );

      setCampaignPerformanceData((prev) =>
        (prev.length ? prev : DEFAULT_CAMPAIGN_PERFORMANCE_DATA).map((campaign) => ({
          ...campaign,
          engagement: campaign.engagement + Math.floor(Math.random() * 10)
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [user, hasAccess]);

  useEffect(() => {
    if (user && hasAccess('analytics')) {
      const dataKey = `viraliza_analytics_data_${user.id}`;
      const dataToStore = {
        engagementData,
        reachData,
        salesFunnelData,
        postReachData,
        campaignPerformanceData
      };
      localStorage.setItem(dataKey, JSON.stringify(dataToStore));
    }
  }, [
    engagementData,
    reachData,
    salesFunnelData,
    postReachData,
    campaignPerformanceData,
    user,
    hasAccess
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsReachChartModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDownloadCSV = () => {
    const headers = 'Plataforma,Alcance\n';
    const csvContent = reachData.reduce((acc, row) => {
      return acc + `${row.name},${row.reach}\n`;
    }, headers);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'alcance_por_plataforma.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!hasAccess('analytics')) {
    return (
      <div className="relative h-full">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Analytics</h2>
          <p className="text-gray-dark">Análise detalhada do seu desempenho.</p>
        </header>
        <FeatureLockedOverlay featureName="Analytics" requiredPlan="Plano Trimestral" />
      </div>
    );
  }

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Analytics</h2>
        <p className="text-gray-dark">Análise detalhada do seu desempenho.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-secondary p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Taxa de Engajamento Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" unit="%" domain={[0, 8]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                name="Engajamento"
                stroke="#4F46E5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-secondary p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Alcance por Plataforma</h3>
            <button
              onClick={() => setIsReachChartModalOpen(true)}
              className="text-gray-dark hover:text-light transition-colors"
              aria-label="Expandir gráfico"
            >
              <ExpandIcon className="w-5 h-5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reachData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
              <XAxis type="number" stroke="#94A3B8" />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
                formatter={(value) => new Intl.NumberFormat('pt-BR').format(value as number)}
              />
              <Legend />
              <Bar dataKey="reach" name="Alcance" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-secondary p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Funil de Vendas via Links</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesFunnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
                formatter={(value) => new Intl.NumberFormat('pt-BR').format(value as number)}
              />
              <Legend />
              <Bar dataKey="value" name="Usuários">
                {salesFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-secondary p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Alcance por Postagem</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={postReachData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
              <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
                formatter={(value) => new Intl.NumberFormat('pt-BR').format(value as number)}
              />
              <Legend />
              <Bar dataKey="reach" name="Alcance" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-secondary p-6 rounded-lg col-span-1 lg:col-span-2">
          <h3 className="text-xl font-bold mb-4">Desempenho por Campanha (Engajamento)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campaignPerformanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="engagement"
                nameKey="name"
              >
                {campaignPerformanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
                formatter={(value) => new Intl.NumberFormat('pt-BR').format(value as number)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isReachChartModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary rounded-lg shadow-xl w-full max-w-4xl h-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-primary">
              <h2 className="text-xl font-bold text-light">Alcance por Plataforma</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-2 bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors text-sm"
                  aria-label="Baixar dados em CSV"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Baixar CSV</span>
                </button>
                <button
                  onClick={() => setIsReachChartModalOpen(false)}
                  className="text-2xl text-gray-dark hover:text-light"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 p-6" style={{ height: '70vh' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reachData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
                  <XAxis type="number" stroke="#94A3B8" />
                  <YAxis type="category" dataKey="name" stroke="#94A3B8" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
                  />
                  <Legend />
                  <Bar dataKey="reach" name="Alcance" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalyticsPage;