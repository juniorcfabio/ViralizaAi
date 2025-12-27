
import React, { useState, useEffect } from 'react';
import { TrustedCompany } from '../../types';
import { getTrustedCompaniesDB, addTrustedCompanyDB, updateTrustedCompanyDB, deleteTrustedCompanyDB } from '../../services/dbService';

// Icons
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

const TrustedCompanyModal: React.FC<{ company: TrustedCompany | null, onClose: () => void, onSave: () => void }> = ({ company, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<TrustedCompany>>({
        name: '',
        url: '',
        status: 'Active'
    });

    useEffect(() => {
        if (company) {
            setFormData(company);
        }
    }, [company]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.url) {
            alert('Nome e URL são obrigatórios.');
            return;
        }

        const companyData = {
            ...formData,
            id: company ? company.id : `tc_${Date.now()}`,
        } as TrustedCompany;

        if (company) {
            await updateTrustedCompanyDB(companyData);
        } else {
            await addTrustedCompanyDB(companyData);
        }
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative border border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">{company ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">Nome da Empresa</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Ex: Visionary" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">URL do Site/Rede Social</label>
                        <input required type="text" name="url" value={formData.url} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                            <option value="Active">Ativa</option>
                            <option value="Inactive">Inativa</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500 transition-colors">
                        Salvar Empresa
                    </button>
                </form>
            </div>
        </div>
    );
};

const AdminTrustedCompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<TrustedCompany[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<TrustedCompany | null>(null);

    const loadCompanies = async () => {
        setIsLoading(true);
        const data = await getTrustedCompaniesDB();
        setCompanies(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover esta empresa da lista?')) {
            await deleteTrustedCompanyDB(id);
            loadCompanies();
        }
    };

    const handleEdit = (company: TrustedCompany) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCompany(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        loadCompanies();
    };

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold">Empresas Parceiras (Rodapé)</h2>
                    <p className="text-gray-dark">Gerencie as logos que aparecem na seção "Confiado por Empresas Globais".</p>
                </div>
                <button onClick={handleAdd} className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Adicionar Empresa
                </button>
            </header>

            <div className="bg-secondary p-6 rounded-lg">
                {isLoading ? (
                    <div className="text-center p-8">Carregando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-primary text-gray-dark text-sm uppercase">
                                <tr>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">URL de Destino</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center p-8 text-gray-dark">Nenhuma empresa cadastrada.</td>
                                    </tr>
                                )}
                                {companies.map(company => (
                                    <tr key={company.id} className="border-b border-primary hover:bg-primary/50 transition-colors">
                                        <td className="p-4 font-bold">{company.name}</td>
                                        <td className="p-4">
                                            <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{company.url}</a>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${company.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {company.status === 'Active' ? 'Ativa' : 'Inativa'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleEdit(company)} className="text-blue-400 hover:text-blue-300 mr-3"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(company.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && <TrustedCompanyModal company={editingCompany} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </>
    );
};

export default AdminTrustedCompaniesPage;
