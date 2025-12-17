
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User, CalendarDays, Check, Clock,
  Loader2, Lock, LogOut, Trash2, Plus, MapPin,
  Image as ImageIcon, MessageCircle, Home, X, Star, Camera, Palette, 
  TrendingUp, DollarSign, Award, Quote, Edit3, ArrowRight, Eye, EyeOff, Ban, Settings, SearchX
} from 'lucide-react';
import { AccordionItem, Input, Button, LoadingScreen, SectionTitle } from './components/Shared'; 
import { AdminDashboard } from './views/AdminDashboard'; 
import { Professional, Service, Work, Appointment, Testimonial, DaySlot, UserData } from './types';
import { api } from './services/api';

// --- TEMAS ---
const THEMES = {
  rose: {
    id: 'rose',
    name: 'Rosê Harmony',
    bg: '#FFF0F5', card: '#FFFFFF', text: '#8B4A58', subtext: '#BC8F9D', accent: '#D48C9D', button: '#8B4A58', buttonText: '#FFFFFF', border: '#FCE4EC', headerGradient: 'from-[#8B4A58]/30 via-transparent to-[#8B4A58]/90'
  },
  purple: {
    id: 'purple',
    name: 'Lilac Dream',
    bg: '#fcf5ff', card: '#FFFFFF', text: '#734a91', subtext: '#a87bc7', accent: '#a87bc7', button: '#734a91', buttonText: '#FFFFFF', border: '#e0b0ff', headerGradient: 'from-[#734a91]/30 via-transparent to-[#734a91]/90'
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury Beige',
    bg: '#FDFCF8', card: '#FFFFFF', text: '#4A4238', subtext: '#8C857B', accent: '#D4AF37', button: '#4A4238', buttonText: '#FFFFFF', border: '#EBE5DF', headerGradient: 'from-[#4A4238]/30 via-transparent to-[#4A4238]/90'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze',
    bg: '#F0F9FF', card: '#FFFFFF', text: '#0C4A6E', subtext: '#38BDF8', accent: '#0EA5E9', button: '#0284C7', buttonText: '#FFFFFF', border: '#BAE6FD', headerGradient: 'from-[#0284C7]/30 via-transparent to-[#0284C7]/90'
  },
  peach: {
    id: 'peach',
    name: 'Apricot Glow',
    bg: '#fff7ed', card: '#FFFFFF', text: '#9a3412', subtext: '#fb923c', accent: '#f97316', button: '#ea580c', buttonText: '#FFFFFF', border: '#fed7aa', headerGradient: 'from-[#ea580c]/30 via-transparent to-[#ea580c]/90'
  },
  slate: {
    id: 'slate',
    name: 'Slate Minimal',
    bg: '#f8fafc', card: '#FFFFFF', text: '#0f172a', subtext: '#64748b', accent: '#475569', button: '#1e293b', buttonText: '#FFFFFF', border: '#e2e8f0', headerGradient: 'from-[#1e293b]/30 via-transparent to-[#1e293b]/90'
  },
  forest: {
    id: 'forest',
    name: 'Urban Forest',
    bg: '#f2f7f5', card: '#FFFFFF', text: '#1a2e22', subtext: '#52796f', accent: '#355e3b', button: '#2f3e46', buttonText: '#FFFFFF', border: '#cad2c5', headerGradient: 'from-[#2f3e46]/30 via-transparent to-[#2f3e46]/90'
  }
};

// --- GERADOR DE DATAS (30 DIAS) ---
const generateDays = (): DaySlot[] => {
  const days: DaySlot[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fullWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    days.push({
      date: dateStr,
      weekday: fullWeekday,
      fullDate: d.toISOString().split('T')[0],
      times: [] // Filled dynamically
    });
  }
  return days;
};

const NEXT_DAYS = generateDays();

// --- COMPONENTES VISUAIS (Local) ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, theme: any }> = ({ isOpen, onClose, title, children, theme }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: theme.border }}>
          <h3 className="font-serif font-bold text-lg" style={{ color: theme.text }}>{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: theme.subtext }}><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const Carousel: React.FC<{ works: Work[], theme: any }> = ({ works, theme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const limitedWorks = works.slice(0, 5);

  useEffect(() => {
    if (limitedWorks.length <= 1) return;
    const interval = setInterval(() => { setCurrentIndex((prev) => (prev + 1) % limitedWorks.length); }, 3000);
    return () => clearInterval(interval);
  }, [limitedWorks.length]);

  if (limitedWorks.length === 0) return <p className="text-xs italic" style={{ color: theme.subtext }}>Nenhum trabalho adicionado.</p>;
  const currentWork = limitedWorks[currentIndex];

  return (
    <div className="relative w-full max-w-xs mx-auto overflow-hidden rounded-2xl shadow-xl border" style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `0 10px 30px -10px ${theme.accent}30` }}>
      <div className="flex h-48">
        <div className="w-1/2 relative border-r border-white/20">
            {currentWork.imageBeforeUrl && <img src={currentWork.imageBeforeUrl} className="w-full h-full object-cover" />}
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-1 rounded-md">Antes</div>
        </div>
        <div className="w-1/2 relative">
             {currentWork.imageAfterUrl && <img src={currentWork.imageAfterUrl} className="w-full h-full object-cover" />}
            <div className="absolute bottom-2 right-2 backdrop-blur-sm text-[9px] font-bold uppercase px-2 py-1 rounded-md" style={{ backgroundColor: theme.accent, color: theme.buttonText }}>Depois</div>
        </div>
      </div>
      {currentWork.titulo && <div className="text-[10px] py-2 text-center font-medium tracking-wider uppercase" style={{ backgroundColor: theme.button, color: theme.buttonText }}>{currentWork.titulo}</div>}
      <div className="flex justify-center gap-1.5 mt-3 mb-1">
          {limitedWorks.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-3' : ''}`} style={{ backgroundColor: idx === currentIndex ? theme.accent : theme.border }} />
          ))}
      </div>
    </div>
  );
};

interface AppProps {
  session: any;
  publicProfileId?: string;
}

// --- MAIN APP ---

const App: React.FC<AppProps> = ({ session, publicProfileId }) => {
  // Determine Mode
  const isOwner = !!session && !publicProfileId;
  const isPublicMode = !!publicProfileId;
  const userId = publicProfileId || session?.user?.id;

  const [professional, setProfessional] = useState<Professional>({ 
    id: '', 
    nome: '', 
    especializacao: '', 
    bio: '', 
    fotoPerfil: '', 
    fotoBio: '', 
    logo: '', 
    endereco: '', 
    linkMaps: '', 
    whatsapp: '', 
    theme: 'rose',
    status: 'active',
    workHours: {}
  });
  const [services, setServices] = useState<Service[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  
  // Set initial loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Security Modal State
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Booking State
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData>({ name: '', phone: '' });
  const [selectedDay, setSelectedDay] = useState<DaySlot | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const theme = THEMES[professional.theme || 'rose'] || THEMES.rose;

  const loadData = useCallback(async () => {
    if (!userId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const data = await api.fetchData(userId);
      setProfessional(data.professional);
      setServices(data.services);
      setWorks(data.works);
      setAppointments(data.appointments);
      if (data.testimonials) setTestimonials(data.testimonials);
    } catch (e) { 
        console.error("Erro ao carregar dados", e); 
    } finally {
        setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const apiProxy = useMemo(() => ({
      ...api,
      postData: async (action: string, payload: any) => await api.postData(action, payload, userId)
  }), [userId]);

  const handleLogout = async () => {
      // Logic handled in index.tsx via onAuthStateChange or directly
      // This is just a trigger
      try {
        await api.signOut();
      } catch (e) { console.error(e); }
  };

  const handleAdminAccess = () => {
      const remembered = localStorage.getItem('admin_remember');
      if (remembered === userId) {
          setIsAdminMode(true);
      } else {
          setShowSecurityModal(true);
      }
  };

  const handleVerifyPassword = async () => {
      setVerifying(true);
      setAuthError('');
      try {
        if (!session?.user?.email) throw new Error("Erro de sessão");
        const { error } = await api.signIn(session.user.email, confirmPassword);
        if (error) {
            setAuthError("Senha incorreta.");
        } else {
            if (rememberMe) localStorage.setItem('admin_remember', userId);
            setShowSecurityModal(false);
            setIsAdminMode(true);
            setConfirmPassword('');
        }
      } catch (err) {
          setAuthError("Erro ao verificar credenciais.");
      } finally {
          setVerifying(false);
      }
  };

  const finishBooking = async () => {
    if (!selectedDay || !selectedTime) return;
    const serviceNames = services.filter(s => selectedServices.includes(s.id)).map(s => s.nome);

    try {
        await apiProxy.postData('create_appointment', {
            clienteNome: userData.name,
            clienteTelefone: userData.phone,
            servicos: serviceNames,
            data: selectedDay.date,
            weekday: selectedDay.weekday,
            hora: selectedTime
        });
        setBookingStep(3);
        loadData();
    } catch (error) {
        alert("Erro ao salvar agendamento. Tente novamente.");
    }
  };

  const openWhatsAppClient = () => {
    const serviceNames = services.filter(s => selectedServices.includes(s.id)).map(s => s.nome).join(', ');
    const total = services.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + s.preco, 0);
    const msg = `Olá, ${professional.nome}! ✨\n\nAqui é *${userData.name}*.\nAcabei de pré-agendar:\n\n🗓 *Data:* ${selectedDay?.date} (${selectedDay?.weekday})\n⏰ *Horário:* ${selectedTime}\n💆‍♀️ *Serviço:* ${serviceNames}\n💰 *Total:* R$ ${total},00\n\nPodemos confirmar?`;
    window.open(`https://wa.me/55${professional.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getAvailableTimesForDay = (day: DaySlot) => {
    const configuredHours = professional.workHours?.[day.weekday] || [];
    const bookedTimes = appointments
        .filter(apt => apt.data && apt.data.includes(day.date))
        .map(apt => apt.hora);
    return configuredHours.filter(time => !bookedTimes.includes(time));
  };


  if (isLoading) return <LoadingScreen />;

  // --- NOT FOUND CHECK ---
  // If we are in public mode, but the professional ID returned is "temp" (default), it means the user wasn't found in DB.
  // EXCEPTION: If the slug is 'novo-estudio', we allow it as a preview/demo.
  if (isPublicMode && professional.id === 'temp' && publicProfileId !== 'novo-estudio') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 text-stone-600">
            <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mb-6">
                <SearchX size={40} className="text-stone-400" />
            </div>
            <h1 className="text-xl font-bold mb-2 text-stone-800">Página não encontrada</h1>
            <p className="text-sm text-center max-w-xs mb-8">
                O link que você acessou não corresponde a nenhum estúdio ativo. Verifique o endereço e tente novamente.
            </p>
            <a href="/" className="text-xs font-bold uppercase text-rose-500 hover:underline">
                Voltar ao Início
            </a>
        </div>
      );
  }

  // --- ACCOUNT INACTIVE CHECK ---
  if (professional.status === 'inactive') {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                  <Ban size={32} className="text-stone-400" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-stone-800 mb-2">Temporariamente indisponível</h1>
              <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-8">
                  Esta página não está acessível no momento. Entre em contato com o administrador para mais informações.
              </p>
              {isOwner && (
                  <button onClick={handleLogout} className="text-xs font-bold uppercase text-stone-400 hover:text-stone-600 transition-colors">
                      Sair da conta
                  </button>
              )}
          </div>
      );
  }

  // --- ADMIN RENDER ---
  if (isAdminMode && isOwner) {
      return (
          <AdminDashboard 
            data={{ professional, services, works, appointments, testimonials, careItems: [] }} 
            onUpdate={loadData} 
            onLogout={() => setIsAdminMode(false)}
            theme={theme}
            userId={userId} 
          />
      );
  }

  // --- PUBLIC RENDER (CLONE OF INITIAL PAGE) ---
  return (
    <div className="min-h-screen font-sans pb-10 transition-colors duration-500" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <header className="relative h-[55vh] flex items-center justify-center text-center overflow-hidden rounded-b-[3rem] shadow-2xl" style={{ boxShadow: `0 20px 40px -10px ${theme.accent}30` }}>
        <div className="absolute inset-0 bg-[#1a1a1a]">
            {professional.fotoPerfil && <img src={professional.fotoPerfil} className="w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom" />}
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.headerGradient}`} />
        </div>
        
        {/* Logout Button (ONLY FOR OWNER) */}
        {isOwner && (
            <button 
                onClick={handleLogout}
                className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:bg-black/50 transition-all border border-white/20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
                <LogOut size={14} /> Sair
            </button>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center h-full pb-20 px-4 animate-fade-in-up w-full">
            {professional.logo ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-4 ring-2 ring-white/20">
                    <img src={professional.logo} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl mb-4">
                    <span className="font-serif text-3xl" style={{ color: theme.accent }}>Logo</span>
                </div>
            )}
            <h1 className="text-4xl font-serif drop-shadow-lg tracking-wide mb-2 text-white">{professional.nome}</h1>
            <div className="flex items-center gap-3 opacity-90">
                <div className="h-[1px] w-8" style={{ backgroundColor: theme.accent }}></div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-light text-center leading-relaxed max-w-[250px] text-white/90">{professional.especializacao}</p>
                <div className="h-[1px] w-8" style={{ backgroundColor: theme.accent }}></div>
            </div>
        </div>
      </header>

      <main className="px-5 -mt-16 relative z-20 max-w-md mx-auto space-y-3">
        
        {/* CARD 1: QUEM SOU EU */}
        <AccordionItem id="profile" title="Quem Sou Eu" icon={<User size={16}/>} isOpen={openSection === 'profile'} onToggle={() => setOpenSection(openSection === 'profile' ? null : 'profile')} theme={theme}>
            <div className="flex flex-col items-center text-center gap-6">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2" style={{ ['--tw-ring-color' as any]: theme.accent }}>
                    {professional.fotoBio ? <img src={professional.fotoBio} className="w-full h-full object-cover" /> : <User size={40} className="m-auto" style={{ color: theme.subtext }}/>}
                </div>
                <div className="space-y-2">
                     <h3 className="font-serif font-bold text-lg" style={{ color: theme.text }}>Minha Trajetória</h3>
                     <p className="text-sm leading-7 font-light whitespace-pre-line text-justify" style={{ color: theme.text }}>{professional.bio}</p>
                </div>
                
                {/* Depoimentos Marquee */}
                {testimonials.length > 0 && (
                    <div className="w-full pt-8 pb-4 overflow-hidden relative border-t mt-4" style={{ borderColor: theme.border }}>
                         <div className="absolute left-0 top-8 bottom-0 w-8 z-10 bg-gradient-to-r from-white to-transparent opacity-80" />
                         <div className="absolute right-0 top-8 bottom-0 w-8 z-10 bg-gradient-to-l from-white to-transparent opacity-80" />
                         
                         <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6 text-center" style={{ color: theme.subtext }}>O que dizem sobre mim</h4>
                         
                         <div className="flex animate-scroll w-max hover:[animation-play-state:paused]">
                            <div className="flex gap-4 px-4">
                                {testimonials.map(t => (
                                    <div key={t.id} className="w-64 p-5 rounded-xl border relative shadow-sm flex-shrink-0" style={{ backgroundColor: `${theme.bg}`, borderColor: theme.border }}>
                                        <Quote size={24} className="absolute -top-3 -left-2 fill-current" style={{ color: theme.accent }} />
                                        <Quote size={24} className="absolute -bottom-3 -right-2 fill-current rotate-180 opacity-30" style={{ color: theme.accent }} />
                                        <p className="text-xs italic mb-4 leading-relaxed font-light mt-2 line-clamp-4" style={{ color: theme.text }}>"{t.text}"</p>
                                        <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: theme.border }}>
                                            <span className="text-[11px] font-bold uppercase" style={{ color: theme.text }}>{t.clientName}</span>
                                            <div className="flex">{[...Array(t.rating)].map((_, i) => <Star key={i} size={10} fill={theme.accent} stroke="none"/>)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 px-4">
                                {testimonials.map(t => (
                                    <div key={`dup-${t.id}`} className="w-64 p-5 rounded-xl border relative shadow-sm flex-shrink-0" style={{ backgroundColor: `${theme.bg}`, borderColor: theme.border }}>
                                        <Quote size={24} className="absolute -top-3 -left-2 fill-current" style={{ color: theme.accent }} />
                                        <Quote size={24} className="absolute -bottom-3 -right-2 fill-current rotate-180 opacity-30" style={{ color: theme.accent }} />
                                        <p className="text-xs italic mb-4 leading-relaxed font-light mt-2 line-clamp-4" style={{ color: theme.text }}>"{t.text}"</p>
                                        <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: theme.border }}>
                                            <span className="text-[11px] font-bold uppercase" style={{ color: theme.text }}>{t.clientName}</span>
                                            <div className="flex">{[...Array(t.rating)].map((_, i) => <Star key={i} size={10} fill={theme.accent} stroke="none"/>)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                )}
            </div>
        </AccordionItem>

        {/* CARD 2: AGENDAR */}
        <AccordionItem id="booking" title="Agendar Horário" icon={<CalendarDays size={16}/>} isOpen={openSection === 'booking'} onToggle={() => setOpenSection(openSection === 'booking' ? null : 'booking')} highlight theme={theme}>
            {bookingStep === 0 && (
                <div className="space-y-3">
                    {services.map(s => (
                        <div key={s.id} onClick={() => setSelectedServices(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} className={`p-4 rounded-2xl border flex justify-between items-center cursor-pointer transition-all duration-300`} style={{ borderColor: selectedServices.includes(s.id) ? theme.accent : theme.border, backgroundColor: selectedServices.includes(s.id) ? `${theme.accent}10` : 'transparent' }}>
                            <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300`} style={{ backgroundColor: selectedServices.includes(s.id) ? theme.accent : 'transparent', borderColor: selectedServices.includes(s.id) ? theme.accent : theme.subtext }}>{selectedServices.includes(s.id) && <Check size={12} className="text-white"/>}</div>
                                <div><p className="text-sm font-bold" style={{ color: theme.text }}>{s.nome}</p><p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: theme.subtext }}><Clock size={10}/> {s.duracao}</p></div>
                            </div>
                            <span className="text-sm font-bold" style={{ color: theme.accent }}>R$ {s.preco}</span>
                        </div>
                    ))}
                    <button disabled={selectedServices.length === 0} onClick={() => setBookingStep(1)} className="w-full text-white py-4 rounded-2xl text-xs font-bold uppercase mt-6 disabled:opacity-50 transition-all shadow-xl" style={{ backgroundColor: theme.button }}>Próximo</button>
                </div>
            )}
            {bookingStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase ml-2" style={{ color: theme.subtext }}>Seu Nome</label><input value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="w-full p-4 border rounded-2xl text-sm outline-none" style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase ml-2" style={{ color: theme.subtext }}>WhatsApp</label><input type="tel" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} className="w-full p-4 border rounded-2xl text-sm outline-none" style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }} /></div>
                    <div className="flex gap-3 pt-2"><button onClick={() => setBookingStep(0)} className="flex-1 py-4 text-xs font-bold uppercase" style={{ color: theme.subtext }}>Voltar</button><button disabled={!userData.name || !userData.phone} onClick={() => setBookingStep(2)} className="flex-1 text-white py-4 rounded-2xl text-xs font-bold uppercase disabled:opacity-50 shadow-lg" style={{ backgroundColor: theme.button }}>Próximo</button></div>
                </div>
            )}
            {bookingStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {NEXT_DAYS.map((day, idx) => {
                            const availableTimes = getAvailableTimesForDay(day);
                            const isConfiguredOpen = (professional.workHours?.[day.weekday] || []).length > 0;
                            
                            if (!isConfiguredOpen) return null;

                            return (
                                <button key={idx} onClick={() => { setSelectedDay(day); setSelectedTime(null); }} className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all ${selectedDay?.date === day.date ? 'shadow-md scale-105' : 'opacity-70'}`} style={{ backgroundColor: selectedDay?.date === day.date ? theme.button : theme.card, borderColor: selectedDay?.date === day.date ? theme.button : theme.border }}>
                                    <span className="text-[10px] font-bold uppercase" style={{ color: selectedDay?.date === day.date ? theme.buttonText : theme.subtext }}>{day.weekday}</span>
                                    <span className="text-sm font-bold" style={{ color: selectedDay?.date === day.date ? theme.buttonText : theme.text }}>{day.date}</span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedDay && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-3 gap-2">
                                {getAvailableTimesForDay(selectedDay).map(time => (
                                    <button key={time} onClick={() => setSelectedTime(time)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedTime === time ? 'shadow-md' : ''}`} style={{ backgroundColor: selectedTime === time ? theme.accent : theme.bg, color: selectedTime === time ? theme.buttonText : theme.text, borderColor: selectedTime === time ? theme.accent : theme.border }}>
                                        {time}
                                    </button>
                                ))}
                            </div>
                            {getAvailableTimesForDay(selectedDay).length === 0 && (
                                <p className="text-center text-xs py-4 opacity-50">Sem horários disponíveis para este dia.</p>
                            )}
                        </div>
                    )}
                    <div className="flex gap-3 pt-4"><button onClick={() => setBookingStep(1)} className="flex-1 py-4 text-xs font-bold uppercase" style={{ color: theme.subtext }}>Voltar</button><button disabled={!selectedDay || !selectedTime} onClick={finishBooking} className="flex-1 text-white py-4 rounded-2xl text-xs font-bold uppercase disabled:opacity-50 shadow-lg" style={{ backgroundColor: theme.accent }}>Confirmar</button></div>
                </div>
            )}
            {bookingStep === 3 && (
                <div className="text-center py-8 animate-fade-in">
                    <div className="w-20 h-20 bg-[#F0FFF4] text-[#48BB78] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#48BB78]/10"><Check size={40}/></div>
                    <h3 className="font-serif text-2xl font-bold mb-3" style={{ color: theme.text }}>Agendamento Realizado!</h3>
                    <p className="text-xs mb-8 max-w-xs mx-auto leading-relaxed" style={{ color: theme.subtext }}>Seu horário está pré-reservado. Clique abaixo para confirmar os detalhes no WhatsApp.</p>
                    <button onClick={openWhatsAppClient} className="w-full bg-[#25D366] text-white py-4 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-3 mb-4 hover:bg-[#20BD5A] transition-colors shadow-xl shadow-[#25D366]/20">
                        <MessageCircle size={18} /> Enviar no WhatsApp
                    </button>
                    <button onClick={() => {setBookingStep(0); setOpenSection(null); setSelectedServices([]);}} className="text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors" style={{ color: theme.subtext }}>
                        <Home size={14} /> Voltar ao Início
                    </button>
                </div>
            )}
        </AccordionItem>

        {/* CARD 3: COMO CHEGAR */}
        <AccordionItem id="location" title="Como Chegar" icon={<MapPin size={16}/>} isOpen={openSection === 'location'} onToggle={() => setOpenSection(openSection === 'location' ? null : 'location')} theme={theme}>
            <div className="text-center space-y-5">
                <p className="text-sm font-light" style={{ color: theme.text }}>{professional.endereco}</p>
                <div className="w-full h-48 rounded-2xl overflow-hidden border relative shadow-inner" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                    {professional.endereco ? (
                        <iframe width="100%" height="100%" frameBorder="0" style={{border:0}} src={`https://maps.google.com/maps?q=${encodeURIComponent(professional.endereco)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs" style={{ color: theme.subtext }}>Mapa indisponível</div>
                    )}
                </div>
                <a 
                    href={professional.linkMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.endereco)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-white px-8 py-3 rounded-xl text-xs font-bold uppercase transition-all shadow-lg hover:scale-105 active:scale-95" 
                    style={{ backgroundColor: theme.button }}
                >
                    Abrir no Google Maps
                </a>
            </div>
        </AccordionItem>

        {/* CARD 4: CUIDADOS PÓS */}
        <AccordionItem id="care" title="Cuidados Pós" icon={<Award size={16}/>} isOpen={openSection === 'care'} onToggle={() => setOpenSection(openSection === 'care' ? null : 'care')} theme={theme}>
            <div className="space-y-4">
                <p className="text-xs italic mb-4" style={{ color: theme.subtext }}>Cuidados específicos para os procedimentos disponíveis:</p>
                {services.filter(s => s.postCare).map(s => (
                    <div key={s.id} className="p-4 rounded-xl border bg-white/50" style={{ borderColor: theme.border }}>
                        <h4 className="font-bold text-xs uppercase mb-2" style={{ color: theme.text }}>{s.nome}</h4>
                        <p className="text-sm font-light leading-relaxed" style={{ color: theme.text }}>{s.postCare}</p>
                    </div>
                ))}
                {services.every(s => !s.postCare) && <p className="text-xs text-center py-4 opacity-50">Nenhuma instrução cadastrada.</p>}
            </div>
        </AccordionItem>
      </main>

      <footer className="mt-16 pb-10">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6 opacity-50">
                <div className="h-px w-12" style={{ backgroundColor: theme.accent }}></div>
                <Star size={12} style={{ color: theme.accent, fill: theme.accent }} />
                <div className="h-px w-12" style={{ backgroundColor: theme.accent }}></div>
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] mb-6" style={{ color: theme.subtext }}>Portfólio</h3>
            <Carousel works={works} theme={theme} />
        </div>
        
        {/* BUTTON: ACESSAR PAINEL ADMIN (ONLY FOR OWNER) */}
        {isOwner && (
            <div className="flex justify-center mt-8 px-4">
                <button 
                    onClick={handleAdminAccess} 
                    className="w-full max-w-xs flex items-center justify-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-black transition-all transform hover:scale-[1.02] active:scale-95"
                >
                    <Settings size={18} className="text-stone-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Acessar Painel Admin</span>
                </button>
            </div>
        )}
      </footer>

      {/* Security Modal for Admin Access */}
      <Modal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} title="Segurança" theme={theme}>
          <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center justify-center mb-4 text-center">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-2">
                      <Lock size={20} className="text-rose-400" />
                  </div>
                  <p className="text-xs text-stone-500">Confirme sua senha para acessar o painel.</p>
              </div>
              
              <div className="space-y-3">
                  <Input 
                    type="password" 
                    label="Sua Senha" 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-rose-400 border-rose-400' : 'border-stone-300'}`}>
                          {rememberMe && <Check size={10} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                      <span className="text-xs text-stone-500 select-none">Lembrar-me neste dispositivo</span>
                  </label>
              </div>

              {authError && <p className="text-xs text-red-500 text-center bg-red-50 p-2 rounded-lg">{authError}</p>}

              <Button onClick={handleVerifyPassword} disabled={!confirmPassword || verifying} className="w-full mt-2">
                  {verifying ? 'Verificando...' : 'Acessar Painel'}
              </Button>
          </div>
      </Modal>

    </div>
  );
};

export default App;
