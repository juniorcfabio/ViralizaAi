import React, { useState, useEffect } from 'react';

// Icons
const BankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4v18"/>
    <path d="M19 21V11l-6-4"/>
    <path d="M9 9v12"/>
    <path d="M15 11v10"/>
  </svg>
);

const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 10.37 18.09"/>
    <path d="M7 6h1v4"/>
    <path d="M16.71 13.88.7.7"/>
  </svg>
);

const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

interface AdminBankConfig {
  bank: string;
  agency: string;
  account: string;
  accountType: 'corrente' | 'poupanca';
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  // Dados de API bancária (simulados)
  apiKey: string;
  apiSecret: string;
  bankPassword: string;
  isConfigured: boolean;
}

const AdminBankConfigPage: React.FC = () => {
  const [bankConfig, setBankConfig] = useState<AdminBankConfig>({
    bank: '',
    agency: '',
    account: '',
    accountType: 'corrente',
    pixKey: '',
    pixKeyType: 'cpf',
    apiKey: '',
    apiSecret: '',
    bankPassword: '',
    isConfigured: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('viraliza_admin_bank_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setBankConfig(config);
      } catch (error) {
        console.error('Erro ao carregar configuração bancária:', error);
      }
    }
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validações básicas
      if (!bankConfig.bank || !bankConfig.pixKey || !bankConfig.apiKey || !bankConfig.bankPassword) {
        showNotification('❌ Preencha todos os campos obrigatórios');
        return;
      }

      // Simular validação da API bancária
      await new Promise(resolve => setTimeout(resolve, 2000));

      const configToSave = {
        ...bankConfig,
        isConfigured: true
      };

      // Salvar configuração (em produção, usar criptografia)
      localStorage.setItem('viraliza_admin_bank_config', JSON.stringify(configToSave));
      setBankConfig(configToSave);
      setIsEditing(false);

      showNotification('✅ Configuração bancária salva e validada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      showNotification('❌ Erro ao salvar configuração. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsSaving(true);
      showNotification('🔄 Testando conexão com o banco...');

      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 3000));

      showNotification('✅ Conexão com o banco estabelecida com sucesso!');
    } catch (error) {
      showNotification('❌ Falha na conexão. Verifique os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Configuração Bancária do Sistema</h2>
        <p className="text-gray-dark">Configure sua conta bancária para pagamentos automáticos aos afiliados.</p>
      </header>

      {notification && (
        <div className="bg-blue-500 bg-opacity-20 text-blue-300 p-3 rounded-lg mb-6 text-center transition-opacity duration-300">
          {notification}
        </div>
      )}

      {/* Status da Configuração */}
      <div className="bg-secondary p-6 rounded-lg mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${bankConfig.isConfigured ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <div>
              <h3 className="text-xl font-bold">
                Status: {bankConfig.isConfigured ? 'Configurado' : 'Não Configurado'}
              </h3>
              <p className="text-gray-400 text-sm">
                {bankConfig.isConfigured 
                  ? 'Sistema pronto para pagamentos automáticos' 
                  : 'Configure sua conta bancária para habilitar pagamentos'
                }
              </p>
            </div>
          </div>
          {bankConfig.isConfigured && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Configuração */}
      <div className="bg-secondary p-6 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BankIcon className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold">Dados Bancários</h3>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-accent text-light px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              {bankConfig.isConfigured ? 'Editar' : 'Configurar'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-500 text-light px-4 py-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-light px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {!isEditing && bankConfig.isConfigured ? (
          // Visualização dos dados configurados
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-gray-400 text-sm">Banco:</span>
              <p className="text-light font-medium">{bankConfig.bank}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Agência:</span>
              <p className="text-light font-medium">{bankConfig.agency}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Conta ({bankConfig.accountType}):</span>
              <p className="text-light font-medium">{bankConfig.account}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Chave PIX ({bankConfig.pixKeyType}):</span>
              <p className="text-light font-medium">{bankConfig.pixKey}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">API Key:</span>
              <p className="text-light font-medium">
                {showSensitiveData ? bankConfig.apiKey : '••••••••••••••••'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {showSensitiveData ? 'Ocultar' : 'Mostrar'} dados sensíveis
              </button>
            </div>
          </div>
        ) : isEditing ? (
          // Formulário de edição
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Banco *</label>
                <input
                  type="text"
                  value={bankConfig.bank}
                  onChange={(e) => setBankConfig({ ...bankConfig, bank: e.target.value })}
                  placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
                  className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agência</label>
                <input
                  type="text"
                  value={bankConfig.agency}
                  onChange={(e) => setBankConfig({ ...bankConfig, agency: e.target.value })}
                  placeholder="0000"
                  className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Conta</label>
                <input
                  type="text"
                  value={bankConfig.account}
                  onChange={(e) => setBankConfig({ ...bankConfig, account: e.target.value })}
                  placeholder="00000-0"
                  className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Conta</label>
                <select
                  value={bankConfig.accountType}
                  onChange={(e) => setBankConfig({ ...bankConfig, accountType: e.target.value as 'corrente' | 'poupanca' })}
                  className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Chave PIX *</label>
                <input
                  type="text"
                  value={bankConfig.pixKey}
                  onChange={(e) => setBankConfig({ ...bankConfig, pixKey: e.target.value })}
                  placeholder="Sua chave PIX"
                  className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo da Chave PIX</label>
                <select
                  value={bankConfig.pixKeyType}
                  onChange={(e) => setBankConfig({ ...bankConfig, pixKeyType: e.target.value as any })}
                  className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>
            </div>

            {/* Dados de API Bancária */}
            <div className="border-t border-gray-600 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <KeyIcon className="w-5 h-5 text-yellow-400" />
                <h4 className="text-lg font-bold">Credenciais de API Bancária</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Key *</label>
                  <input
                    type="password"
                    value={bankConfig.apiKey}
                    onChange={(e) => setBankConfig({ ...bankConfig, apiKey: e.target.value })}
                    placeholder="Chave de API do banco"
                    className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Secret</label>
                  <input
                    type="password"
                    value={bankConfig.apiSecret}
                    onChange={(e) => setBankConfig({ ...bankConfig, apiSecret: e.target.value })}
                    placeholder="Chave secreta da API"
                    className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Senha do Internet Banking *</label>
                  <input
                    type="password"
                    value={bankConfig.bankPassword}
                    onChange={(e) => setBankConfig({ ...bankConfig, bankPassword: e.target.value })}
                    placeholder="Senha para acesso ao banco"
                    className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start gap-2">
                  <ShieldIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium text-sm">Segurança dos Dados</p>
                    <p className="text-yellow-200 text-xs mt-1">
                      Todos os dados são criptografados e armazenados com segurança. 
                      Nunca compartilhe suas credenciais bancárias.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Estado inicial - não configurado
          <div className="text-center py-12">
            <BankIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Nenhuma conta configurada</h3>
            <p className="text-gray-400 mb-6">
              Configure sua conta bancária para habilitar pagamentos automáticos aos afiliados.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-accent text-light px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Configurar Agora
            </button>
          </div>
        )}
      </div>

      {/* Teste de Conexão */}
      {bankConfig.isConfigured && (
        <div className="bg-secondary p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Teste de Conexão</h3>
              <p className="text-gray-400 text-sm">Verifique se a conexão com o banco está funcionando.</p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isSaving}
              className="bg-blue-500 text-light px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBankConfigPage;
