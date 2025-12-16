
import React, { useState } from 'react';
import { api } from '../services/api';
import { Button, Input, LoadingScreen } from '../components/Shared';
import { Sparkles, Lock, Mail, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const cleanEmail = email.trim();

    try {
      if (isLogin) {
        const { data, error } = await api.signIn(cleanEmail, password);
        if (error) throw error;
        // Session update in index.tsx handles redirect
      } else {
        // Normal User Signup
        const { data, error } = await api.signUp(cleanEmail, password);
        if (error) throw error;
        
        if (data.session) {
           setMessage({ type: 'success', text: 'Conta criada e logada com sucesso!' });
        } else {
           setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.' });
           setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMsg = error.message;
      if (errorMsg === 'Invalid login credentials') errorMsg = 'E-mail ou senha incorretos.';
      if (errorMsg === 'User already registered') errorMsg = 'Este e-mail já está cadastrado.';
      setMessage({ type: 'error', text: errorMsg || 'Erro ao processar solicitação.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
      // Just visual toggle now, functionally it's the same login form
      setIsSuperAdminMode(!isSuperAdminMode);
      setIsLogin(true); 
      setMessage(null);
      // Auto-fill removed to allow typing other admin emails
      setEmail(''); 
      setPassword('');
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-rose-50 font-sans transition-all duration-500 relative">
      
      {/* Super Admin Toggle Lock */}
      <button 
        onClick={toggleMode} 
        className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isSuperAdminMode ? 'bg-stone-800 text-white' : 'text-rose-200 hover:text-rose-400'}`}
        title={isSuperAdminMode ? "Sair do modo Admin" : "Acesso Super Admin"}
      >
          <Lock size={16} />
      </button>

      <div className={`w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border animate-fade-in-up transition-colors duration-500 ${isSuperAdminMode ? 'border-stone-800' : 'border-rose-100'}`}>
        
        {/* Header Visual */}
        <div className={`relative h-48 flex flex-col items-center justify-center text-white overflow-hidden transition-colors duration-500 ${isSuperAdminMode ? 'bg-stone-900' : 'bg-rose-400'}`}>
            {!isSuperAdminMode && (
                <>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-400 to-transparent"></div>
                </>
            )}
            
            <div className={`relative z-10 p-4 backdrop-blur-md rounded-full mb-3 ring-4 ring-white/10 ${isSuperAdminMode ? 'bg-stone-800' : 'bg-white/20'}`}>
                {isSuperAdminMode ? <Lock size={32} /> : <Sparkles size={32} />}
            </div>
            <h1 className="relative z-10 font-serif text-3xl font-bold tracking-wide">
                {isSuperAdminMode ? 'Super Admin' : 'Lumina'}
            </h1>
            <p className="relative z-10 text-xs uppercase tracking-[0.3em] opacity-90 mt-1">
                {isSuperAdminMode ? 'Acesso Restrito' : 'Studio Manager'}
            </p>
        </div>

        {/* Form Container */}
        <div className="p-8">
            <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isSuperAdminMode ? 'text-stone-800' : 'text-stone-800'}`}>
                {isSuperAdminMode ? (
                     'Login Administrativo'
                ) : isLogin ? (
                    <><LogIn size={20} className="text-rose-400"/> Bem-vindo(a)</>
                ) : (
                    <><UserPlus size={20} className="text-rose-400"/> Criar Conta</>
                )}
            </h2>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                {isSuperAdminMode 
                    ? 'Acesso exclusivo para administradores.'
                    : isLogin 
                        ? 'Acesse seu painel para gerenciar agendamentos e personalizar seu site.' 
                        : 'Crie seu espaço exclusivo. Seus dados e agendamentos separados e seguros.'
                }
            </p>

            {message && (
                <div className={`p-4 rounded-xl text-xs mb-6 flex gap-3 items-start ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                    {message.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5"/> : <CheckCircle2 size={16} className="shrink-0 mt-0.5"/>}
                    <span>{message.text}</span>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative group">
                    <Mail className={`absolute left-3 top-9 text-stone-400 transition-colors ${isSuperAdminMode ? 'group-focus-within:text-stone-800' : 'group-focus-within:text-rose-400'}`} size={16} />
                    <Input 
                        label="E-mail" 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="pl-10" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="relative group">
                    <Lock className={`absolute left-3 top-9 text-stone-400 transition-colors ${isSuperAdminMode ? 'group-focus-within:text-stone-800' : 'group-focus-within:text-rose-400'}`} size={16} />
                    <Input 
                        label="Senha" 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-stone-400 hover:text-stone-600 focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                <Button className={`w-full mt-2 group ${isSuperAdminMode ? '!bg-stone-900 !shadow-stone-500/50' : ''}`} type="submit">
                    {isLogin ? 'Entrar' : 'Cadastrar'} 
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
            </form>

            {/* Hide Sign Up link if in Admin Mode, because Admins are created internally */}
            {!isSuperAdminMode && (
                <div className="mt-8 text-center pt-6 border-t border-dashed border-stone-200">
                    <p className="text-xs text-stone-500 mb-3">
                        {isLogin ? 'Ainda não tem um estúdio?' : 'Já possui uma conta?'}
                    </p>
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
                        className={`text-xs font-bold uppercase tracking-wider hover:underline transition-all text-rose-500 hover:text-rose-600`}
                    >
                        {isLogin ? 'Criar minha conta grátis' : 'Fazer Login'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
