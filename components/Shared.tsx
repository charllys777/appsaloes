import React, { useState } from 'react';
import { Loader2, ChevronDown, Image as ImageIcon, Plus, Edit2 } from 'lucide-react';
import { api } from '../services/api';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyles = "px-4 py-3 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-rose-400 text-white shadow-lg shadow-rose-200 hover:bg-rose-500",
    secondary: "bg-stone-800 text-white shadow-lg hover:bg-stone-700",
    outline: "border border-stone-200 text-stone-600 hover:bg-stone-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-1">{label}</label>}
    <input 
      className={`w-full p-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all text-sm ${className}`}
      {...props}
    />
  </div>
);

export const ImagePicker: React.FC<{
  label?: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'video' | 'auto';
  className?: string;
}> = ({ label, value, onChange, aspect = 'square', className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const url = await api.uploadImage(e.target.files[0]);
        onChange(url);
      } catch (error) {
        alert("Erro ao enviar imagem. Verifique se é menor que 5MB.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">{label}</label>}
      <label className={`
        relative block w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 transition-all hover:border-rose-300 hover:bg-rose-50 group
        ${aspect === 'square' ? 'aspect-square' : aspect === 'video' ? 'aspect-video' : 'h-32'}
      `}>
        {/* Hidden Input */}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={isUploading}
          className="hidden" 
        />

        {/* Content State */}
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
            <span className="mt-2 text-xs font-medium text-stone-500">Enviando...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-sm">
                <Edit2 size={16} />
                <span className="text-xs font-bold uppercase">Trocar</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 transition-colors group-hover:text-rose-400">
            {aspect === 'square' ? <Plus size={32} /> : <ImageIcon size={32} />}
            <span className="mt-2 text-xs font-bold uppercase tracking-wider">Adicionar Foto</span>
          </div>
        )}
      </label>
    </div>
  );
};

export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-stone-50 flex flex-col items-center justify-center z-50">
    <Loader2 className="w-10 h-10 text-rose-400 animate-spin mb-4" />
    <p className="text-stone-500 animate-pulse">Carregando...</p>
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-light text-stone-800 border-l-4 border-rose-300 pl-3 mb-4 uppercase tracking-widest">
    {children}
  </h2>
);

export const AccordionItem: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme: any;
  highlight?: boolean;
  badgeCount?: number;
}> = ({ id, title, icon, isOpen, onToggle, highlight, children, theme, badgeCount }) => (
  <div className={`w-full rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'shadow-lg ring-1 my-3' : 'shadow-sm hover:shadow-md my-2 border-b'}`} style={{ backgroundColor: theme.card, borderColor: isOpen ? theme.accent : theme.border, boxShadow: isOpen ? `0 10px 25px -5px ${theme.accent}30` : 'none' }}>
    <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 transition-colors duration-300 group" style={{ backgroundColor: isOpen ? theme.bg : theme.card }}>
      <span className="font-serif font-medium tracking-wide text-sm flex items-center gap-3" style={{ color: theme.text }}>
        <span className={`p-2 rounded-full transition-all duration-500 ${isOpen ? 'shadow-md' : 'group-hover:scale-110'}`} style={{ backgroundColor: isOpen ? theme.accent : theme.bg, color: isOpen ? theme.buttonText : theme.subtext }}>{React.cloneElement(icon as any, { size: 16 })}</span>
        {title}
      </span>
      <div className="flex items-center gap-3">
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white bg-red-500 shadow-sm animate-pulse">
            {badgeCount}
          </span>
        )}
        <ChevronDown size={16} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} style={{ color: isOpen ? theme.accent : theme.subtext }} />
      </div>
    </button>
    
    {/* Grid Transition for smooth height animation */}
    <div 
      className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      style={{ backgroundColor: theme.bg }}
    >
      <div className="overflow-hidden min-h-0">
        <div className="p-5 pt-2 border-t" style={{ borderColor: theme.border, color: theme.text }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);