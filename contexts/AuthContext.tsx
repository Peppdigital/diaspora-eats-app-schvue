import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/utils/api';

export type UserRole = 'customer' | 'vendor' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  // Legacy fields used by existing screens
  full_name: string;
  default_location_state?: string;
  default_location_city?: string;
  diaspora_segment?: string[];
  favorite_cuisines?: string[];
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function normalizeUser(raw: Record<string, unknown>): AuthUser {
  const name = (raw.name as string) || (raw.full_name as string) || '';
  const role = ((raw.role as string) || 'customer') as UserRole;
  return {
    id: raw.id as string,
    name,
    full_name: name,
    email: raw.email as string,
    image: raw.image as string | undefined,
    role,
    default_location_state: raw.default_location_state as string | undefined,
    default_location_city: raw.default_location_city as string | undefined,
    diaspora_segment: (raw.diaspora_segment as string[]) || [],
    favorite_cuisines: (raw.favorite_cuisines as string[]) || [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Restoring session...');
    api
      .get('/api-auth-me')
      .then((data) => {
        console.log('[Auth] Session restored for:', data?.user?.email);
        setUser(normalizeUser(data.user));
      })
      .catch(() => {
        console.log('[Auth] No active session');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Signing in:', email);
    const data = await api.post('/auth-login', { email, password });
    await api.setToken(data.token);
    setUser(normalizeUser(data.user));
    console.log('[Auth] Signed in as:', data.user?.email, 'role:', data.user?.role);
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'customer') => {
    console.log('[Auth] Signing up:', email, 'role:', role);
    const data = await api.post('/auth-signup', { email, password, name, role });
    await api.setToken(data.token);
    setUser(normalizeUser(data.user));
    console.log('[Auth] Signed up as:', data.user?.email);
  };

  const signOut = async () => {
    console.log('[Auth] Signing out');
    await api.clearToken();
    setUser(null);
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
