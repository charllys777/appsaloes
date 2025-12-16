import React, { useState, useMemo } from 'react';
import { Service, Professional } from '../types';
import { Button, Input } from './Shared';
import { Check, Calendar, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface BookingFlowProps {
  services: Service[];
  professional: Professional;
  onClose: () => void;
  userId: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ services, professional, onClose, userId }) => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: Format currency
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Helper: Calculate total
  const total = useMemo(() => {
    return services
      .filter(s => selectedServices.includes(s.id))
      .reduce((acc, curr) => acc + curr.preco, 0);
  }, [selectedServices, services]);

  // Helper: Format Phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;
    setClientPhone(val);
  };

  // Generate available times (09:00 to 18:00)
  const availableTimes = useMemo(() => {
    const times = [];
    for (let i = 9; i <= 18; i++) {
      times.push(`${i.toString().padStart(2, '0')}:00`);
      if (i !== 18) times.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return times;
  }, []);

  const handleNext = () => {
    if (step === 1 && selectedServices.length === 0) return;
    if (step === 2 && (!clientName || clientPhone.length < 14)) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const serviceNames = services.filter(s => selectedServices.includes(s.id)).map(s => s.nome);
    
    const appointmentData = {
      data: date,
      hora: time,
      clienteNome: clientName,
      clienteTelefone: clientPhone,
      servicos: serviceNames,
      valorTotal: total
    };

    try {
      // 1. Send to API
      await api.postData('create_appointment', appointmentData, userId);

      // 2. WhatsApp Redirect
      const message = `Olá! Gostaria de confirmar meu agendamento:%0A%0A*Nome:* ${clientName}%0A*Data:* ${date.split('-').reverse().join('/')} às ${time}%0A*Serviços:* ${serviceNames.join(', ')}%0A*Total:* ${formatBRL(total)}`;
      const wppUrl = `https://wa.me/${professional.whatsapp.replace(/\D/g, '')}?text=${message}`;
      
      window.location.href = wppUrl;
      onClose(); // Ideally this won't be seen as we redirect
    } catch (error) {
      alert("Erro ao realizar agendamento. Tente novamente ou entre em contato direto.");
      setIsSubmitting(false);
    }
  };

  // Step 1: Services
  if (step === 1) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <p className="text-sm text-stone-500 mb-2">Selecione os procedimentos:</p>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {services.map(service => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <div 
                key={service.id}
                onClick={() => {
                  setSelectedServices(prev => 
                    isSelected ? prev.filter(id => id !== service.id) : [...prev, service.id]
                  );
                }}
                className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'border-rose-400 bg-rose-50' : 'border-stone-200 bg-white'}`}
              >
                <div>
                  <h4 className="font-medium text-stone-800">{service.nome}</h4>
                  <p className="text-xs text-stone-500">{service.duracao}</p>
                </div>
                <div className="text-right">
                  <span className="block font-semibold text-rose-500">{formatBRL(service.preco)}</span>
                  {isSelected && <Check className="w-4 h-4 text-rose-500 ml-auto mt-1" />}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
            <div>
                <span className="text-xs text-stone-500 uppercase">Total Estimado</span>
                <p className="text-xl font-bold text-stone-800">{formatBRL(total)}</p>
            </div>
            <Button onClick={handleNext} disabled={selectedServices.length === 0} className="w-1/2">
                Continuar <ChevronRight size={18} />
            </Button>
        </div>
      </div>
    );
  }

  // Step 2: Info
  if (step === 2) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-2 mb-4 cursor-pointer text-stone-500" onClick={handleBack}>
            <ArrowLeft size={16} /> <span className="text-sm">Voltar</span>
        </div>
        
        <Input 
          label="Seu Nome Completo" 
          value={clientName} 
          onChange={e => setClientName(e.target.value)} 
          placeholder="Ex: Maria Silva"
        />
        <Input 
          label="Seu WhatsApp" 
          value={clientPhone} 
          onChange={handlePhoneChange} 
          placeholder="(11) 99999-9999"
          type="tel"
        />
        
        <Button onClick={handleNext} disabled={!clientName || clientPhone.length < 14} className="w-full mt-4">
            Escolher Horário
        </Button>
      </div>
    );
  }

  // Step 3: Schedule
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="flex items-center gap-2 mb-4 cursor-pointer text-stone-500" onClick={handleBack}>
            <ArrowLeft size={16} /> <span className="text-sm">Voltar</span>
        </div>

        <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Data</label>
            <div className="relative">
                <input 
                    type="date" 
                    className="w-full p-3 bg-white border border-stone-200 rounded-lg outline-none focus:border-rose-300"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <Calendar className="absolute right-3 top-3 text-stone-400 pointer-events-none" size={20}/>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Horário</label>
            <div className="grid grid-cols-4 gap-2">
                {availableTimes.map(t => (
                    <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`py-2 text-sm rounded border transition-colors ${time === t ? 'bg-rose-400 text-white border-rose-400' : 'bg-white text-stone-600 border-stone-200 hover:border-rose-200'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-stone-100 p-3 rounded-lg mt-4 text-sm text-stone-600">
            <p><strong>Resumo:</strong> {clientName}</p>
            <p>{selectedServices.length} procedimento(s) • {formatBRL(total)}</p>
        </div>

        <Button 
            onClick={handleSubmit} 
            disabled={!date || !time || isSubmitting} 
            className="w-full mt-2"
        >
            {isSubmitting ? 'Enviando...' : 'Confirmar no WhatsApp'}
        </Button>
    </div>
  );
};