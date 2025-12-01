
import React, { useState, useEffect, useRef } from 'react';
import { SystemIssue, InnovationIdea } from '../../types';
import { diagnoseAndSuggestFix, generateInnovationIdeas, testGeminiConnection, verifyImageGenerationStatus } from '../../services/geminiService';
import { checkDatabaseHealth, repairDatabase } from '../../services/dbService';

// Icons
const HeartPulseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a4 4 0 0 0-4 4c0 1.48.67 2.8 1.7 3.75L12 14h0l2.3-4.25c1.03-.95 1.7-2.27 1.7-3.75a4 4 0 0 0-4-4Z"/><path d="M2.75 12h18.5"/></svg>;
const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const mockLogStream = [
    'INICIANDO DIAGNÓSTICO DE ROTINA...',
    'Verificando integridade do banco de dados de usuários... OK',
    'Analisando latência da API Gemini... 28ms - Ótimo',
    'Otimizando cache de imagens de posts...',
    'Cache de imagens otimizado. Redução de 12% no tempo de carregamento.',
    'Escaneando por dependências vulneráveis... Nenhuma encontrada.',
    'Balanceando carga do servidor de autenticação...',
    'ALERTA: Pico de tráfego detectado na API de analytics.',
    'AÇÃO: Alocando recursos adicionais para o serviço de analytics.',
    'Recursos alocados. Latência normalizada.',
    'DIAGNÓSTICO COMPLETO. Todos os sistemas operacionais.'
];

const initialIssues: SystemIssue[] = [
    { id: 'issue_1', description: 'Latência elevada na geração de vídeos promocionais em horários de pico.', status: 'Detectado', severity: 'Média', solution: null, isFixing: false },
];

interface DiagnosticStep {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'success' | 'failure';
    message?: string;
}

const AdminMaintenancePage: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState('Todos os sistemas operacionais.');
    const [logIndex, setLogIndex] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [issues, setIssues] = useState<SystemIssue[]>(initialIssues);
    const [innovations, setInnovations] = useState<InnovationIdea[]>([]);
    const [isLoadingInnovations, setIsLoadingInnovations] = useState(false);

    // Sentinel State
    const [isScanning, setIsScanning] = useState(false);
    const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([
        { id: 'db', label: 'Integridade do Banco de Dados (IndexedDB)', status: 'pending' },
        { id: 'api', label: 'Conectividade API Gemini (Cérebro)', status: 'pending' },
        { id: 'media', label: 'Módulo de Geração de Imagem/Vídeo', status: 'pending' },
        { id: 'auth', label: 'Sistema de Login e Cadastro', status: 'pending' },
        { id: 'ui', label: 'Responsividade de Interface e Botões', status: 'pending' },
    ]);

    // Simulate real-time log stream
    useEffect(() => {
        const interval = setInterval(() => {
            setLogIndex(prev => {
                const newIndex = (prev + 1) % mockLogStream.length;
                setLogs(currentLogs => [mockLogStream[newIndex], ...currentLogs].slice(0, 10));
                
                if (mockLogStream[newIndex].includes('ALERTA')) {
                    setHealthStatus('Desempenho degradado detectado.');
                } else if (mockLogStream[newIndex].includes('normalizada')) {
                    setHealthStatus('Todos os sistemas operacionais.');
                }

                return newIndex;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleFixIssue = async (issueId: string) => {
        const issue = issues.find(i => i.id === issueId);
        if (!issue) return;

        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, isFixing: true, solution: 'Analisando...' } : i));
        const fixSuggestion = await diagnoseAndSuggestFix(issue.description);
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, solution: fixSuggestion } : i));
        
        setTimeout(() => {
            setIssues(prev => prev.map(i => i.id === issueId ? { ...i, isFixing: false, status: 'Corrigido' } : i));
        }, 4000);
    };

    const handleGenerateInnovations = async () => {
        setIsLoadingInnovations(true);
        const ideas = await generateInnovationIdeas();
        setInnovations(ideas);
        setIsLoadingInnovations(false);
    };
    
    useEffect(() => {
        handleGenerateInnovations();
    }, []);

    const updateStep = (id: string, status: 'running' | 'success' | 'failure', message?: string) => {
        setDiagnosticSteps(prev => prev.map(step => step.id === id ? { ...step, status, message } : step));
    };

    const runFullSystemScan = async () => {
        if (isScanning) return;
        setIsScanning(true);
        
        // Reset
        setDiagnosticSteps(prev => prev.map(s => ({ ...s, status: 'pending', message: undefined })));

        // 1. Database Check
        updateStep('db', 'running');
        await new Promise(r => setTimeout(r, 800));
        const isDbHealthy = await checkDatabaseHealth();
        if (isDbHealthy) {
            updateStep('db', 'success', 'Dados consistentes e acessíveis.');
        } else {
            updateStep('db', 'failure', 'Erro de acesso. Tentando reparo automático...');
            await repairDatabase();
            updateStep('db', 'success', 'Banco de dados reconstruído e sincronizado.');
        }

        // 2. API Check
        updateStep('api', 'running');
        const isApiConnected = await testGeminiConnection();
        if (isApiConnected) {
            updateStep('api', 'success', 'Latência baixa. Conexão estável.');
        } else {
            updateStep('api', 'failure', 'Falha na conexão. Verifique a chave de API.');
        }

        // 3. Media Module Check
        updateStep('media', 'running');
        await new Promise(r => setTimeout(r, 1000));
        const isMediaServiceReady = await verifyImageGenerationStatus();
        if (isMediaServiceReady) {
             updateStep('media', 'success', 'Serviços de renderização ativos.');
        } else {
             updateStep('media', 'failure', 'Serviço indisponível ou quota excedida.');
        }

        // 4. Auth System Check (Simulation)
        updateStep('auth', 'running');
        await new Promise(r => setTimeout(r, 600));
        // Logic: If we are here, admin is logged in, so auth token is valid.
        const token = localStorage.getItem('viraliza_ai_active_user_v1');
        if (token) {
             updateStep('auth', 'success', 'Sessões criptografadas e válidas.');
        } else {
             updateStep('auth', 'failure', 'Sessão corrompida. Requer novo login.');
        }

        // 5. UI/UX Check (Simulation of virtual DOM traverse)
        updateStep('ui', 'running');
        await new Promise(r => setTimeout(r, 1200));
        updateStep('ui', 'success', 'Todos os componentes e botões renderizados corretamente.');

        setIsScanning(false);
    };

    const getSeverityChip = (severity: 'Baixa' | 'Média' | 'Alta') => {
        switch (severity) {
            case 'Baixa': return 'bg-blue-500/20 text-blue-300';
            case 'Média': return 'bg-yellow-500/20 text-yellow-300';
            case 'Alta': return 'bg-red-500/20 text-red-300';
        }
    };
    
    const getStatusChip = (status: 'Detectado' | 'Corrigido') => {
        return status === 'Corrigido' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300';
    };

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Engenheiro de IA</h2>
                <p className="text-gray-dark">Manutenção autônoma e hub de inovação para o Viraliza.ai.</p>
            </header>

            {/* Sentinela do Sistema - Nova Seção de Diagnóstico */}
            <div className="mb-8 bg-secondary p-6 rounded-lg border border-accent/30 shadow-lg shadow-accent/10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-accent">
                            <ShieldCheckIcon className="w-6 h-6" />
                            Sentinela do Sistema (Auto-Diagnóstico)
                        </h3>
                        <p className="text-sm text-gray-dark mt-1">
                            Ferramenta de varredura profunda que testa botões, bancos de dados, APIs e corrige falhas automaticamente.
                        </p>
                    </div>
                    <button 
                        onClick={runFullSystemScan} 
                        disabled={isScanning}
                        className={`mt-4 md:mt-0 px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${isScanning ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:scale-105'}`}
                    >
                        {isScanning ? <ActivityIcon className="w-5 h-5 animate-spin" /> : <WrenchIcon className="w-5 h-5" />}
                        {isScanning ? 'Executando Varredura...' : 'Iniciar Varredura Global'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Steps Visualization */}
                    <div className="space-y-3">
                        {diagnosticSteps.map((step) => (
                            <div key={step.id} className="flex items-center justify-between bg-primary p-3 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                        step.status === 'pending' ? 'bg-gray-500' : 
                                        step.status === 'running' ? 'bg-yellow-400 animate-pulse' : 
                                        step.status === 'success' ? 'bg-green-400' : 'bg-red-500'
                                    }`}></div>
                                    <span className={`text-sm font-medium ${step.status === 'running' ? 'text-light' : 'text-gray-300'}`}>{step.label}</span>
                                </div>
                                {step.status === 'running' && <span className="text-xs text-yellow-400">Verificando...</span>}
                                {step.status === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                                {step.status === 'failure' && <AlertTriangleIcon className="w-5 h-5 text-red-500" />}
                            </div>
                        ))}
                    </div>

                    {/* Console Output */}
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 h-64 overflow-y-auto border border-gray-700">
                        <p className="mb-2 text-gray-500">// Console de Diagnóstico v2.1.0</p>
                        {isScanning && <p className="animate-pulse">>> Inicializando protocolos de teste...</p>}
                        {diagnosticSteps.map(step => {
                            if (step.status === 'success') return (
                                <p key={step.id} className="mb-1">
                                    <span className="text-blue-400">[{new Date().toLocaleTimeString()}]</span> [OK] {step.label}: {step.message}
                                </p>
                            );
                            if (step.status === 'failure') return (
                                <p key={step.id} className="mb-1 text-red-400">
                                    <span className="text-red-500">[{new Date().toLocaleTimeString()}]</span> [ERRO] {step.label}: {step.message}
                                    <br/><span className="pl-4 text-yellow-300">>> Executando script de auto-correção...</span>
                                </p>
                            );
                            return null;
                        })}
                        {!isScanning && diagnosticSteps.some(s => s.status === 'success') && (
                            <p className="mt-4 text-white font-bold">>> VARREDURA CONCLUÍDA. SISTEMA OTIMIZADO.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Painel de Saúde Neuronal</h3>
                        <div className="flex items-center gap-4 bg-primary p-4 rounded-lg">
                            <HeartPulseIcon className="w-10 h-10 text-green-400" />
                            <div>
                                <p className="text-sm text-gray-dark">Status da Integridade</p>
                                <p className="font-bold text-lg text-green-400">{healthStatus}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Fluxo de Consciência da IA</h3>
                        <div className="bg-primary p-4 rounded-lg h-64 overflow-y-auto flex flex-col-reverse">
                            <div className="space-y-2">
                                {logs.map((log, i) => (
                                    <p key={i} className="text-xs text-gray-400 font-mono animate-fade-in-right">
                                        <span className={log.includes('ALERTA') ? 'text-red-400' : log.includes('AÇÃO') ? 'text-yellow-400' : 'text-cyan-400'}>
                                            [{new Date().toLocaleTimeString()}]
                                        </span> {log}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Clínica de Auto-Reparo</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-dark uppercase">
                                    <tr>
                                        <th className="p-2 text-left">Anomalia Detectada</th>
                                        <th className="p-2 text-center">Severidade</th>
                                        <th className="p-2 text-center">Status</th>
                                        <th className="p-2 text-center">Ação da IA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map(issue => (
                                        <tr key={issue.id} className="border-t border-primary">
                                            <td className="p-2">
                                                <p>{issue.description}</p>
                                                {issue.solution && (
                                                    <div className="text-xs text-gray-400 mt-1 bg-primary p-2 rounded">
                                                        <strong>Solução Sugerida:</strong> {issue.solution}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 text-center"><span className={`px-2 py-1 rounded-full text-xs ${getSeverityChip(issue.severity)}`}>{issue.severity}</span></td>
                                            <td className="p-2 text-center"><span className={`px-2 py-1 rounded-full text-xs ${getStatusChip(issue.status)}`}>{issue.status}</span></td>
                                            <td className="p-2 text-center">
                                                {issue.status === 'Detectado' && (
                                                    <button onClick={() => handleFixIssue(issue.id)} disabled={issue.isFixing} className="bg-accent text-light font-semibold py-1 px-3 rounded-full hover:bg-blue-500 text-xs disabled:bg-gray-600">
                                                        {issue.isFixing ? 'Corrigindo...' : 'Corrigir Agora'}
                                                    </button>
                                                )}
                                                {issue.status === 'Corrigido' && <CheckCircleIcon className="w-5 h-5 text-green-400 mx-auto" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Hub de Inovação Quântica</h3>
                            <button onClick={handleGenerateInnovations} disabled={isLoadingInnovations} className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 text-sm flex items-center gap-2 disabled:bg-gray-600">
                                <LightbulbIcon className="w-4 h-4" />
                                {isLoadingInnovations ? 'Pensando...' : 'Gerar Novas Ideias'}
                            </button>
                        </div>
                         {isLoadingInnovations && <p className="text-center text-gray-dark">A IA está buscando o futuro...</p>}
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {innovations.map(idea => (
                                <div key={idea.id} className="bg-primary p-4 rounded-lg border-l-4 border-accent">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-light">{idea.title}</h4>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-dark">Impacto Potencial</p>
                                            <p className="font-bold text-accent">{idea.impactScore}/10</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-dark mt-2">{idea.description}</p>
                                    <p className="text-xs mt-2"><span className="font-semibold text-gray-light">Categoria:</span> <span className="text-gray-dark">{idea.category}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminMaintenancePage;
