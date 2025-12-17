
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
    if (publicUserId) return;

    let isMounted = true;

    // 1. Setup Auth Listener
    const { data: { subscription } } = api.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);

      if (session?.user) {
          // Wrap Admin check in a timeout promise so it doesn't hang forever
          try {
             const checkAdminPromise = api.isSuperAdmin(session.user.id, session.user.email);
             // Timeout after 3 seconds, default to false
             const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000));
             
             const isAdmin = await Promise.race([checkAdminPromise, timeoutPromise]);
             
             if (isMounted) setIsSuperAdmin(isAdmin);
          } catch (e) {
             console.warn("Admin check skipped due to error/timeout");
             if (isMounted) setIsSuperAdmin(false);
          }
      } else {
          if (isMounted) setIsSuperAdmin(false);
      }

      if (isMounted) setIsLoading(false);
    });

    return () => {
        isMounted = false;
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
