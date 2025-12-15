import React, { useState, useEffect } from 'react';
import { AppData, Appointment, Professional, Service, Work, Testimonial } from '../types';
import { Button, Input, AccordionItem, ImagePicker } from '../components/Shared';
import { Trash2, Plus, LogOut, X, CalendarDays, Clock, DollarSign, TrendingUp, Award, User, Briefcase, Palette, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

interface AdminProps {
  data: AppData;
  onUpdate: () => void; // Trigger refresh
  onLogout: () => void;
  theme: any; // Add theme prop
}

export const AdminDashboard: React.FC<AdminProps> = ({ data, onUpdate, onLogout, theme }) => {
  const [openSection, setOpenSection] = useState<string | null>('agenda');
  const [isSaving, setIsSaving] = useState(false);

  // Local state for editing
  const [services, setServices] = useState<Service[]>(data.services);
  const [works, setWorks] = useState<Work[]>(data.works);
  const [professional, setProfessional] = useState<Professional>(data.professional);
  const [appointments, setAppointments] = useState<Appointment[]>(data.appointments);

  // Sync state when parent data changes
  useEffect(() => {
    setServices(data.services);
    setWorks(data.works);
    setProfessional(data.professional);
    setAppointments(data.appointments);
  }, [data]);

  // --- Handlers ---

  const handleDeleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    await api.postData('delete_appointment', { id });
    onUpdate();
  };

  const handleSaveServices = async () => {
    setIsSaving(true);
    await api.postData('update_services', services);
    setIsSaving(false);
    onUpdate();
  };

  const handleSaveWorks = async () => {
    setIsSaving(true);
    await api.postData('update_works', works);
    setIsSaving(false);
    onUpdate();
  };
  
  const handleSaveProfile = async () => {
      setIsSaving(true);
      await api.postData('update_profile', professional);
      setIsSaving(false);
      onUpdate();
  }

  const toggleSection = (id: string) => setOpenSection(openSection === id ? null : id);

  // --- Finance Logic ---
  const financeData = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentMonthApts = appointments.filter(a => {
        const [day, month] = a.data.split(' (')[0].split('/').map(Number);
        return (month - 1) === currentMonth;
    });
    
    let revenue = 0;
    currentMonthApts.forEach(apt => {
        const serviceNames = apt.servicos;
        serviceNames.forEach(name => {
            const svc = services.find(s => s.nome === name);
            if (svc) revenue += svc.preco;
        });
    });

    return { revenue, count: currentMonthApts.length };
  }, [appointments, services]);


  return (
    <div className="fixed inset-0 bg-stone-50 z-50 overflow-y-auto" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <div className="p-5 border-b flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md" style={{ backgroundColor: `${theme.card}CC`, borderColor: theme.border }}>
         <h1 className="font-serif font-bold text-lg tracking-wide" style={{ color: theme.text }}>Painel Admin</h1>
         <button onClick={onLogout} className="text-[10px] font-bold uppercase flex gap-2 items-center transition-colors px-3 py-1.5 rounded-full border" style={{ backgroundColor: theme.bg, color: theme.subtext, borderColor: theme.border }}>Sair <LogOut size={12}/></button>
      </div>

      <div className="p-5 max-w-md mx-auto pb-20 space-y-3">
        
        {/* CARD 1: AGENDAMENTOS */}
        <AccordionItem 
            id="agenda" 
            title="Agendamentos" 
            icon={<CalendarDays />} 
            isOpen={openSection === 'agenda'} 
            onToggle={() => toggleSection('agenda')}
            theme={theme}
            badgeCount={appointments.length}
        >
            <div className="space-y-4">
                {appointments.length === 0 && <p className="text-center text-xs py-4 italic" style={{ color: theme.subtext }}>Nenhum agendamento.</p>}
                {appointments.map(apt => (
                    <div key={apt.id} className="p-4 rounded-2xl border shadow-sm relative flex flex-col gap-3" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold font-serif text-lg" style={{ color: theme.text }}>{apt.clienteNome}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ backgroundColor: theme.bg, color: theme.subtext }}>{apt.servicos.join(', ')}</span>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteAppointment(apt.id)} className="p-2 rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                        </div>
                        <p className="text-xs flex gap-4 items-center" style={{ color: theme.subtext }}>
                            <span className="flex items-center gap-1"><CalendarDays size={12}/> {apt.data}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {apt.hora}</span>
                        </p>
                        <a href={`https://wa.me/55${apt.clienteTelefone.replace(/\D/g, '')}`} target="_blank" className="text-xs font-bold uppercase underline mt-1" style={{ color: theme.accent }}>
                            WhatsApp: {apt.clienteTelefone}
                        </a>
                    </div>
                ))}
            </div>
        </AccordionItem>

        {/* CARD 2: SERVIÇOS */}
        <AccordionItem 
            id="servicos" 
            title="Serviços" 
            icon={<Briefcase />} 
            isOpen={openSection === 'servicos'} 
            onToggle={() => toggleSection('servicos')}
            theme={theme}
        >
            <div className="space-y-4">
                 {/* List Existing */}
                 {services.map((svc, idx) => (
                    <div key={svc.id || idx} className="p-4 rounded-xl border flex flex-col gap-3 relative group" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <button 
                            onClick={() => setServices(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-stone-300 hover:text-red-400 p-2"
                        >
                            <X size={16}/>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3 pr-8">
                            <Input 
                                label="Nome do Serviço"
                                value={svc.nome} 
                                onChange={(e) => {
                                    const newServices = [...services];
                                    newServices[idx].nome = e.target.value;
                                    setServices(newServices);
                                }} 
                                placeholder="Ex: Limpeza de Pele"
                            />
                             <Input 
                                label="Preço (R$)"
                                type="number"
                                value={svc.preco} 
                                onChange={(e) => {
                                    const newServices = [...services];
                                    newServices[idx].preco = Number(e.target.value);
                                    setServices(newServices);
                                }} 
                                placeholder="0.00"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <Input 
                                label="Tempo Estimado"
                                value={svc.duracao}
                                onChange={(e) => {
                                    const newServices = [...services];
                                    newServices[idx].duracao = e.target.value;
                                    setServices(newServices);
                                }} 
                                placeholder="30 min"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-1">Cuidados Pós</label>
                            <textarea 
                                value={svc.postCare || ''} 
                                onChange={(e) => {
                                    const newServices = [...services];
                                    newServices[idx].postCare = e.target.value;
                                    setServices(newServices);
                                }} 
                                placeholder="Instruções para a cliente após o procedimento..."
                                className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none text-sm resize-none"
                                rows={2}
                            />
                        </div>
                    </div>
                ))}
                
                {/* Add New Button */}
                <button 
                    onClick={() => setServices([...services, { id: Date.now().toString(), nome: '', preco: 0, duracao: '30 min', postCare: '' }])} 
                    className="w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all hover:bg-stone-50"
                    style={{ borderColor: theme.border, color: theme.subtext }}
                >
                    <Plus size={16} /> Adicionar Novo Serviço
                </button>

                <Button onClick={handleSaveServices} disabled={isSaving} className="w-full shadow-md mt-2" style={{ backgroundColor: theme.button, color: theme.buttonText }}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </AccordionItem>
        
        {/* CARD EXTRA: PORTFÓLIO (WORKS) */}
        <AccordionItem 
            id="portfolio" 
            title="Portfólio (Antes & Depois)" 
            icon={<ImageIcon />} 
            isOpen={openSection === 'portfolio'} 
            onToggle={() => toggleSection('portfolio')}
            theme={theme}
        >
            <div className="space-y-4">
                 {works.length === 0 && <p className="text-center text-xs italic py-2 opacity-50">Adicione fotos dos seus resultados.</p>}
                 
                 {works.map((work, idx) => (
                    <div key={work.id || idx} className="p-4 rounded-xl border flex flex-col gap-4 relative" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <button 
                            onClick={() => setWorks(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-stone-300 hover:text-red-400 p-2 z-10"
                        >
                            <X size={16}/>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <ImagePicker 
                                label="Antes" 
                                value={work.imageBeforeUrl || ''} 
                                onChange={(url) => {
                                    const newWorks = [...works];
                                    newWorks[idx].imageBeforeUrl = url;
                                    setWorks(newWorks);
                                }}
                            />
                            <ImagePicker 
                                label="Depois" 
                                value={work.imageAfterUrl || ''} 
                                onChange={(url) => {
                                    const newWorks = [...works];
                                    newWorks[idx].imageAfterUrl = url;
                                    setWorks(newWorks);
                                }}
                            />
                        </div>
                        <Input 
                            label="Título do Procedimento"
                            value={work.titulo} 
                            onChange={(e) => {
                                const newWorks = [...works];
                                newWorks[idx].titulo = e.target.value;
                                setWorks(newWorks);
                            }} 
                            placeholder="Ex: Botox na Testa"
                        />
                    </div>
                ))}

                <button 
                    onClick={() => setWorks([...works, { id: Date.now().toString(), titulo: '', imageBeforeUrl: '', imageAfterUrl: '', urlImagem: '' }])} 
                    className="w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all hover:bg-stone-50"
                    style={{ borderColor: theme.border, color: theme.subtext }}
                >
                    <Plus size={16} /> Adicionar Novo Trabalho
                </button>

                <Button onClick={handleSaveWorks} disabled={isSaving} className="w-full shadow-md mt-2" style={{ backgroundColor: theme.button, color: theme.buttonText }}>
                    {isSaving ? 'Salvando...' : 'Salvar Portfólio'}
                </Button>
            </div>
        </AccordionItem>

        {/* CARD 3: QUEM SOU EU */}
        <AccordionItem 
            id="profile" 
            title="Quem Sou Eu" 
            icon={<User />} 
            isOpen={openSection === 'profile'} 
            onToggle={() => toggleSection('profile')}
            theme={theme}
        >
             <div className="space-y-4">
                <Input label="Nome Profissional" value={professional.nome} onChange={e => setProfessional({...professional, nome: e.target.value})} />
                <Input label="Especialização" value={professional.especializacao} onChange={e => setProfessional({...professional, especializacao: e.target.value})} />
                
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-1">Minha História (Bio)</label>
                    <textarea 
                        className="w-full p-3 border rounded-xl focus:ring-2 outline-none text-sm"
                        rows={6}
                        value={professional.bio}
                        onChange={e => setProfessional({...professional, bio: e.target.value})}
                        style={{ borderColor: theme.border, backgroundColor: theme.card }}
                    />
                </div>

                <ImagePicker 
                    label="Foto da Bio" 
                    value={professional.fotoBio} 
                    onChange={url => setProfessional({...professional, fotoBio: url})} 
                    aspect="square"
                />

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full shadow-md" style={{ backgroundColor: theme.button, color: theme.buttonText }}>
                    {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
            </div>
        </AccordionItem>

        {/* CARD 4: CUSTOMIZAÇÃO */}
        <AccordionItem 
            id="custom" 
            title="Customização" 
            icon={<Palette />} 
            isOpen={openSection === 'custom'} 
            onToggle={() => toggleSection('custom')}
            theme={theme}
        >
             <div className="space-y-4">
                <Input label="Endereço Completo" value={professional.endereco} onChange={e => setProfessional({...professional, endereco: e.target.value})} />
                <Input label="Link Google Maps" value={professional.linkMaps} onChange={e => setProfessional({...professional, linkMaps: e.target.value})} />
                <Input label="WhatsApp (somente números)" value={professional.whatsapp} onChange={e => setProfessional({...professional, whatsapp: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <ImagePicker 
                        label="Logo" 
                        value={professional.logo} 
                        onChange={url => setProfessional({...professional, logo: url})} 
                        aspect="square"
                    />
                    <ImagePicker 
                        label="Fundo (Header)" 
                        value={professional.fotoPerfil} 
                        onChange={url => setProfessional({...professional, fotoPerfil: url})} 
                        aspect="square"
                    />
                </div>

                <div className="pt-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Tema do App</label>
                    <div className="flex gap-2 flex-wrap">
                        {['rose', 'purple', 'luxury', 'ocean', 'peach', 'slate', 'forest'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setProfessional({...professional, theme: t as any})}
                                className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${professional.theme === t ? 'ring-2 ring-offset-2 scale-110' : ''}`}
                                style={{ 
                                  backgroundColor: 
                                    t === 'rose' ? '#fda4af' : 
                                    t === 'purple' ? '#a87bc7' : 
                                    t === 'luxury' ? '#D4AF37' : 
                                    t === 'ocean' ? '#0EA5E9' : 
                                    t === 'peach' ? '#f97316' : 
                                    t === 'slate' ? '#475569' : 
                                    '#355e3b' 
                                }}
                            />
                        ))}
                    </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full shadow-md mt-2" style={{ backgroundColor: theme.button, color: theme.buttonText }}>
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
            </div>
        </AccordionItem>

        {/* CARD 5: FINANCEIRO */}
        <AccordionItem 
            id="finance" 
            title="Financeiro" 
            icon={<DollarSign />} 
            isOpen={openSection === 'finance'} 
            onToggle={() => toggleSection('finance')}
            theme={theme}
        >
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-1" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}><DollarSign size={20}/></div>
                        <span className="text-[10px] font-bold uppercase" style={{ color: theme.subtext }}>Faturamento (Mês)</span>
                        <span className="text-lg font-bold" style={{ color: theme.text }}>R$ {financeData.revenue}</span>
                    </div>
                    <div className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-1" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}><TrendingUp size={20}/></div>
                        <span className="text-[10px] font-bold uppercase" style={{ color: theme.subtext }}>Agendamentos</span>
                        <span className="text-lg font-bold" style={{ color: theme.text }}>{financeData.count}</span>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border text-center text-xs text-stone-500">
                    Dados baseados nos agendamentos deste mês. Confirme o recebimento no WhatsApp.
                </div>
            </div>
        </AccordionItem>

      </div>
    </div>
  );
};