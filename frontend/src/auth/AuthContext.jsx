import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { acceptInvitation, requestPasswordReset, resetPassword, signIn as apiSignIn, signOut as apiSignOut } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { clearAuth, getStoredUser, getToken, setAuth } from './storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
      setUser(null);
      setToken(null);
    });
    setInitializing(false);
  }, []);

  const signIn = async (email, password) => {
    const result = await apiSignIn(email, password);
    setAuth(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
    return result;
  };

  const signOut = async () => {
    try {
      await apiSignOut();
    } catch {
      // ignore network/signout errors, clear local session regardless
    } finally {
      clearAuth();
      setUser(null);
      setToken(null);
    }
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token,
    initializing,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword,
    acceptInvitation,
  }), [user, token, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
