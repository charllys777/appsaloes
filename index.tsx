
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthScreen } from './views/AuthScreen';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { api } from './services/api';
import { LoadingScreen } from './components/Shared';

const Root = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Initialize publicUserId directly from URL
  const [publicUserId, setPublicUserId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('u');
  });

  useEffect(() => {
    let isMounted = true;
    
    // If viewing a public profile, we don't need to wait for auth
    if (publicUserId) {
        setIsLoading(false);
        return;
    }

    // 1. Get initial session immediately (Optimistic UI)
    api.getSession().then(({ data: { session } }) => {
        if (isMounted && session) setSession(session);
    });

    // 2. Listen for Auth Changes (The Source of Truth)
    const { data: { subscription } } = api.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);

      if (session?.user) {
          try {
            // Check Admin Privileges
            const isAdmin = await api.isSuperAdmin(session.user.id, session.user.email);
            if (isMounted) setIsSuperAdmin(isAdmin);
          } catch (e) {
             console.warn("Admin check failed, defaulting to false", e);
             if (isMounted) setIsSuperAdmin(false);
          }
      } else {
          if (isMounted) setIsSuperAdmin(false);
      }

      // Always stop loading after auth check is done
      if (isMounted) setIsLoading(false);
    });

    return () => {
        isMounted = false;
        subscription.unsubscribe();
    };
  }, [publicUserId]);

  const handleLogout = async () => {
      setIsLoading(true);
      await api.signOut();
      setSession(null);
      setIsSuperAdmin(false);
      setPublicUserId(null);
      window.history.pushState({}, '', window.location.pathname);
      setIsLoading(false);
  };

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
