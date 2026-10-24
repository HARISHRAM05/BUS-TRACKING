// Holds the logged-in user and JWT; exposes login / signup / logout to the whole app
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // On first load, if a token is saved, ask the server who we are
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  // The axios interceptor fires this when the server answers 401
  useEffect(() => {
    window.addEventListener('kbtp:unauthorized', logout);
    return () => window.removeEventListener('kbtp:unauthorized', logout);
  }, [logout]);

  const login = async (credentials) => saveSession(await authApi.login(credentials));
  const signup = async (details) => saveSession(await authApi.signup(details));

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'Admin',
    login,
    signup,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Where each role lands after login
export const homePathFor = (user) => (user?.role === 'Admin' ? '/admin' : '/dashboard');
