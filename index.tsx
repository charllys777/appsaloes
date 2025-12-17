
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthScreen } from './views/AuthScreen';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { api } from './services/api';
import { LoadingScreen } from './components/Shared';

const Root = () => {
  // Get URL param immediately
  const searchParams = new URLSearchParams(window.location.search);
  const urlPublicId = searchParams.get('u');

  // If public ID exists, we are NOT loading. We render App immediately.
  const [isLoading, setIsLoading] = useState(!urlPublicId);
  const [session, setSession] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [publicUserId, setPublicUserId] = useState<string | null>(urlPublicId);

  useEffect(() => {
    // If public mode, don't run auth checks
    if (publicUserId) {
        setIsLoading(false);
        return;
    }

    let isMounted = true;
    
    // SAFETY NET: Force stop loading after 4 seconds no matter what
    const safetyTimeout = setTimeout(() => {
        if (isMounted && isLoading) setIsLoading(false);
    }, 4000);

    // Helper to process session state cleanly
    const handleSessionCheck = async (currentSession: any) => {
        if (!isMounted) return;
        
        // STRICT CHECK: The session MUST have a user object. If not, treat as null.
        const validSession = currentSession?.user ? currentSession : null;
        
        setSession(validSession);

        if (validSession?.user) {
            // Check Admin Privileges with a timeout to prevent hanging
            try {
               const checkAdminPromise = api.isSuperAdmin(validSession.user.id, validSession.user.email);
               // Timeout after 3 seconds, default to false
               const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000));
               
               const isAdmin = await Promise.race([checkAdminPromise, timeoutPromise]);
               
               if (isMounted) setIsSuperAdmin(isAdmin);
            } catch (e) {
               if (isMounted) setIsSuperAdmin(false);
            }
        } else {
            if (isMounted) setIsSuperAdmin(false);
        }

        // IMPORTANT: Always stop loading after the check
        if (isMounted) setIsLoading(false);
    };

    // 1. Check Session Immediately
    api.getSession().then(({ data }) => {
        // Handle potential undefined data safely
        handleSessionCheck(data?.session);
    }).catch(() => {
        if (isMounted) setIsLoading(false);
    });

    // 2. Setup Auth Listener
    const { data: { subscription } } = api.onAuthStateChange((_event, session) => {
        handleSessionCheck(session);
    });

    return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
    };
  }, [publicUserId]);

  const handleLogout = async () => {
      setIsLoading(true);
      try {
        await api.signOut();
      } catch(e) { console.error(e); }
      
      setSession(null);
      setIsSuperAdmin(false);
      setPublicUserId(null);
      
      // Clean URL without reloading page
      const url = new URL(window.location.href);
      url.searchParams.delete('u');
      window.history.pushState({}, '', url);
      
      setIsLoading(false);
  };

  if (isLoading) return <LoadingScreen />;

  if (publicUserId) return <App session={null} publicProfileId={publicUserId} />;

  if (isSuperAdmin) return <SuperAdminDashboard onLogout={handleLogout} />;

  // STRICT AUTH CHECK: If session is null OR session.user is missing, show AuthScreen
  if (!session || !session.user) return <AuthScreen />;

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
