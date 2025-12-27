import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  generateSalesFunnel,
  generateGrowthCampaign,
  analyzeViralTrends,
  optimizeBio,
  generateEditorialCalendar,
  generateHashtagSuggestions,
  predictViralPotential
} from '../../services/geminiService';
import {
  SalesFunnel,
  GrowthCampaign,
  PostIdea,
  LocationConfig,
  ViralTrend,
  BioOptimization,
  EditorialDay,
  HashtagSuggestion,
  ViralPredictionResult
} from '../../types';
import CommentModal from '../ui/CommentModal';
import PaywallModal from '../ui/PaywallModal';
import { useNavigate } from 'react-router-dom';

// Icons
const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z" />
    <path d="m12 15-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57" />
    <path d="m9 12 3 3" />
    <path d="M11.6 7.8c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z" />
    <path d="m19.5 4.5-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57" />
    <path d="m16.5 7.5 3 3" />
  </svg>
);

const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const MessageSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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

const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const HashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const SalesFunnelBlueprint: React.FC<{ funnel: SalesFunnel }> = ({ funnel }) => {
  const getEbookHtml = () => `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${funnel.leadMagnet.title}</title>
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; }
                h1, h2, h3 { color: #2c3e50; }
                .cover { text-align: center; margin-bottom: 60px; page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; }
                .cover img { max-width: 100%; max-height: 500px; border-radius: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); margin-bottom: 30px; }
                .cover h1 { font-size: 3.5em; margin: 0; line-height: 1.2; }
                .cover p { font-size: 1.5em; color: #666; margin-top: 10px; }
                .chapter { margin-bottom: 50px; page-break-before: always; }
                .chapter h2 { border-bottom: 3px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; font-size: 2em; }
                .chapter img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .content { font-size: 1.1em; text-align: justify; }
                .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="cover">
                ${funnel.leadMagnet.coverImage ? `<img src="${funnel.leadMagnet.coverImage}" alt="Capa">` : ''}
                <h1>${funnel.leadMagnet.title}</h1>
                <p>${funnel.leadMagnet.description}</p>
            </div>
            
            ${funnel.leadMagnet.chapters?.map((chapter, idx) => `
                <div class="chapter">
                    <h2>${idx + 1}. ${chapter.title}</h2>
                    ${chapter.image ? `<img src="${chapter.image}" alt="${chapter.title}">` : ''}
                    <div class="content">
                        <p>${chapter.content.replace(/\n/g, '</p><p>')}</p>
                    </div>
                </div>
            `).join('')}
            <div class="footer">
                Material Exclusivo - Gerado por Viraliza.ai
            </div>
        </body>
        </html>
    `;

  const handleDownload = () => {
    const ebookContent = getEbookHtml();
    const blob = new Blob([ebookContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${funnel.leadMagnet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const ebookContent = getEbookHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ebookContent);
      printWindow.document.close();
      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
    }
  };

  return (
    <div className="mt-8 space-y-8 animate-fade-in-up">
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-2xl font-bold text-accent">Isca Digital (Lead Magnet)</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-primary border border-gray-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-700 flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" /> Baixar Arquivo (Offline)
            </button>
            <button
              onClick={handlePrintPdf}
              className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-green-500 flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" /> Visualizar / Gerar PDF
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          {funnel.leadMagnet.coverImage && (
            <div className="w-full md:w-1/3">
              <img src={funnel.leadMagnet.coverImage} alt="Cover" className="rounded-lg shadow-lg w-full" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="text-xl font-bold mb-2">{funnel.leadMagnet.title}</h4>
            <p className="text-gray-300 mb-4">{funnel.leadMagnet.description}</p>
            <div className="space-y-2">
              <h5 className="font-bold text-gray-400 text-sm uppercase">Conteúdo (12 Capítulos Detalhados)</h5>
              <div className="bg-primary p-4 rounded-lg h-64 overflow-y-auto">
                {funnel.leadMagnet.chapters?.map((chapter, idx) => (
                  <div key={idx} className="mb-4 border-b border-gray-700 pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      {chapter.image && (
                        <img
                          src={chapter.image}
                          alt={`Chapter ${idx + 1}`}
                          className="w-16 h-16 rounded object-cover bg-gray-800"
                        />
                      )}
                      <div>
                        <p className="font-bold text-light">
                          {idx + 1}. {chapter.title}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 whitespace-pre-line line-clamp-3">
                          {chapter.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h3 className="text-2xl font-bold text-accent mb-4">Landing Page Copy</h3>
        <div className="space-y-4">
          <div>
            <span className="text-xs text-gray-500 uppercase">Headline</span>
            <p className="text-xl font-bold">{funnel.landingPageCopy.headline}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Corpo</span>
            <p className="text-gray-300 whitespace-pre-line">{funnel.landingPageCopy.body}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Call to Action (CTA)</span>
            <button className="bg-accent text-white px-6 py-3 rounded-full mt-2 font-bold pointer-events-none">
              {funnel.landingPageCopy.cta}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h3 className="text-2xl font-bold text-accent mb-4">Sequência de E-mails</h3>
        <div className="space-y-4">
          {funnel.emailSequence.map((email, idx) => (
            <div key={idx} className="bg-primary p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-500 mb-1">E-mail #{idx + 1}</p>
              <p className="font-bold mb-2">Assunto: {email.subject}</p>
              <div className="text-sm text-gray-300 whitespace-pre-line bg-secondary/50 p-3 rounded">
                {email.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdvancedGrowthTools: React.FC<{ businessInfo: string; checkAccess: () => boolean }> = ({
  businessInfo,
  checkAccess
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [trends, setTrends] = useState<ViralTrend[]>([]);
  const [bio, setBio] = useState<BioOptimization | null>(null);
  const [calendar, setCalendar] = useState<EditorialDay[]>([]);
  const [hashtags, setHashtags] = useState<HashtagSuggestion | null>(null);

  const handleViralTrends = async () => {
    if (!checkAccess()) return;
    setLoading('trends');
    const data = await analyzeViralTrends(businessInfo);
    setTrends(data);
    setLoading(null);
  };

  const handleBioOpt = async () => {
    if (!checkAccess()) return;
    setLoading('bio');
    const data = await optimizeBio(businessInfo, 'Bio atual generica');
    setBio(data);
    setLoading(null);
  };

  const handleCalendar = async () => {
    if (!checkAccess()) return;
    setLoading('calendar');
    const data = await generateEditorialCalendar(businessInfo);
    setCalendar(data);
    setLoading(null);
  };

  const handleHashtags = async () => {
    if (!checkAccess()) return;
    setLoading('hashtags');
    const data = await generateHashtagSuggestions(businessInfo);
    setHashtags(data);
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
      {/* Trends Card */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUpIcon className="w-6 h-6 text-accent" />
          <h3 className="font-bold text-lg">Caçador de Tendências</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4 flex-1">
          Descubra o que está viralizando agora para: {businessInfo || 'seu nicho'}.
        </p>
        <button
          onClick={handleViralTrends}
          disabled={!!loading}
          className="w-full bg-primary border border-accent text-accent font-bold py-2 rounded-lg hover:bg-accent hover:text-white transition-colors mb-4"
        >
          {loading === 'trends' ? 'Analisando...' : 'Buscar Tendências'}
        </button>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {trends.map((t, i) => (
            <div key={i} className="bg-primary p-3 rounded text-sm">
              <span className="text-xs bg-accent/20 text-accent px-2 rounded uppercase">{t.type}</span>
              <p className="font-bold mt-1">{t.title}</p>
              <p className="text-gray-400 text-xs">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bio Card */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <UserCheckIcon className="w-6 h-6 text-green-400" />
          <h3 className="font-bold text-lg">Otimizador de Perfil</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4 flex-1">
          Transforme visitantes em seguidores com uma bio magnética para {businessInfo || 'seu nicho'}.
        </p>
        <button
          onClick={handleBioOpt}
          disabled={!!loading}
          className="w-full bg-primary border border-green-500 text-green-400 font-bold py-2 rounded-lg hover:bg-green-500 hover:text-white transition-colors mb-4"
        >
          {loading === 'bio' ? 'Otimizando...' : 'Gerar Nova Bio'}
        </button>
        {bio && (
          <div className="bg-primary p-3 rounded text-sm space-y-2">
            <p>
              <strong>Nome:</strong> {bio.headline}
            </p>
            <p>
              <strong>Bio:</strong> {bio.body}
            </p>
            <p>
              <strong>CTA:</strong> {bio.cta}
            </p>
            <p className="text-blue-400 text-xs">{bio.linkText}</p>
          </div>
        )}
      </div>

      {/* Calendar Card */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-6 h-6 text-purple-400" />
          <h3 className="font-bold text-lg">Calendário Editorial</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4 flex-1">
          Planejamento de 7 dias focado em {businessInfo || 'seu nicho'} para constância máxima.
        </p>
        <button
          onClick={handleCalendar}
          disabled={!!loading}
          className="w-full bg-primary border border-purple-500 text-purple-400 font-bold py-2 rounded-lg hover:bg-purple-500 hover:text-white transition-colors mb-4"
        >
          {loading === 'calendar' ? 'Planejando...' : 'Criar Calendário'}
        </button>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {calendar.map((c, i) => (
            <div key={i} className="bg-primary p-2 rounded text-xs border-l-2 border-purple-500">
              <div className="flex justify-between">
                <span className="font-bold">{c.day}</span>
                <span className="text-gray-500">{c.format}</span>
              </div>
              <p className="text-gray-300">{c.postIdea}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtag Card */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <HashIcon className="w-6 h-6 text-pink-400" />
          <h3 className="font-bold text-lg">Hashtags Virais</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4 flex-1">
          Grupos de tags otimizados para {businessInfo || 'seu nicho'} com máximo alcance.
        </p>
        <button
          onClick={handleHashtags}
          disabled={!!loading}
          className="w-full bg-primary border border-pink-500 text-pink-400 font-bold py-2 rounded-lg hover:bg-pink-500 hover:text-white transition-colors mb-4"
        >
          {loading === 'hashtags' ? 'Gerando...' : 'Gerar Tags'}
        </button>
        {hashtags && (
          <div className="space-y-2 text-xs bg-primary p-3 rounded overflow-y-auto max-h-60">
            <div>
              <p className="font-bold text-pink-300">Nacionais</p>
              <p className="text-gray-300">{hashtags.national.join(' ')}</p>
            </div>
            <div>
              <p className="font-bold text-blue-300">Globais</p>
              <p className="text-gray-300">{hashtags.global.join(' ')}</p>
            </div>
            <div>
              <p className="font-bold text-green-300">Locais/Nicho</p>
              <p className="text-gray-300">{hashtags.local.join(' ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Ferramentas exclusivas por plano
const PlanExclusiveTools: React.FC<{
  planName?: string;
  businessInfo: string;
  checkAccess: () => boolean;
}> = ({ planName, businessInfo, checkAccess }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [conversionTags, setConversionTags] = useState<HashtagSuggestion | null>(null);
  const [retentionScripts, setRetentionScripts] = useState<string[]>([]);
  const [spyInsights, setSpyInsights] = useState<string[]>([]);
  const [futureTrends, setFutureTrends] = useState<string[]>([]);

  if (!planName) return null;

  const normalized = planName.toLowerCase();
  const isMensal = normalized.includes('mensal');
  const isTrimestral = normalized.includes('trimestral');
  const isSemestral = normalized.includes('semestral');
  const isAnual = normalized.includes('anual');

  const niche = businessInfo || 'seu nicho';

  const handleConversionTags = async () => {
    if (!checkAccess()) return;
    setLoading('conversion');
    const data = await generateHashtagSuggestions(niche);
    setConversionTags(data);
    setLoading(null);
  };

  const handleRetention = async () => {
    if (!checkAccess()) return;
    setLoading('retention');
    const calendar = await generateEditorialCalendar(niche);
    const scripts = calendar.slice(0, 4).map((day, index) => {
      return `Roteiro ${index + 1}: grave um áudio/vídeo curto (${day.format}) contando uma história rápida ligada a "${day.theme}" e finalize com um convite para responder sua caixinha ou Direct.`;
    });
    setRetentionScripts(scripts);
    setLoading(null);
  };

  const handleSpy = async () => {
    if (!checkAccess()) return;
    setLoading('spy');
    const trends = await analyzeViralTrends(niche);
    const insights = trends.map((t, i) => {
      return `Insight ${i + 1}: concorrentes que exploram "${t.title}" estão se destacando. Você pode responder com uma campanha focada em ${t.type.toLowerCase()} mostrando o diferencial da sua oferta.`;
    });
    setSpyInsights(insights);
    setLoading(null);
  };

  const handleFutureTrends = async () => {
    if (!checkAccess()) return;
    setLoading('future');
    const [trends, calendar] = await Promise.all([
      analyzeViralTrends(niche),
      generateEditorialCalendar(niche)
    ]);
    const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const items: string[] = [];

    weeks.forEach((week, index) => {
      const trend = trends[index % trends.length];
      const day = calendar[index % calendar.length];
      items.push(
        `${week}: foco em "${trend.title}" usando formato ${day.format}. Tema sugerido: ${day.theme}. Publicar variações 3x na semana.`
      );
    });

    setFutureTrends(items);
    setLoading(null);
  };

  return (
    <section className="mt-12 space-y-6">
      <div className="flex items-center gap-3">
        <BrainIcon className="w-6 h-6 text-accent" />
        <h3 className="text-xl font-bold">
          Ferramentas Exclusivas do Seu Plano
          {planName && <span className="text-sm text-gray-400 ml-2">({planName})</span>}
        </h3>
      </div>
      <p className="text-sm text-gray-400">
        Estas ferramentas são desbloqueadas de acordo com o seu plano e foram desenhadas para uso
        intenso no Modo Real Produtivo.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isMensal && (
          <div className="bg-secondary p-6 rounded-lg border border-pink-500/60">
            <div className="flex items-center gap-2 mb-3">
              <HashIcon className="w-5 h-5 text-pink-400" />
              <h4 className="font-bold text-lg">Conversion Tags IA (Plano Mensal)</h4>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Gera pacotes de hashtags focados em conversão para {niche}, prontos para copiar e
              colar em cada postagem.
            </p>
            <button
              onClick={handleConversionTags}
              disabled={loading === 'conversion' || !businessInfo.trim()}
              className="w-full bg-pink-500 text-white font-semibold py-2 rounded-full hover:bg-pink-400 disabled:bg-gray-600 text-sm mb-3"
            >
              {loading === 'conversion' ? 'Calculando Conversion Tags...' : 'Gerar Conversion Tags'}
            </button>
            {!businessInfo.trim() && (
              <p className="text-xs text-red-400">Preencha o nicho do negócio acima para usar.</p>
            )}
            {conversionTags && (
              <div className="mt-3 text-xs bg-primary p-3 rounded space-y-2">
                <div>
                  <p className="font-bold text-pink-300">Pacote de Alcance Nacional</p>
                  <p className="text-gray-200 break-words">{conversionTags.national.join(' ')}</p>
                </div>
                <div>
                  <p className="font-bold text-blue-300">Pacote Global</p>
                  <p className="text-gray-200 break-words">{conversionTags.global.join(' ')}</p>
                </div>
                <div>
                  <p className="font-bold text-green-300">Pacote de Nicho/Local</p>
                  <p className="text-gray-200 break-words">{conversionTags.local.join(' ')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isTrimestral && (
          <div className="bg-secondary p-6 rounded-lg border border-green-500/60">
            <div className="flex items-center gap-2 mb-3">
              <MegaphoneIcon className="w-5 h-5 text-green-400" />
            <h4 className="font-bold text-lg">Retention Audio IA (Plano Trimestral)</h4>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Cria roteiros de áudios/vídeos curtos para manter a audiência aquecida toda semana,
              prontos para você gravar.
            </p>
            <button
              onClick={handleRetention}
              disabled={loading === 'retention' || !businessInfo.trim()}
              className="w-full bg-green-500 text-white font-semibold py-2 rounded-full hover:bg-green-400 disabled:bg-gray-600 text-sm mb-3"
            >
              {loading === 'retention' ? 'Gerando roteiros...' : 'Gerar Roteiros de Retenção'}
            </button>
            {!businessInfo.trim() && (
              <p className="text-xs text-red-400">Preencha o nicho do negócio acima para usar.</p>
            )}
            {retentionScripts.length > 0 && (
              <ul className="mt-3 text-xs bg-primary p-3 rounded space-y-2 list-disc pl-4 text-gray-200">
                {retentionScripts.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isSemestral && (
          <div className="bg-secondary p-6 rounded-lg border border-yellow-500/60">
            <div className="flex items-center gap-2 mb-3">
              <LockIcon className="w-5 h-5 text-yellow-300" />
              <h4 className="font-bold text-lg">Espião de Concorrentes IA (Plano Semestral)</h4>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Analisa tendências do nicho e sugere movimentos estratégicos para posicionar sua
              marca acima dos concorrentes.
            </p>
            <button
              onClick={handleSpy}
              disabled={loading === 'spy' || !businessInfo.trim()}
              className="w-full bg-yellow-500 text-black font-semibold py-2 rounded-full hover:bg-yellow-400 disabled:bg-gray-600 text-sm mb-3"
            >
              {loading === 'spy' ? 'Mapeando concorrência...' : 'Gerar Insights de Concorrência'}
            </button>
            {!businessInfo.trim() && (
              <p className="text-xs text-red-400">Preencha o nicho do negócio acima para usar.</p>
            )}
            {spyInsights.length > 0 && (
              <ul className="mt-3 text-xs bg-primary p-3 rounded space-y-2 list-disc pl-4 text-gray-200">
                {spyInsights.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isAnual && (
          <div className="bg-secondary p-6 rounded-lg border border-blue-500/60">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUpIcon className="w-5 h-5 text-blue-400" />
              <h4 className="font-bold text-lg">Radar de Tendências Futuras (Plano Anual)</h4>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Monta um mapa das próximas 4 semanas com foco em temas e formatos com maior
              probabilidade de crescer no seu nicho.
            </p>
            <button
              onClick={handleFutureTrends}
              disabled={loading === 'future' || !businessInfo.trim()}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-full hover:bg-blue-500 disabled:bg-gray-600 text-sm mb-3"
            >
              {loading === 'future' ? 'Calculando radar...' : 'Gerar Radar de Tendências'}
            </button>
            {!businessInfo.trim() && (
              <p className="text-xs text-red-400">Preencha o nicho do negócio acima para usar.</p>
            )}
            {futureTrends.length > 0 && (
              <ul className="mt-3 text-xs bg-primary p-3 rounded space-y-2 list-disc pl-4 text-gray-200">
                {futureTrends.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const ViralPredictionTool: React.FC<{ checkAccess: () => boolean }> = ({ checkAccess }) => {
  const { user, purchaseAddOn, hasAccess } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [result, setResult] = useState<ViralPredictionResult | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const navigate = useNavigate();

  const isLocked = !hasAccess('viralPrediction');

  const handleAnalyze = async () => {
    if (!contentInput.trim()) return;
    setLoading(true);
    const data = await predictViralPotential(contentInput, platform);
    setResult(data);
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!user) return;
    if (window.confirm('Comprar o Add-on "Motor de Previsão Viral" por R$ 99,90?')) {
      setPurchasing(true);
      const success = await purchaseAddOn(user.id, 'viralPrediction', 99.9);
      setPurchasing(false);
      if (success) {
        alert('Compra realizada com sucesso! Acesso liberado.');
      } else {
        alert('Falha na compra. Tente novamente.');
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 5) return 'text-red-500';
    if (score < 8) return 'text-yellow-400';
    return 'text-green-500';
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-secondary p-8 rounded-lg border border-gray-700 relative overflow-hidden">
        {isLocked && (
          <div className="absolute inset-0 bg-secondary/95 z-20 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
            <BrainIcon className="w-16 h-16 text-accent mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-light mb-2">Ferramenta Premium Bloqueada</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              O Motor de Previsão Viral está disponível exclusivamente no <strong>Plano Anual</strong> ou como compra
              avulsa.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => navigate('/dashboard/billing')}
                className="bg-accent text-white font-bold py-3 rounded-full hover:bg-blue-600 transition-all"
              >
                Fazer Upgrade para Anual
              </button>
              <div className="flex items-center gap-2 justify-center text-xs text-gray-500 uppercase font-bold">
                OU
              </div>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="bg-primary border border-gray-600 text-white font-bold py-3 rounded-full hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                {purchasing ? 'Processando...' : 'Comprar Add-on por R$ 99,90'}
              </button>
            </div>
          </div>
        )}

        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BrainIcon className="w-8 h-8 text-accent" /> Previsão de Viralização (IA)
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-dark mb-1">Plataforma de Destino</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none"
            >
              <option>Instagram</option>
              <option>TikTok</option>
              <option>YouTube Shorts</option>
              <option>X (Twitter)</option>
              <option>LinkedIn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-dark mb-1">Ideia ou Rascunho do Conteúdo</label>
            <textarea
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Descreva o vídeo, cole a legenda ou a ideia principal..."
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none h-32 resize-none"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !contentInput.trim()}
            className="w-full bg-accent text-white font-bold py-4 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Analisando Algoritmos...' : 'Prever Potencial Viral'}
          </button>
        </div>
      </div>

      <div className="bg-secondary p-8 rounded-lg border border-gray-700 flex flex-col justify-center items-center text-center min-h-[400px]">
        {!result ? (
          <div className="text-gray-500">
            <TrendingUpIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Os resultados da análise aparecerão aqui.</p>
          </div>
        ) : (
          <div className="w-full animate-fade-in-up">
            <div className="mb-8 relative inline-block">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  className="text-gray-700"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
                <circle
                  className={`${getScoreColor(result.score)} transition-all duration-1000 ease-out`}
                  strokeWidth="10"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * result.score) / 10}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}</span>
                <span className="block text-xs text-gray-400">/10</span>
              </div>
            </div>

            <h4 className="text-2xl font-bold mb-2 text-light">
              Probabilidade: <span className={getScoreColor(result.score)}>{result.viralProbability}</span>
            </h4>

            <div className="text-left mt-8 space-y-4 bg-primary p-6 rounded-lg border border-gray-700">
              <div>
                <h5 className="font-bold text-accent mb-1">Copywriting</h5>
                <p className="text-sm text-gray-300">{result.analysis.copy}</p>
              </div>
              <div>
                <h5 className="font-bold text-purple-400 mb-1">Visual</h5>
                <p className="text-sm text-gray-300">{result.analysis.visuals}</p>
              </div>
              <div>
                <h5 className="font-bold text-green-400 mb-1">Call to Action</h5>
                <p className="text-sm text-gray-300">{result.analysis.cta}</p>
              </div>
            </div>

            <div className="mt-6 text-left">
              <h5 className="font-bold text-light mb-2 flex items-center gap-2">
                <RocketIcon className="w-4 h-4 text-yellow-400" /> Sugestões de Otimização
              </h5>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 text-left bg-primary p-4 rounded-lg border border-gray-700">
              <h5 className="font-bold text-light mb-2">Versão ideal (10/10) da ideia/rascunho</h5>
              <p className="text-sm text-gray-300 whitespace-pre-line">{result.idealContent}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'growth' | 'funnel' | 'advanced' | 'viral'>('growth');
  const navigate = useNavigate();

  const hasActiveSubscription = true;
  const [showPaywall, setShowPaywall] = useState(false);

  const checkAccess = (): boolean => {
    return true;
  };

  const [businessInfo, setBusinessInfo] = useState(user?.businessInfo || '');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('Profissional');

  const [isGeneratingGrowth, setIsGeneratingGrowth] = useState(false);
  const [growthCampaign, setGrowthCampaign] = useState<GrowthCampaign | null>(null);

  const [isGeneratingFunnel, setIsGeneratingFunnel] = useState(false);
  const [salesFunnel, setSalesFunnel] = useState<SalesFunnel | null>(null);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostIdea | null>(null);

  const handleBusinessInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBusinessInfo(e.target.value);
  };

  const handleSaveBusinessInfo = () => {
    if (user) {
      updateUser(user.id, { businessInfo });
    }
  };

  const handleGenerateGrowth = async () => {
    console.log('🚀 handleGenerateGrowth chamado');
    
    if (!checkAccess()) {
      console.log('❌ Acesso negado');
      return;
    }
    
    if (!businessInfo.trim()) {
      console.log('❌ BusinessInfo vazio');
      return;
    }
    
    console.log('✅ Iniciando geração de campanha');
    setIsGeneratingGrowth(true);
    handleSaveBusinessInfo();

    const locationConfig: LocationConfig = { reach: 'National' };

    try {
      console.log('📡 Chamando generateGrowthCampaign...');
      const campaign = await generateGrowthCampaign(businessInfo, platform, tone, locationConfig);
      console.log('✅ Campanha gerada:', campaign);
      setGrowthCampaign(campaign);
    } catch (e) {
      console.error('❌ Erro ao gerar campanha:', e);
    } finally {
      setIsGeneratingGrowth(false);
    }
  };

  const handleGenerateFunnel = async () => {
    console.log('🚀 handleGenerateFunnel chamado');
    
    if (!checkAccess()) {
      console.log('❌ Acesso negado');
      return;
    }
    
    if (!businessInfo.trim()) {
      console.log('❌ BusinessInfo vazio');
      return;
    }
    
    console.log('✅ Iniciando geração de funil');
    setIsGeneratingFunnel(true);
    handleSaveBusinessInfo();

    try {
      const funnel = await generateSalesFunnel(businessInfo);
      setSalesFunnel(funnel);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFunnel(false);
    }
  };

  const openCommentModal = (post: PostIdea) => {
    if (!checkAccess()) return;
    setSelectedPost(post);
    setCommentModalOpen(true);
  };

  const handleAddComment = (text: string) => {
    if (!selectedPost || !growthCampaign) return;

    const updatedPost = {
      ...selectedPost,
      comments: [
        ...(selectedPost.comments || []),
        {
          id: Date.now(),
          author: user?.name || 'Eu',
          text,
          avatar: user?.avatar || 'https://via.placeholder.com/40'
        }
      ]
    };

    const updatedPosts = growthCampaign.posts.map((p) => (p.id === selectedPost.id ? updatedPost : p));
    setGrowthCampaign({ ...growthCampaign, posts: updatedPosts });
    setSelectedPost(updatedPost);
  };

  return (
    <div className="space-y-8">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Painel de Crescimento</h2>
          <p className="text-gray-dark">Sua central de comando para estratégias de marketing com IA.</p>
        </div>
        <div
          onClick={() => navigate('/dashboard/advertise')}
          className="bg-gradient-to-r from-purple-900 to-blue-900 p-3 rounded-lg border border-accent/30 cursor-pointer hover:scale-105 transition-transform flex items-center gap-3 shadow-lg group"
        >
          <div className="bg-accent rounded-full p-2 group-hover:animate-pulse">
            <MegaphoneIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Anuncie Aqui</p>
            <p className="text-xs text-gray-300">Destaque sua marca na Home</p>
          </div>
        </div>
      </header>

      <section className="bg-secondary p-6 rounded-lg border border-gray-800 relative">
        <h3 className="text-xl font-bold mb-4">Sobre o seu Negócio ou Nicho</h3>
        <textarea
          value={businessInfo}
          onChange={handleBusinessInfoChange}
          placeholder='Ex.: "Loja de roupas femininas", "Loja de calçados masculinos", "Clínica de estética facial"...'
          className="w-full bg-primary p-4 rounded-lg border border-gray-700 focus:border-accent focus:ring-1 focus:ring-accent h-24 resize-none"
        />
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-gray-500 mb-1 block">Plataforma</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-primary p-2 rounded border border-gray-700"
            >
              <option>Instagram</option>
              <option>TikTok</option>
              <option>LinkedIn</option>
              <option>YouTube</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-gray-500 mb-1 block">Tom de Voz</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-primary p-2 rounded border border-gray-700"
            >
              <option>Profissional</option>
              <option>Descontraído</option>
              <option>Persuasivo</option>
              <option>Educativo</option>
            </select>
          </div>
        </div>
      </section>

      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('growth')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'growth'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Campanhas (IA)
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'funnel'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Funil de Vendas (IA)
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'advanced'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Crescimento Avançado (IA)
          </button>
          <button
            onClick={() => setActiveTab('viral')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'viral'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-1">
              <BrainIcon className="w-4 h-4" /> Previsão Viral (IA)
            </span>
          </button>
        </nav>
      </div>

      {activeTab === 'growth' && (
        <div className="animate-fade-in-right">
          <button
            onClick={handleGenerateGrowth}
            className="w-full bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <RocketIcon className="w-5 h-5" />{' '}
            {isGeneratingGrowth ? 'Gerando Estratégia...' : 'Gerar Campanha de Crescimento'}
          </button>

          {growthCampaign && (
            <div className="mt-8 space-y-6 animate-fade-in-up">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary p-6 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-bold text-accent mb-2">Persona Alvo</h3>
                  <p className="text-gray-300">{growthCampaign.targetPersona}</p>
                </div>
                <div className="bg-secondary p-6 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-bold text-accent mb-2">Estratégia Principal</h3>
                  <p className="text-gray-300">{growthCampaign.strategy}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-8">Posts Sugeridos</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {growthCampaign.posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-secondary p-6 rounded-lg border border-gray-700 hover:border-accent transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold bg-primary px-2 py-1 rounded uppercase text-gray-400">
                        {post.platform}
                      </span>
                      <button
                        onClick={() => openCommentModal(post)}
                        className="text-gray-400 hover:text-light p-1 rounded hover:bg-primary"
                      >
                        <MessageSquareIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-sm text-gray-300 mb-4 line-clamp-4">{post.content}</p>
                    <div className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-700 flex justify-between">
                      <span>Horário Ideal: {post.optimalTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!growthCampaign && !isGeneratingGrowth && (
            <p className="text-center text-gray-dark mt-8">Preencha a descrição e gere sua campanha.</p>
          )}
        </div>
      )}

      {activeTab === 'funnel' && (
        <div className="animate-fade-in-right">
          <button
            onClick={handleGenerateFunnel}
            className="w-full bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <FilterIcon className="w-5 h-5" />{' '}
            {isGeneratingFunnel
              ? 'Escrevendo Ebook Premium (15 Pág) e criando imagens...'
              : 'Gerar Ebook Premium (15 Páginas + Fotos)'}
          </button>
          {isGeneratingFunnel && (
            <div className="mt-4 text-center animate-pulse bg-blue-900/20 p-4 rounded-lg">
              <p className="text-accent font-bold">A IA está trabalhando...</p>
              <p className="text-sm text-gray-400 mt-1">
                Estamos escrevendo 12 capítulos detalhados e gerando ilustrações exclusivas para cada um. Isso pode
                levar cerca de 40-60 segundos. Por favor, aguarde.
              </p>
            </div>
          )}
          {salesFunnel ? (
            <SalesFunnelBlueprint funnel={salesFunnel} />
          ) : (
            !isGeneratingFunnel && (
              <p className="text-center text-gray-dark mt-8">
                Preencha a descrição para gerar seu funil de alta conversão.
              </p>
            )
          )}
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="animate-fade-in-right">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">Ferramentas de Crescimento Acelerado</h3>
            <p className="text-gray-dark text-sm">Utilize inteligência preditiva e tática para dominar seu nicho.</p>
          </div>
          {businessInfo ? (
            <AdvancedGrowthTools businessInfo={businessInfo} checkAccess={checkAccess} />
          ) : (
            <p className="text-center text-red-400 mt-8">
              Por favor, preencha a descrição do seu negócio acima para usar estas ferramentas.
            </p>
          )}
        </div>
      )}

      {activeTab === 'viral' && (
        <div className="animate-fade-in-right">
          <ViralPredictionTool checkAccess={checkAccess} />
        </div>
      )}

      {/* Ferramentas exclusivas por plano (sempre visíveis, se houver plano) */}
      <PlanExclusiveTools planName={user?.plan} businessInfo={businessInfo} checkAccess={checkAccess} />

      {commentModalOpen && selectedPost && (
        <CommentModal post={selectedPost} onClose={() => setCommentModalOpen(false)} onAddComment={handleAddComment} />
      )}
    </div>
  );
};

export default DashboardPage;