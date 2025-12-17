
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthScreen } from './views/AuthScreen';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { api } from './services/api';
import { LoadingScreen } from './components/Shared';
import { WifiOff } from 'lucide-react';

const Root = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // Initialize publicUserId directly from URL
  const [publicUserId, setPublicUserId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('u');
  });

  useEffect(() => {
    let isMounted = true;
    
    if (publicUserId) {
        setIsLoading(false);
        return;
    }

    const initApp = async () => {
        try {
            const { data, error } = await api.getSession();
            if (error) throw error;
            
            const currentSession = data?.session;
            if (isMounted) setSession(currentSession);

            if (currentSession?.user) {
                // Defensive: If this check fails, user just sees normal dashboard, not a crash
                try {
                    const isAdmin = await api.isSuperAdmin(currentSession.user.id, currentSession.user.email);
                    if (isMounted) setIsSuperAdmin(isAdmin);
                } catch (e) {
                    console.warn("Admin check failed", e);
                }
            }
        } catch (error: any) {
            console.error("Initialization error:", error);
            if (error.message?.includes("fetch")) {
                setConnectionError(true);
            }
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };

    initApp();

    const { data: { subscription } } = api.onAuthStateChange(async (_event, session) => {
      if (isMounted && !publicUserId) {
          setSession(session);
          if (session?.user) {
              try {
                const isAdmin = await api.isSuperAdmin(session.user.id, session.user.email);
                setIsSuperAdmin(isAdmin);
              } catch { setIsSuperAdmin(false); }
          } else {
              setIsSuperAdmin(false);
          }
      }
    });

    return () => {
        isMounted = false;
        subscription.unsubscribe();
    };
  }, [publicUserId]);

  const handleLogout = async () => {
      await api.signOut();
      setSession(null);
      setIsSuperAdmin(false);
      setPublicUserId(null);
      window.history.pushState({}, '', window.location.pathname);
  };

  if (connectionError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 text-center">
              <WifiOff size={48} className="text-stone-300 mb-4" />
              <h1 className="text-xl font-bold text-stone-800 mb-2">Erro de Conexão</h1>
              <p className="text-stone-500 mb-6">Não foi possível conectar ao servidor. Verifique sua internet ou se o serviço está disponível.</p>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-stone-800 text-white rounded-xl">Tentar Novamente</button>
          </div>
      );
  }

  if (isLoading) return <LoadingScreen />;

  if (publicUserId) return <App session={null} publicProfileId={publicUserId} />;

  if (isSuperAdmin) return <SuperAdminDashboard onLogout={handleLogout} />;

  if (!session) return <AuthScreen />;

  return <App session={session} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
