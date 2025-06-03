import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

type User = {
  id: string;
  name: string;
  email: string;
  telegramId?: number;
  timeZoneId?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Функция для простого декодирования JWT payload (не для проверки подписи!)
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding JWT payload:", e);
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refetchUser = async () => {
    console.log('[AuthContext] Attempting to refetch user details...');
    try {
      const response = await axios.get(`${API_BASE_URL}/User/me`, { withCredentials: true });
      console.log('[AuthContext] Fetched user details:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('[AuthContext] Failed to fetch user details:', error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('[AuthContext] Fetch user details finished. Loading state:', false);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] useEffect for initial user fetch triggered.');
    refetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Attempting login for email:', email);
    try {
      const response = await axios.post(`${API_BASE_URL}/User/login`, { email, password }, { withCredentials: true });
      const token = response.data;
      console.log('[AuthContext] Login successful. Token received.');
      console.log('[AuthContext] RAW TOKEN:', token);
      
      const decodedPayload = decodeJwtPayload(token);
      console.log('[AuthContext] Decoded JWT payload (attempt):', decodedPayload);

      document.cookie = `cookies=${token}; path=/; secure; samesite=none`;
      console.log('[AuthContext] Cookie set. Current document.cookie:', document.cookie);
      await refetchUser();
      console.log('[AuthContext] Navigating to /profile after login.');
      router.push('/profile');
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('[AuthContext] Attempting logout.');
    try {
      await axios.post(`${API_BASE_URL}/User/logout`, {}, { withCredentials: true });
      document.cookie = 'cookies=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none';
      console.log('[AuthContext] Cookie cleared. Current document.cookie:', document.cookie);
      setUser(null);
      console.log('[AuthContext] User state set to null. Navigating to /auth.');
      router.push('/auth');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    console.log('[AuthContext] Attempting registration for email:', email);
    try {
      await axios.post(`${API_BASE_URL}/User/register`, { userName: name, email, password });
      console.log('[AuthContext] Registration successful. Proceeding to login.');
      await login(email, password);
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error);
      throw error;
    }
  };

  console.log('[AuthContext] AuthProvider rendering. Current user:', user, 'Loading:', loading);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 