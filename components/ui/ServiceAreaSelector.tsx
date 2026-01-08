import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface ServiceArea {
  type: 'neighborhood' | 'city' | 'state' | 'country' | 'worldwide';
  value: string;
  display: string;
}

const ServiceAreaSelector: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [selectedAreas, setSelectedAreas] = useState<ServiceArea[]>([]);
  const [newArea, setNewArea] = useState<ServiceArea>({
    type: 'city',
    value: '',
    display: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Carregar áreas salvas do usuário
    if (user?.serviceAreas) {
      setSelectedAreas(user.serviceAreas);
    }
  }, [user]);

  const areaTypes = [
    { value: 'neighborhood', label: '🏘️ Bairro', placeholder: 'Ex: Vila Madalena, Copacabana' },
    { value: 'city', label: '🏙️ Cidade', placeholder: 'Ex: São Paulo, Rio de Janeiro' },
    { value: 'state', label: '🗺️ Estado', placeholder: 'Ex: São Paulo, Rio de Janeiro' },
    { value: 'country', label: '🌍 País', placeholder: 'Ex: Brasil, Argentina' },
    { value: 'worldwide', label: '🌐 Mundial', placeholder: 'Atendimento global' }
  ];

  const addArea = () => {
    if (!newArea.value.trim()) return;

    const area: ServiceArea = {
      ...newArea,
      display: newArea.value
    };

    const updatedAreas = [...selectedAreas, area];
    setSelectedAreas(updatedAreas);
    
    // Salvar no perfil do usuário
    updateUser({
      serviceAreas: updatedAreas
    });

    setNewArea({ type: 'city', value: '', display: '' });
  };

  const removeArea = (index: number) => {
    const updatedAreas = selectedAreas.filter((_, i) => i !== index);
    setSelectedAreas(updatedAreas);
    
    updateUser({
      serviceAreas: updatedAreas
    });
  };

  const getAreaIcon = (type: string) => {
    switch (type) {
      case 'neighborhood': return '🏘️';
      case 'city': return '🏙️';
      case 'state': return '🗺️';
      case 'country': return '🌍';
      case 'worldwide': return '🌐';
      default: return '📍';
    }
  };

  const getAreaTypeLabel = (type: string) => {
    const areaType = areaTypes.find(t => t.value === type);
    return areaType?.label || type;
  };

  return (
    <div className="bg-secondary rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">📍 Área de Atendimento</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditing ? '✅ Concluir' : '✏️ Editar'}
        </button>
      </div>

      {/* Áreas Selecionadas */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">Suas Áreas de Atendimento:</h4>
        
        {selectedAreas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">🗺️</div>
            <p>Nenhuma área de atendimento configurada</p>
            <p className="text-sm mt-2">Adicione áreas para melhorar seu direcionamento</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {selectedAreas.map((area, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-primary/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getAreaIcon(area.type)}</span>
                  <div>
                    <div className="text-white font-semibold">{area.display}</div>
                    <div className="text-sm text-gray-400">{getAreaTypeLabel(area.type)}</div>
                  </div>
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => removeArea(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adicionar Nova Área */}
      {isEditing && (
        <div className="bg-primary/30 rounded-xl p-6 border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-4">➕ Adicionar Nova Área</h4>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Tipo de Área
              </label>
              <select
                value={newArea.type}
                onChange={(e) => setNewArea(prev => ({ 
                  ...prev, 
                  type: e.target.value as ServiceArea['type'],
                  value: e.target.value === 'worldwide' ? 'Mundial' : ''
                }))}
                className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {areaTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Nome da Área
              </label>
              <input
                type="text"
                value={newArea.value}
                onChange={(e) => setNewArea(prev => ({ ...prev, value: e.target.value }))}
                placeholder={areaTypes.find(t => t.value === newArea.type)?.placeholder || ''}
                disabled={newArea.type === 'worldwide'}
                className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={addArea}
            disabled={!newArea.value.trim() && newArea.type !== 'worldwide'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➕ Adicionar Área
          </button>
        </div>
      )}

      {/* Dicas */}
      <div className="mt-8 bg-blue-900/30 rounded-xl p-6 border border-blue-500/30">
        <h4 className="text-lg font-semibold text-blue-400 mb-3">💡 Dicas para Otimização</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• <strong>Bairros:</strong> Ideal para negócios locais (restaurantes, salões)</li>
          <li>• <strong>Cidades:</strong> Perfeito para serviços urbanos (delivery, consultorias)</li>
          <li>• <strong>Estados:</strong> Ótimo para e-commerce e serviços digitais</li>
          <li>• <strong>País/Mundial:</strong> Para negócios online e produtos digitais</li>
          <li>• <strong>Múltiplas áreas:</strong> Aumente seu alcance e segmentação</li>
        </ul>
      </div>

      {/* Estatísticas */}
      {selectedAreas.length > 0 && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-green-900/30 rounded-xl p-6 text-center border border-green-500/30">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {selectedAreas.length}
            </div>
            <div className="text-sm text-gray-300">Áreas Configuradas</div>
          </div>
          
          <div className="bg-blue-900/30 rounded-xl p-6 text-center border border-blue-500/30">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              +{selectedAreas.length * 25}%
            </div>
            <div className="text-sm text-gray-300">Alcance Estimado</div>
          </div>
          
          <div className="bg-purple-900/30 rounded-xl p-6 text-center border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              +{selectedAreas.length * 15}%
            </div>
            <div className="text-sm text-gray-300">Conversões Esperadas</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAreaSelector;
