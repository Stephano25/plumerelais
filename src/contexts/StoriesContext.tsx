import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Story } from '../types';
import { useAuth } from './AuthContext';

interface StoriesContextType {
  participatingStories: Story[];
  openStories: Story[];
  finishedStories: Story[];
  refreshStories: () => Promise<void>;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export const StoriesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [participatingStories, setParticipatingStories] = useState<Story[]>([]);
  const [openStories, setOpenStories] = useState<Story[]>([]);
  const [finishedStories, setFinishedStories] = useState<Story[]>([]);

  const refreshStories = useCallback(async () => {
    if (!user) return;

    // 1. Récupérer les IDs des histoires auxquelles l'utilisateur participe
    const { data: participants } = await supabase
      .from('story_participants')
      .select('story_id')
      .eq('user_id', user.id);
    const pIds = participants?.map(p => p.story_id) || [];

    // 2. Histoires auxquelles je participe
    if (pIds.length) {
      const { data } = await supabase.from('stories').select('*').in('id', pIds);
      setParticipatingStories(data as Story[] || []);
    } else {
      setParticipatingStories([]);
    }

    // 3. Histoires ouvertes (publiques, non rejointes)
    let openQuery = supabase
      .from('stories')
      .select('*')
      .eq('is_public', true)
      .in('status', ['open', 'in_progress']);

    // Ajouter le filtre NOT IN uniquement s'il y a des IDs à exclure
    if (pIds.length > 0) {
      openQuery = openQuery.not('id', 'in', `(${pIds.join(',')})`);
    }

    const { data: open } = await openQuery;
    setOpenStories(open as Story[] || []);

    // 4. Histoires terminées
    const { data: finished } = await supabase
      .from('stories')
      .select('*')
      .eq('status', 'finished')
      .order('created_at', { ascending: false });
    setFinishedStories(finished as Story[] || []);
  }, [user]);

  useEffect(() => {
    refreshStories();
    const subscription = supabase
      .channel('stories_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        refreshStories();
      })
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshStories]);

  return (
    <StoriesContext.Provider value={{ participatingStories, openStories, finishedStories, refreshStories }}>
      {children}
    </StoriesContext.Provider>
  );
};

export const useStories = () => {
  const context = useContext(StoriesContext);
  if (!context) throw new Error('useStories must be used within StoriesProvider');
  return context;
};