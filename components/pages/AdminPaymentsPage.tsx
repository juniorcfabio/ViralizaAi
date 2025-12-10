import React, { useState, useEffect } from 'react';
import ApiConfigCard from '../ui/ApiConfigCard';

// Icons
const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const PixIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.83 7.83 11 4h2l3.17 3.17"/><path d="m16.17 7.83 3.17 3.17-2.34 2.34-3.17-3.17"/><path d="m4 11 3.17 3.17-3.17 3.17-2.34-2.34"/><path d="m7.83 16.17 3.17 3.17h2l3.17-3.17-2.34-2.34-3.17 3.17-3.17-3.17Z"/></svg>;
const PayPalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 7.5a1.5 1.5 0 0 1-1-2.6 3 3 0 0 0-4-3.3 2 2 0 0 0-2.3 1.2A2.5 2.5 0 0 0 5 6.5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2z"/><path d="m3.5 11.5 3 8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l3-8a1 1 0 0 0-1-1h-14a1 1 0 0 0-1 1z"/></svg>;
const BitcoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.7679 19.2321C14.2835 21.7477 18.2819 21.7477 20.7975 19.2321C23.3131 16.7165 23.3131 12.7181 20.7975 10.2025L13.7975 3.2025C11.2819 0.686906 7.28347 0.686906 4.76787 3.2025C2.25228 5.7181 2.25228 9.71653 4.76787 12.2321L11.7679 19.2321Z"/><path d="M15 5H9"/><path d="M12 2v20"/></svg>;

// Base da API do backend NestJS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const AdminPaymentsPage: React.FC = () => {
    const [configs, setConfigs] = useState<Record<string, any>>({
        stripe: null,
        paypal: null,
        pix: null,
        crypto: null
    });
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/payment-configs`);
                if (!res.ok) {
                    throw new Error(`Erro ao carregar configs: ${res.status}`);
                }
                const data = await res.json();
                setConfigs(data || {});
            } catch (error) {
                console.error('Erro ao carregar configs de pagamento:', error);
                setNotification('Não foi possível carregar as configurações de pagamento do servidor.');
                setTimeout(() => setNotification(''), 3000);
            }
        };

        loadConfigs();
    }, []);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleSaveConfig = async (key: string, data: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/payment-configs/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isActive: data.isActive ?? false,
                    config: data
                })
            });

            if (!res.ok) {
                throw new Error(`Erro ao salvar config da ${key}: ${res.status}`);
            }

            const saved = await res.json();

            const newConfigs = { ...configs, [key]: saved };
            setConfigs(newConfigs);

            showNotification(`Configurações da ${key} salvas com sucesso!`);
        } catch (error) {
            console.error(error);
            showNotification(`Não foi possível salvar as configurações da ${key}.`);
        }
    };

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Configuração de Pagamentos</h2>
                <p className="text-gray-dark">Gerencie as integrações com os provedores de pagamento.</p>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ApiConfigCard
                    title="Stripe (Cartões de Crédito)"
                    icon={CreditCardIcon}
                    configKey="stripe"
                    initialConfig={configs.stripe}
                    onSave={handleSaveConfig}
                    fields={[
                        { label: 'Chave Publicável', name: 'publicKey', type: 'text' },
                        { label: 'Chave Secreta', name: 'secretKey', type: 'password' }
                    ]}
                    webhookUrl={`${window.location.origin}/api/webhooks/stripe`}
                />
                <ApiConfigCard
                    title="PayPal"
                    icon={PayPalIcon}
                    configKey="paypal"
                    initialConfig={configs.paypal}
                    onSave={handleSaveConfig}
                    fields={[
                        { label: 'Client ID', name: 'clientId', type: 'text' },
                        { label: 'Client Secret', name: 'clientSecret', type: 'password' }
                    ]}
                    webhookUrl={`${window.location.origin}/api/webhooks/paypal`}
                />
                 <ApiConfigCard
                    title="PIX"
                    icon={PixIcon}
                    configKey="pix"
                    initialConfig={configs.pix}
                    onSave={handleSaveConfig}
                    fields={[
                        { label: 'Chave PIX', name: 'pixKey', type: 'text', placeholder: 'Email, CPF/CNPJ ou chave aleatória' }
                    ]}
                />
                <ApiConfigCard
                    title="Criptomoedas (ERC-20)"
                    icon={BitcoinIcon}
                    configKey="crypto"
                    initialConfig={configs.crypto}
                    onSave={handleSaveConfig}
                    fields={[
                        { label: 'Endereço da Carteira', name: 'walletAddress', type: 'text', placeholder: '0x...' }
                    ]}
                />
            </div>
        </>
    );
};

export default AdminPaymentsPage;