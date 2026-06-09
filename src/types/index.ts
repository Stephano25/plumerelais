export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  reputation: number;
  expo_push_token: string | null;
}

export interface Story {
  id: string;
  title: string;
  cover_image: string | null;
  opening_paragraph: string;
  max_contributions: number;
  turn_duration_minutes: number;
  is_public: boolean;
  status: 'open' | 'in_progress' | 'finished';
  current_turn: number;
  created_at: string;
  created_by: string;
}

export interface Turn {
  id: string;
  story_id: string;
  turn_number: number;
  ends_at: string;
  is_closed: boolean;
  winning_proposal_id: string | null;
}

export interface Proposal {
  id: string;
  turn_id: string;
  author_id: string;
  paragraph: string;
  vote_count: number;
  is_winner: boolean;
  created_at: string;
  author?: Profile;
}

export interface StoryParagraph {
  id: string;
  story_id: string;
  turn_number: number;
  author_id: string;
  paragraph: string;
  author?: Profile;
}