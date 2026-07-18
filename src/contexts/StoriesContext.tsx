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
    if (!user) {
      setParticipatingStories([]);
      setOpenStories([]);
      setFinishedStories([]);
      return;
    }

    try {
      const { data: participants } = await supabase
        .from('story_participants')
        .select('story_id')
        .eq('user_id', user.id);
      
      const pIds = participants?.map(p => p.story_id) || [];

      if (pIds.length > 0) {
        const { data } = await supabase
          .from('stories')
          .select('*')
          .in('id', pIds);
        setParticipatingStories(data as Story[] || []);
      } else {
        setParticipatingStories([]);
      }

      let openQuery = supabase
        .from('stories')
        .select('*')
        .eq('is_public', true)
        .in('status', ['open', 'in_progress']);

      if (pIds.length > 0) {
        openQuery = openQuery.not('id', 'in', `(${pIds.join(',')})`);
      }

      const { data: open } = await openQuery;
      setOpenStories(open as Story[] || []);

      const { data: finished } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'finished')
        .order('created_at', { ascending: false });
      setFinishedStories(finished as Story[] || []);
    } catch (error) {
      console.error('Erreur refreshStories:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshStories();
    // Pas de souscription WebSocket
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
