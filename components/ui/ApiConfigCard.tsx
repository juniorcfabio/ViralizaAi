import React, { useState, useEffect } from 'react';

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

interface Field {
    label: string;
    name: string;
    type: 'text' | 'password';
    placeholder?: string;
}

interface ApiConfigCardProps {
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    configKey: string;
    initialConfig?: any;
    onSave: (key: string, data: any) => void;
    fields: Field[];
    webhookUrl?: string;
}

const ApiConfigCard: React.FC<ApiConfigCardProps> = ({
    title,
    icon: Icon,
    configKey,
    initialConfig,
    onSave,
    fields,
    webhookUrl
}) => {
    // Inicializa o estado já mapeando o formato vindo do backend:
    // { isActive, config: { publicKey, secretKey, ... } }
    const [config, setConfig] = useState(() => {
        if (!initialConfig) return { isActive: false };
        return {
            isActive: initialConfig.isActive ?? false,
            ...(initialConfig.config || {})
        };
    });

    const [copySuccess, setCopySuccess] = useState(false);

    // Quando initialConfig mudar (depois do fetch), sincroniza o estado
    useEffect(() => {
        if (!initialConfig) return;
        setConfig({
            isActive: initialConfig.isActive ?? false,
            ...(initialConfig.config || {})
        });
    }, [initialConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig({ ...config, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSave = () => {
        // Envia de volta no mesmo formato esperado pelo backend:
        // { isActive, config: { ...campos } }
        const { isActive, ...rest } = config;
        onSave(configKey, {
            isActive: !!isActive,
            ...rest
        });
    };

    const handleCopyWebhook = () => {
        if (webhookUrl) {
            navigator.clipboard.writeText(webhookUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <div className="bg-secondary p-6 rounded-lg">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-accent" />
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={config.isActive || false}
                        onChange={handleChange}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    <span className="ml-3 text-sm font-medium">
                        {config.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                </label>
            </div>

            <div
                className={`mt-4 space-y-4 transition-all duration-300 ${
                    config.isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'
                }`}
            >
                {fields.map((field) => (
                    <div key={field.name}>
                        <label className="block text-sm text-gray-dark mb-1">
                            {field.label}
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={config[field.name] || ''}
                            onChange={handleChange}
                            placeholder={field.placeholder || ''}
                            className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                ))}

                {webhookUrl && (
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">
                            URL de Webhook (Somente Leitura)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                value={webhookUrl}
                                className="w-full bg-primary p-2 rounded border border-gray-600 pr-10 text-xs text-gray-400"
                            />
                            <button
                                onClick={handleCopyWebhook}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-dark hover:text-light"
                            >
                                {copySuccess ? (
                                    <span className="text-xs text-green-400">
                                        Copiado!
                                    </span>
                                ) : (
                                    <CopyIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Configure esta URL no painel do seu provedor de pagamento
                            para receber confirmações.
                        </p>
                    </div>
                )}

                <div className="text-right">
                    <button
                        onClick={handleSave}
                        className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors"
                    >
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiConfigCard;