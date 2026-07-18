import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Erreur checkSession:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.warn('Profil non trouvé:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });
      if (error) return { error };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      setUser(null);
      setProfile(null);
      Alert.alert('Erreur', 'Impossible de vous déconnecter');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, isLoggingOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};