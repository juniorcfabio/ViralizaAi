import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutopilotActionLog } from '../../types';
import { generateAutopilotAction } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import FeatureLockedOverlay from '../ui/FeatureLockedOverlay';

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

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const platformIcons: { [key: string]: React.FC<any> } = {
  X: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  LinkedIn: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Blog: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4z" />
      <path d="M12 6v12" />
    </svg>
  ),
  TikTok: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ),
  Sistema: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
};

const ViralizaAutopilotPage: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [actionLogs, setActionLogs] = useState<AutopilotActionLog[]>([]);
  const intervalRef = useRef<number | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isClient = user?.type === 'client';

  if (isClient && !hasAccess('autopilot')) {
    return (
      <div className="relative h-full">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Piloto Automático Viraliza.ai</h2>
          <p className="text-gray-dark">A IA de marketing que promove sua marca 24/7.</p>
        </header>
        <FeatureLockedOverlay
          featureName="Piloto Automático (Autopromoção)"
          requiredPlan="Plano Anual"
        />
      </div>
    );
  }

  const autopilotTargetName = isClient
    ? user?.socialAccounts && user.socialAccounts.length > 0
      ? `@${user.socialAccounts[0].username}`
      : user?.name
    : 'Viraliza.ai';

  const autopilotDescription = isClient
    ? `A IA de marketing que promove o ${autopilotTargetName} 24/7.`
    : `A IA de marketing que promove o Viraliza.ai 24/7.`;

  const runAutopilot = async () => {
    const businessInfoForAI = isClient ? user?.businessInfo : undefined;
    if (isClient && !businessInfoForAI) {
      return;
    }

    const actionData = await generateAutopilotAction(businessInfoForAI);
    const newLog: AutopilotActionLog = {
      ...actionData,
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'Executado'
    };
    setActionLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    if (isActive) {
      runAutopilot();
      intervalRef.current = window.setInterval(runAutopilot, 10000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, user]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [actionLogs]);

  const getPlatformIcon = (platform: string) => {
    const Icon = platformIcons[platform];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  const canActivate = !isClient || (isClient && user?.businessInfo);

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Piloto Automático Viraliza.ai</h2>
        <p className="text-gray-dark">{autopilotDescription}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-secondary p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <RocketIcon className="w-6 h-6 text-accent" /> Status do Piloto
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => canActivate && setIsActive(e.target.checked)}
                  className="sr-only peer"
                  disabled={!canActivate}
                />
                <div
                  className={`w-11 h-6 bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    canActivate ? 'peer-checked:bg-accent' : 'bg-gray-700'
                  }`}
                ></div>
              </label>
            </div>
            <p
              className={`mt-2 font-semibold text-lg ${
                isActive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isActive ? 'Ativo e Promovendo' : 'Inativo'}
            </p>
            <p className="text-sm text-gray-dark mt-4">
              Quando ativo, a IA executa autonomamente ações de marketing para aumentar a
              visibilidade e atrair novos clientes. Novas ações são geradas a cada 10
              segundos.
            </p>
            {!canActivate && (
              <div className="mt-4 p-3 bg-yellow-500/10 text-yellow-300 text-sm rounded-lg border border-yellow-500/30 flex flex-col items-center text-center">
                <p>Por favor, preencha a descrição do seu negócio para ativar o Piloto Automático.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-3 bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 text-xs"
                >
                  Ir para o Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Fluxo de Atividade em Tempo Real</h3>
            <div
              ref={logsContainerRef}
              className="bg-primary p-4 rounded-lg h-[60vh] max-h-[500px] overflow-y-auto flex flex-col-reverse"
            >
              <div className="space-y-4">
                {!isActive && actionLogs.length === 0 && (
                  <p className="text-center text-gray-dark p-8">
                    {canActivate
                      ? 'Ative o piloto para iniciar o marketing autônomo.'
                      : 'Preencha os dados do seu negócio no Dashboard.'}
                  </p>
                )}
                {actionLogs.map((log) => (
                  <div key={log.id} className="animate-fade-in-right">
                    <div className="flex items-center justify-between text-xs text-gray-dark">
                      <div className="flex items-center gap-2 font-mono">
                        {getPlatformIcon(log.platform)} {log.platform} &middot; {log.action}
                      </div>
                      <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg mt-1 text-sm text-gray-light whitespace-pre-line">
                      {log.content}
                      {log.link && (
                        <div className="mt-2 text-right">
                          <a
                            href={log.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                          >
                            Abrir ação simulada
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 flex items-center gap-1 float-right">
                        <CheckCircleIcon className="w-3 h-3" /> {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViralizaAutopilotPage;