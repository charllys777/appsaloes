
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button, Input, LoadingScreen } from '../components/Shared';
import { LogOut, User, Power, ShieldCheck, Search, Building, UserPlus, X, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';

export const SuperAdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  
  // Create Admin Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchAllProfiles();
      setProfiles(data || []);
      const adminData = await api.fetchAdmins();
      setAdmins(adminData || []);
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      const msg = err.message || "Erro desconhecido";
      if (msg.includes("Failed to fetch")) {
          setError("Erro de Conexão: Não foi possível contatar o servidor. Verifique sua internet ou se o projeto Supabase está ativo.");
      } else {
          setError(`Erro ao carregar dados: ${msg}`);
      }
      // Keep empty state to prevent crash
      setProfiles([]);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleToggleStatus = async (profile: any) => {
    try {
      const newStatus = await api.toggleProfileStatus(profile.id, profile.status || 'active');
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, status: newStatus } : p));
    } catch (error) {
      alert("Erro ao atualizar status. Verifique se você tem permissão ou conexão.");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreatingAdmin(true);
      try {
          await api.createSuperAdminUser(newAdminEmail, newAdminPassword, newAdminName);
          alert("Novo Super Admin criado com sucesso! Você foi desconectado para que o novo usuário seja registrado. Por favor, faça login novamente.");
          window.location.reload(); // Force reload to clear session and go to login
      } catch (error: any) {
          alert("Erro ao criar admin: " + error.message);
          setCreatingAdmin(false);
      }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.specialization && p.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-stone-100 font-sans pb-10">
      <div className="bg-stone-900 text-white p-6 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
             <ShieldCheck className="text-emerald-400" size={32} />
             <div>
                 <h1 className="text-xl font-bold">Super Admin</h1>
                 <p className="text-xs text-stone-400 uppercase tracking-widest">Painel de Controle</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchProfiles} className="flex items-center gap-2 text-xs font-bold uppercase bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">
                <RefreshCw size={16} /> Atualizar
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold uppercase bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">
                <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Error Banner */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center text-center animate-fade-in">
                <WifiOff size={48} className="text-red-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">Falha na Comunicação</h3>
                <p className="text-sm mb-6 max-w-md">{error}</p>
                <div className="flex gap-4">
                    <button onClick={fetchProfiles} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                        Tentar Novamente
                    </button>
                    <a href="https://status.supabase.com/" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors">
                        Verificar Status Supabase
                    </a>
                </div>
            </div>
        )}

        {/* Normal Content (Only if no critical error prevents rendering tabs, or shows tabs with empty data) */}
        {!error && (
          <>
            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-stone-200 pb-2">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`text-sm font-bold uppercase pb-2 transition-colors ${activeTab === 'users' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    Gerenciar Usuários
                </button>
                <button 
                    onClick={() => setActiveTab('admins')}
                    className={`text-sm font-bold uppercase pb-2 transition-colors ${activeTab === 'admins' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    Gerenciar Admins
                </button>
            </div>

            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                            <h3 className="text-xs font-bold uppercase text-stone-400 mb-1">Total de Estúdios</h3>
                            <p className="text-2xl font-bold text-stone-800">{profiles.length}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                            <h3 className="text-xs font-bold uppercase text-stone-400 mb-1">Ativos</h3>
                            <p className="text-2xl font-bold text-emerald-600">{profiles.filter(p => p.status !== 'inactive').length}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                            <h3 className="text-xs font-bold uppercase text-stone-400 mb-1">Desativados</h3>
                            <p className="text-2xl font-bold text-red-500">{profiles.filter(p => p.status === 'inactive').length}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-stone-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou especialização..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 shadow-sm outline-none focus:ring-2 focus:ring-stone-400"
                        />
                    </div>

                    <div className="grid gap-4">
                        {filteredProfiles.map(profile => (
                            <div key={profile.id} className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-14 h-14 rounded-full bg-stone-100 flex-shrink-0 overflow-hidden border">
                                        {profile.profile_photo_url ? (
                                            <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building className="w-6 h-6 m-auto mt-4 text-stone-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                            {profile.name || "Sem Nome"}
                                            {profile.is_super_admin && <ShieldCheck size={14} className="text-emerald-500"/>}
                                        </h3>
                                        <p className="text-xs text-stone-500">{profile.specialization || "Não informado"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${profile.status === 'inactive' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                            <span className="text-[10px] uppercase font-bold text-stone-400">{profile.status === 'inactive' ? 'Inativo' : 'Ativo'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 justify-end">
                                    <button 
                                        onClick={() => handleToggleStatus(profile)}
                                        className={`
                                            flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all
                                            ${profile.status === 'inactive' 
                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' 
                                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}
                                        `}
                                    >
                                        <Power size={16} />
                                        {profile.status === 'inactive' ? 'Ativar Conta' : 'Desativar Conta'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredProfiles.length === 0 && <p className="text-center text-stone-500 py-10">Nenhum perfil encontrado.</p>}
                    </div>
                </>
            )}

            {/* --- ADMINS TAB --- */}
            {activeTab === 'admins' && (
                <div className="space-y-6">
                    {!showAddAdmin ? (
                        <div className="bg-stone-900 text-white p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                                <UserPlus size={32} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Adicionar Novo Admin</h2>
                                <p className="text-sm text-stone-400 max-w-sm mx-auto mt-2">Crie um novo usuário com privilégios totais de acesso. Ele poderá gerenciar contas e criar outros admins.</p>
                            </div>
                            <button onClick={() => setShowAddAdmin(true)} className="px-6 py-3 bg-emerald-500 text-white font-bold uppercase text-xs rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                Cadastrar Novo Admin
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative animate-fade-in">
                            <button onClick={() => setShowAddAdmin(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"><X size={20}/></button>
                            <h2 className="text-lg font-bold mb-6 text-stone-800">Dados do Novo Administrador</h2>
                            <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
                                <Input label="Nome Completo" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} required />
                                <Input label="E-mail de Acesso" type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required />
                                <Input label="Senha Temporária" type="text" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required minLength={6} />
                                
                                <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-700 border border-yellow-100 mt-4">
                                    ⚠️ Atenção: Ao criar este usuário, <strong>você será desconectado</strong> automaticamente do sistema e precisará fazer login novamente. Isso ocorre para registrar o novo usuário no banco de dados com segurança.
                                </div>

                                <Button disabled={creatingAdmin} className="w-full !bg-stone-900">
                                    {creatingAdmin ? 'Criando...' : 'Confirmar e Criar Admin'}
                                </Button>
                            </form>
                        </div>
                    )}

                    <div className="mt-8">
                        <h3 className="font-bold text-stone-800 mb-4 uppercase text-xs tracking-wider">Admins Atuais</h3>
                        <div className="grid gap-3">
                            {admins.map(admin => (
                                <div key={admin.id} className="p-4 bg-white border border-stone-200 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                                        <ShieldCheck size={20} className="text-stone-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-stone-800">{admin.name || "Admin"}</p>
                                        <p className="text-xs text-stone-500">Super Admin</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
