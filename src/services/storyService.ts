import { supabase } from './supabase';

export async function fetchStoryWithDetails(storyId: string) {
  const { data: story } = await supabase.from('stories').select('*').eq('id', storyId).single();
  const { data: paragraphs } = await supabase
    .from('story_paragraphs')
    .select('*, author:profiles(username)')
    .eq('story_id', storyId)
    .order('turn_number');
  const { data: currentTurn } = await supabase
    .from('turns')
    .select('*')
    .eq('story_id', storyId)
    .eq('is_closed', false)
    .maybeSingle();
  return { story, paragraphs, currentTurn };
}

export async function checkUserCanPropose(storyId: string, userId: string, turnId: string) {
  const { data: participant } = await supabase
    .from('story_participants')
    .select('*')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .single();
  if (!participant) return false;
  const { data: existingProposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('turn_id', turnId)
    .eq('author_id', userId)
    .maybeSingle();
  return !existingProposal;
}