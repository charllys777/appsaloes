
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
    const checkSession = async () => {
        // 1. Check for Public URL param (?u=USER_ID)
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('u');

        if (uid) {
            setPublicUserId(uid);
            setIsLoading(false);
            return;
        }

        // 2. Check Session
        const { data: { session } } = await api.getSession();
        setSession(session);

        if (session?.user) {
            // Check Super Admin Permission
            try {
                const isAdmin = await api.isSuperAdmin(session.user.id, session.user.email);
                setIsSuperAdmin(isAdmin);
            } catch (e) {
                console.error("Error checking permissions", e);
                setIsSuperAdmin(false);
            }
        }

        setIsLoading(false);
    };

    checkSession();

    const { data: { subscription } } = api.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
          const isAdmin = await api.isSuperAdmin(session.user.id, session.user.email);
          setIsSuperAdmin(isAdmin);
      } else {
          setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
      await api.signOut();
      window.location.href = window.location.origin;
  };

  if (isLoading) return <LoadingScreen />;

  // Scenario A: Super Admin Login (Either Charllys or DB Permission)
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
