export interface Policy {
  id: string;
  title: string;
  ministry: string;
  category: string | null;
  description: string;
  summary: string | null;
  audio_url: string | null;
  document_url: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  published_at: string | null;
  created_at: string;
  feedback_count: number;
}

export interface PolicyListResponse {
  policies: Policy[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  categories?: Category[];
  ministries?: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
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

export interface ProcessingJob {
  id: string;
  policy_id: string;
  job_type: 'summarize' | 'tts';
  status: 'pending' | 'running' | 'done' | 'failed';
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
