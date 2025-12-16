
import React, { useState, useEffect } from 'react';
import { AppData, Appointment, Professional, Service, Work, Testimonial } from '../types';
import { Button, Input, AccordionItem, ImagePicker } from '../components/Shared';
import { Trash2, Plus, LogOut, X, CalendarDays, Clock, DollarSign, TrendingUp, Award, User, Briefcase, Palette, Image as ImageIcon, MessageSquare, Star, Quote, MessageCircle, Share2, Copy, ExternalLink, Check, Globe, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface AdminProps {
  data: AppData;
  onUpdate: () => void; // Trigger refresh
  onLogout: () => void;
  theme: any; // Add theme prop
  userId: string; // Add userId prop
}

export const AdminDashboard: React.FC<AdminProps> = ({ data, onUpdate, onLogout, theme, userId }) => {
  const [openSection, setOpenSection] = useState<string | null>('agenda');
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // New State for Custom Delete Modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification State: Persist seen count to localStorage
  const [lastSeenCount, setLastSeenCount] = useState(() => {
    const saved = localStorage.getItem(`seen_apts_${userId}`);
    return saved ? parseInt(saved) : 0;
  });

  // Local state for editing
  const [services, setServices] = useState<Service[]>(data.services);
  const [works, setWorks] = useState<Work[]>(data.works);
  const [professional, setProfessional] = useState<Professional>(data.professional);
  const [appointments, setAppointments] = useState<Appointment[]>(data.appointments);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(data.testimonials || []);

  // Sync state when parent data changes
  useEffect(() => {
    setServices(data.services);
    setWorks(data.works);
    setProfessional(data.professional);
    setAppointments(data.appointments);
    setTestimonials(data.testimonials || []);
  }, [data]);

  // Logic to generate slug from name
  const generateSlug = (name: string) => {
      if (!name) return `studio-${userId.slice(0,5)}`;
      return name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .trim()
        .replace(/\s+/g, '-'); // Replace spaces with dashes
  };

  // Determine the display Link
  const displaySlug = professional.slug || (professional.nome ? generateSlug(professional.nome) : userId);
  const publicLink = `${window.location.origin}?u=${displaySlug}`;

  // Calculate Badge Count
  const unreadCount = Math.max(0, appointments.length - lastSeenCount);

  // --- Handlers ---

  const toggleSection = (id: string) => {
      if (openSection === id) {
          setOpenSection(null);
      } else {
          setOpenSection(id);
          // If opening agenda, mark all current as seen
          if (id === 'agenda') {
              setLastSeenCount(appointments.length);
              localStorage.setItem(`seen_apts_${userId}`, appointments.length.toString());
          }
      }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 1. Trigger Modal
  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDeleteId(id);
  };

  // 2. Execute Delete (Called by Modal)
  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    
    setIsDeleting(true);
    const id = confirmDeleteId;

    try {
        await api.postData('delete_appointment', { id }, userId);
        
        // Update local state
        setAppointments(prev => prev.filter(a => a.id !== id));
        
        // Update notification count
        const newCount = Math.max(0, appointments.length - 1);
        if (openSection === 'agenda') {
             setLastSeenCount(newCount);
             localStorage.setItem(`seen_apts_${userId}`, newCount.toString());
        }

        // Fetch latest data
        onUpdate();
        console.log("Sucesso ao deletar.");
    } catch (e) {
        console.error("Erro ao deletar:", e);
        alert("Erro ao deletar. Tente novamente.");
    } finally {
        setIsDeleting(false);
        setConfirmDeleteId(null); // Close modal
    }
  };

  const handleSaveServices = async () => {
    setIsSaving(true);
    try {
        await api.postData('update_services', services, userId);
        // CRITICAL: Call onUpdate to re-fetch data so new items get their real IDs from DB
        await onUpdate(); 
        alert("Serviços salvos com sucesso!");
    } catch (e: any) {
        alert("Erro ao salvar serviços: " + (e.message || "Erro desconhecido"));
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveWorks = async () => {
    setIsSaving(true);
    try {
        await api.postData('update_works', works, userId);
        await onUpdate();
        alert("Portfólio salvo com sucesso!");
    } catch (e: any) {
        alert("Erro ao salvar portfólio: " + (e.message || "Erro desconhecido"));
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSaveProfile = async () => {
      setIsSaving(true);
      
      const updatedProfile = { ...professional };
      if (!updatedProfile.slug) {
          updatedProfile.slug = generateSlug(updatedProfile.nome);
      }
      setProfessional(updatedProfile);

      try {
          await api.postData('update_profile', updatedProfile, userId);
          await onUpdate();
          alert("Perfil salvo com sucesso!");
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes('slug')) {
              alert("Erro: Este nome de link já está sendo usado por outro estúdio. Por favor, altere o campo 'Personalizar Link' para algo único.");
          } else {
              alert("Erro ao salvar perfil: " + (e.message || "Erro de conexão"));
          }
      } finally {
          setIsSaving(false);
      }
  }

  const handleSaveTestimonials = async () => {
      setIsSaving(true);
      try {
          await api.postData('update_testimonials', testimonials, userId);
          await onUpdate();
          alert("Depoimentos salvos com sucesso!");
      } catch (e: any) {
          alert("Erro ao salvar depoimentos: " + (e.message || "Erro desconhecido"));
      } finally {
          setIsSaving(false);
      }
  }

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
         <div className="flex items-center gap-2">
            {isSaving && <span className="text-xs animate-pulse text-stone-500 font-medium">Salvando...</span>}
            <button onClick={onLogout} className="text-[10px] font-bold uppercase flex gap-2 items-center transition-colors px-3 py-1.5 rounded-full border" style={{ backgroundColor: theme.bg, color: theme.subtext, borderColor: theme.border }}>Voltar ao App <LogOut size={12}/></button>
         </div>
      </div>

      <div className="p-5 max-w-md mx-auto pb-20 space-y-3">
        
        {/* CARD: LINK DA AGENDA (Novo) */}
        <AccordionItem 
            id="share_link" 
            title="Link da sua agenda" 
            icon={<Share2 />} 
            isOpen={openSection === 'share_link'} 
            onToggle={() => toggleSection('share_link')} 
            theme={theme}
            highlight
        >
            <div className="space-y-4 text-center">
                <p className="text-xs leading-relaxed" style={{ color: theme.subtext }}>
                    Este é o seu link personalizado. Compartilhe com suas clientes!
                </p>
                <div className="p-3 rounded-xl border bg-stone-50 flex items-center justify-between gap-3 overflow-hidden" style={{ borderColor: theme.border }}>
                    <p className="text-xs truncate text-stone-500 font-mono select-all">{publicLink}</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={copyToClipboard} className="flex-1 text-xs uppercase font-bold" style={{ backgroundColor: theme.button }}>
                        {copySuccess ? <Check size={14} /> : <Copy size={14} />} {copySuccess ? 'Copiado!' : 'Copiar Link'}
                    </Button>
                    <a href={publicLink} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center justify-center">
                        <ExternalLink size={16} />
                    </a>
                </div>
                
                {/* Visual Slug Editor */}
                <div className="border-t pt-4 mt-2" style={{ borderColor: theme.border }}>
                    <div className="flex items-center gap-2 mb-2 justify-center opacity-70">
                         <Globe size={12} />
                         <span className="text-[10px] uppercase font-bold">Personalizar Link</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">agenda-vip.com/?u=</span>
                        <input 
                            className="flex-1 bg-transparent border-b border-dashed outline-none text-xs font-bold py-1"
                            style={{ borderColor: theme.accent, color: theme.text }}
                            value={professional.slug || ''}
                            placeholder={generateSlug(professional.nome || 'seu-nome')}
                            onChange={e => setProfessional({...professional, slug: generateSlug(e.target.value)})}
                        />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 italic">Salve o perfil abaixo para aplicar a mudança de link.</p>
                </div>
            </div>
        </AccordionItem>

        {/* CARD 1: AGENDAMENTOS */}
        <AccordionItem 
            id="agenda" 
            title="Agendamentos" 
            icon={<CalendarDays />} 
            isOpen={openSection === 'agenda'} 
            onToggle={() => toggleSection('agenda')}
            theme={theme}
            badgeCount={unreadCount}
        >
            <div className="space-y-4">
                {appointments.length === 0 && <p className="text-center text-xs py-4 italic" style={{ color: theme.subtext }}>Nenhum agendamento.</p>}
                {appointments.map(apt => (
                    <div key={apt.id} className="p-4 rounded-2xl border shadow-sm flex flex-col gap-3 relative overflow-hidden" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        
                        {/* Header Row: Info Left, Actions Right - FLEXBOX prevents overlap */}
                        <div className="flex justify-between items-start">
                             <div className="flex-1 min-w-0 pr-2"> {/* min-w-0 ensures text truncation works */}
                                <p className="text-sm font-bold truncate" style={{ color: theme.text }}>{apt.clienteNome}</p>
                                <p className="text-xs flex items-center gap-1 mt-1 text-stone-500"><User size={10}/> {apt.clienteTelefone}</p>
                             </div>
                             
                             <button 
                                type="button"
                                onClick={(e) => requestDelete(e, apt.id)} 
                                className="flex-shrink-0 p-2 bg-red-50 text-red-500 rounded-lg shadow-sm hover:bg-red-100 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                                title="Excluir Agendamento"
                             >
                                <Trash2 size={16}/>
                             </button>
                        </div>
                        
                        {/* Time Row */}
                        <div className="flex items-center gap-3 bg-stone-50/50 p-2 rounded-lg border border-stone-100">
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-stone-100 shadow-sm">
                                <CalendarDays size={12} className="text-stone-400" />
                                <span className="text-xs font-bold text-stone-700">{apt.data}</span>
                             </div>
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-stone-100 shadow-sm">
                                <Clock size={12} className="text-stone-400" />
                                <span className="text-xs font-bold text-stone-700">{apt.hora}</span>
                             </div>
                        </div>

                        {/* Services List */}
                        <div className="pt-2 border-t border-dashed" style={{ borderColor: theme.border }}>
                            <p className="text-[10px] uppercase font-bold mb-1" style={{ color: theme.subtext }}>Serviços:</p>
                            <p className="text-xs leading-relaxed" style={{ color: theme.text }}>{Array.isArray(apt.servicos) ? apt.servicos.join(', ') : apt.servicos}</p>
                        </div>

                        {/* WhatsApp Confirm Button */}
                        <button 
                            onClick={() => {
                                const phone = apt.clienteTelefone.replace(/\D/g, '');
                                const msg = `Recebi seu agendamento ${apt.clienteNome}, estou ansiosa para te atender!`;
                                window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold uppercase text-white shadow-md transition-transform active:scale-95 mt-1 hover:brightness-110"
                            style={{ backgroundColor: '#25D366' }}
                        >
                            <MessageCircle size={14} /> Confirmar
                        </button>
                    </div>
                ))}
            </div>
        </AccordionItem>

        {/* CARD 2: FINANCEIRO */}
        <AccordionItem id="finance" title="Financeiro (Mês)" icon={<TrendingUp />} isOpen={openSection === 'finance'} onToggle={() => toggleSection('finance')} theme={theme}>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border flex flex-col items-center justify-center gap-2" style={{ backgroundColor: `${theme.accent}10`, borderColor: theme.accent }}>
                    <DollarSign size={24} style={{ color: theme.accent }} />
                    <p className="text-xs uppercase font-bold" style={{ color: theme.subtext }}>Faturamento</p>
                    <p className="text-xl font-bold" style={{ color: theme.button }}>R$ {financeData.revenue}</p>
                </div>
                <div className="p-4 rounded-2xl border flex flex-col items-center justify-center gap-2" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                    <CalendarDays size={24} style={{ color: theme.subtext }} />
                    <p className="text-xs uppercase font-bold" style={{ color: theme.subtext }}>Atendimentos</p>
                    <p className="text-xl font-bold" style={{ color: theme.text }}>{financeData.count}</p>
                </div>
            </div>
        </AccordionItem>

        {/* CARD 3: SERVIÇOS */}
        <AccordionItem id="services" title="Editar Serviços" icon={<Briefcase />} isOpen={openSection === 'services'} onToggle={() => toggleSection('services')} theme={theme}>
            <div className="space-y-6">
                {services.map((service, index) => (
                    <div key={service.id} className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed" style={{ borderColor: theme.border }}>
                             <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.subtext }}>Serviço #{index + 1}</span>
                             <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setServices(services.filter(s => s.id !== service.id)); }} 
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-md shadow-sm hover:bg-red-100 transition-colors cursor-pointer"
                            >
                                <Trash2 size={12}/> <span className="text-[10px] font-bold">Excluir</span>
                            </button>
                        </div>
                        <div className="flex gap-2">
                             <Input label="Nome" value={service.nome} onChange={e => {
                                 const newServices = [...services];
                                 newServices[index].nome = e.target.value;
                                 setServices(newServices);
                             }} />
                             <div className="w-24">
                                <Input label="Preço" type="number" value={service.preco} onChange={e => {
                                    const newServices = [...services];
                                    newServices[index].preco = Number(e.target.value);
                                    setServices(newServices);
                                }} />
                             </div>
                        </div>
                        <div className="flex gap-2">
                             <Input label="Duração" value={service.duracao} onChange={e => {
                                 const newServices = [...services];
                                 newServices[index].duracao = e.target.value;
                                 setServices(newServices);
                             }} />
                             <Input label="Cuidados Pós" value={service.postCare || ''} placeholder="Ex: Evitar sol..." onChange={e => {
                                 const newServices = [...services];
                                 newServices[index].postCare = e.target.value;
                                 setServices(newServices);
                             }} />
                        </div>
                    </div>
                ))}
                <Button variant="outline" onClick={() => setServices([...services, { id: `temp_${Date.now()}`, nome: '', preco: 0, duracao: '30 min', postCare: '' }])} className="w-full border-dashed border-2 py-4 text-xs uppercase" style={{ borderColor: theme.subtext, color: theme.subtext }}>
                    <Plus size={16} /> Adicionar Serviço
                </Button>
                <Button onClick={handleSaveServices} className="w-full" style={{ backgroundColor: theme.button }} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </AccordionItem>
        
        {/* CARD 4: PORTFÓLIO */}
        <AccordionItem id="portfolio" title="Portfólio" icon={<ImageIcon />} isOpen={openSection === 'portfolio'} onToggle={() => toggleSection('portfolio')} theme={theme}>
             <div className="space-y-6">
                 {works.map((work, idx) => (
                     <div key={work.id} className="p-4 rounded-xl border relative space-y-3" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                         <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed" style={{ borderColor: theme.border }}>
                             <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.subtext }}>Trabalho #{idx + 1}</span>
                             <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setWorks(works.filter(w => w.id !== work.id)); }} 
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-md shadow-sm hover:bg-red-100 transition-colors cursor-pointer"
                            >
                                <Trash2 size={12}/> <span className="text-[10px] font-bold">Excluir</span>
                            </button>
                        </div>
                         <Input label="Título do Trabalho" value={work.titulo} onChange={e => {
                             const newWorks = [...works];
                             newWorks[idx].titulo = e.target.value;
                             setWorks(newWorks);
                         }} />
                         <div className="flex gap-2">
                             <div className="w-1/2">
                                <ImagePicker label="Antes" value={work.imageBeforeUrl || work.urlImagem || ''} onChange={url => {
                                    const newWorks = [...works];
                                    newWorks[idx].imageBeforeUrl = url;
                                    setWorks(newWorks);
                                }} />
                             </div>
                             <div className="w-1/2">
                                <ImagePicker label="Depois" value={work.imageAfterUrl || ''} onChange={url => {
                                    const newWorks = [...works];
                                    newWorks[idx].imageAfterUrl = url;
                                    setWorks(newWorks);
                                }} />
                             </div>
                         </div>
                     </div>
                 ))}
                 <Button variant="outline" onClick={() => setWorks([...works, { id: `temp_${Date.now()}`, titulo: '', urlImagem: '', imageBeforeUrl: '', imageAfterUrl: '' }])} className="w-full border-dashed border-2 py-4 text-xs uppercase" style={{ borderColor: theme.subtext, color: theme.subtext }}>
                    <Plus size={16} /> Adicionar Trabalho
                </Button>
                <Button onClick={handleSaveWorks} className="w-full" style={{ backgroundColor: theme.button }} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Portfólio'}
                </Button>
             </div>
        </AccordionItem>

        {/* CARD 5: DEPOIMENTOS (NEW) */}
        <AccordionItem id="testimonials" title="Depoimentos" icon={<Quote />} isOpen={openSection === 'testimonials'} onToggle={() => toggleSection('testimonials')} theme={theme}>
            <div className="space-y-6">
                <p className="text-xs italic" style={{ color: theme.subtext }}>Adicione até 5 depoimentos para aparecerem na aba "Quem Sou Eu".</p>
                {testimonials.map((t, idx) => (
                    <div key={t.id} className="p-4 rounded-xl border relative space-y-3" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                         <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed" style={{ borderColor: theme.border }}>
                             <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.subtext }}>Depoimento #{idx + 1}</span>
                             <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setTestimonials(testimonials.filter(item => item.id !== t.id)); }} 
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-md shadow-sm hover:bg-red-100 transition-colors cursor-pointer"
                            >
                                <Trash2 size={12}/> <span className="text-[10px] font-bold">Excluir</span>
                            </button>
                        </div>
                         <div className="flex gap-2 items-center">
                            <div className="flex-1">
                                <Input label="Nome do Cliente" value={t.clientName} onChange={e => {
                                    const newItems = [...testimonials];
                                    newItems[idx].clientName = e.target.value;
                                    setTestimonials(newItems);
                                }} />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-bold uppercase tracking-wider mb-1 ml-1" style={{ color: theme.subtext }}>Estrelas</label>
                                <select 
                                    value={t.rating} 
                                    onChange={e => {
                                        const newItems = [...testimonials];
                                        newItems[idx].rating = parseInt(e.target.value);
                                        setTestimonials(newItems);
                                    }}
                                    className="w-full p-3 bg-white border rounded-xl text-sm outline-none"
                                    style={{ borderColor: theme.border }}
                                >
                                    <option value="5">5</option>
                                    <option value="4">4</option>
                                    <option value="3">3</option>
                                </select>
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1 ml-1" style={{ color: theme.subtext }}>Depoimento</label>
                            <textarea 
                                className="w-full p-3 bg-white border rounded-xl focus:ring-2 outline-none transition-all text-sm resize-none h-24"
                                style={{ borderColor: theme.border }}
                                value={t.text}
                                onChange={e => {
                                    const newItems = [...testimonials];
                                    newItems[idx].text = e.target.value;
                                    setTestimonials(newItems);
                                }}
                            />
                         </div>
                    </div>
                ))}

                {testimonials.length < 5 && (
                    <Button variant="outline" onClick={() => setTestimonials([...testimonials, { id: `temp_${Date.now()}`, clientName: '', text: '', rating: 5 }])} className="w-full border-dashed border-2 py-4 text-xs uppercase" style={{ borderColor: theme.subtext, color: theme.subtext }}>
                        <Plus size={16} /> Adicionar Depoimento
                    </Button>
                )}
                
                <Button onClick={handleSaveTestimonials} className="w-full" style={{ backgroundColor: theme.button }} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Depoimentos'}
                </Button>
            </div>
        </AccordionItem>

        {/* CARD 6: PERFIL E TEMA */}
        <AccordionItem id="profile_edit" title="Perfil e Aparência" icon={<Palette />} isOpen={openSection === 'profile_edit'} onToggle={() => toggleSection('profile_edit')} theme={theme}>
             <div className="space-y-4">
                 <Input label="Nome do Estúdio" value={professional.nome} onChange={e => setProfessional({...professional, nome: e.target.value})} />
                 <Input label="Especialização" value={professional.especializacao} onChange={e => setProfessional({...professional, especializacao: e.target.value})} />
                 <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 ml-1" style={{ color: theme.subtext }}>Bio</label>
                    <textarea className="w-full p-3 bg-white border rounded-xl text-sm" style={{ borderColor: theme.border }} rows={4} value={professional.bio} onChange={e => setProfessional({...professional, bio: e.target.value})} />
                 </div>
                 <Input label="WhatsApp (apenas números)" value={professional.whatsapp} onChange={e => setProfessional({...professional, whatsapp: e.target.value})} />
                 <Input label="Endereço" value={professional.endereco} onChange={e => setProfessional({...professional, endereco: e.target.value})} />
                 <Input label="Link Google Maps" value={professional.linkMaps} onChange={e => setProfessional({...professional, linkMaps: e.target.value})} />
                 
                 <div className="grid grid-cols-2 gap-3 pt-2">
                    <ImagePicker label="Foto de Capa (Header)" aspect="video" value={professional.fotoPerfil} onChange={url => setProfessional({...professional, fotoPerfil: url})} />
                    <ImagePicker label="Foto 'Quem Sou Eu'" value={professional.fotoBio} onChange={url => setProfessional({...professional, fotoBio: url})} />
                 </div>
                 <div className="w-full pt-2">
                    <ImagePicker label="Logo" value={professional.logo} onChange={url => setProfessional({...professional, logo: url})} />
                 </div>
                 
                 <div className="pt-4 border-t" style={{ borderColor: theme.border }}>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-3 ml-1" style={{ color: theme.subtext }}>Tema do App</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['rose', 'purple', 'luxury', 'ocean', 'peach', 'slate', 'forest'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setProfessional({...professional, theme: t as any})}
                                className={`h-10 rounded-full border-2 transition-all ${professional.theme === t ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                style={{ backgroundColor: t === 'rose' ? '#fda4af' : t === 'purple' ? '#a87bc7' : t === 'luxury' ? '#D4AF37' : t === 'ocean' ? '#0EA5E9' : t === 'peach' ? '#f97316' : t === 'forest' ? '#355e3b' : '#475569' }}
                            />
                        ))}
                    </div>
                 </div>

                 <Button onClick={handleSaveProfile} className="w-full mt-4" style={{ backgroundColor: theme.button }} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
             </div>
        </AccordionItem>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmDeleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div 
                className="w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border bg-white"
                style={{ backgroundColor: theme.card, borderColor: theme.border }}
              >
                  <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center animate-pulse">
                          <AlertTriangle className="text-red-500" size={32} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>Tem certeza?</h3>
                          <p className="text-sm leading-relaxed" style={{ color: theme.subtext }}>
                              Essa ação irá excluir o agendamento permanentemente. Não é possível desfazer.
                          </p>
                      </div>
                      
                      <div className="flex gap-3 w-full mt-2">
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 py-3.5 rounded-xl font-bold uppercase text-xs border transition-colors hover:bg-stone-50"
                            style={{ borderColor: theme.border, color: theme.subtext }}
                          >
                              Cancelar
                          </button>
                          <button 
                            onClick={executeDelete}
                            disabled={isDeleting}
                            className="flex-1 py-3.5 rounded-xl font-bold uppercase text-xs text-white shadow-lg bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                          >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
