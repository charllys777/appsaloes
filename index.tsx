
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
  const [publicUserId, setPublicUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Failsafe: Force loading to stop after 5 seconds if something hangs
    const safetyTimer = setTimeout(() => {
        if (isMounted && isLoading) setIsLoading(false);
    }, 5000);

    const initApp = async () => {
        try {
            // 1. Check for Public URL param (?u=USER_ID)
            const params = new URLSearchParams(window.location.search);
            const uid = params.get('u');

            if (uid) {
                if (isMounted) setPublicUserId(uid);
                // We don't need to check session if viewing a public profile
                return; 
            }

            // 2. Check Session
            const { data } = await api.getSession();
            const currentSession = data?.session;
            
            if (isMounted) setSession(currentSession);

            if (currentSession?.user) {
                // Check Super Admin Permission
                try {
                    const isAdmin = await api.isSuperAdmin(currentSession.user.id, currentSession.user.email);
                    if (isMounted) setIsSuperAdmin(isAdmin);
                } catch (e) {
                    console.error("Error checking permissions", e);
                    if (isMounted) setIsSuperAdmin(false);
                }
            }
        } catch (error) {
            console.error("Initialization error:", error);
        } finally {
            // CRITICAL: Always turn off loading, even if errors occur
            if (isMounted) setIsLoading(false);
            clearTimeout(safetyTimer);
        }
    };

    initApp();

    const { data: { subscription } } = api.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
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
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
      try {
        await api.signOut();
      } catch (e) {
        console.error("Logout error", e);
      }
      // Simply clear state to show AuthScreen without forcing a URL redirect (avoids 404)
      setSession(null);
      setIsSuperAdmin(false);
      setPublicUserId(null);
  };

  if (isLoading) return <LoadingScreen />;

  // Scenario A: Super Admin Login
  if (isSuperAdmin) {
      return <SuperAdminDashboard onLogout={handleLogout} />;
  }

  // Scenario B: Client viewing a shared agenda link
  if (publicUserId) {
    return <App session={null} publicProfileId={publicUserId} />;
  }

  // Scenario C: Owner not logged in -> Show Auth Screen
  if (!session) {
    return <AuthScreen />;
  }

  // Scenario D: Owner logged in -> Show App in "Preview/Admin" mode
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
