
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // TODO: Implement actual session check with Supabase
      // For now, simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // TODO: Implement actual sign in with Supabase
      console.log('Signing in:', email);
      
      // Mock user for development
      const mockUser: User = {
        id: '1',
        role: 'customer',
        full_name: 'Test User',
        email: email,
        diaspora_segment: ['African American'],
        favorite_cuisines: ['Soul Food', 'Caribbean'],
        default_location_state: 'CA',
        default_location_city: 'Los Angeles',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(mockUser);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'customer') => {
    try {
      // TODO: Implement actual sign up with Supabase
      console.log('Signing up:', email, fullName, role);
      
      // Mock user for development
      const mockUser: User = {
        id: '1',
        role: role,
        full_name: fullName,
        email: email,
        diaspora_segment: [],
        favorite_cuisines: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(mockUser);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // TODO: Implement actual sign out with Supabase
      console.log('Signing out');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      // TODO: Implement actual user update with Supabase
      console.log('Updating user:', updates);
      if (user) {
        setUser({ ...user, ...updates, updated_at: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
