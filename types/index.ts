export interface Policy {
  id: string;
  title: string;
  ministry: string;
  category: string;
  description: string;
  summary: string | null;
  audio_url: string | null;
  document_url: string;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  feedback_count: number;
}

export interface Feedback {
  id: string;
  policy_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_reviewed: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}
