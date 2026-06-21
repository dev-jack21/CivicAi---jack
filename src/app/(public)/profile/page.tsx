'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { User, FileText, MessageSquare, Clock } from 'lucide-react';

interface FeedbackHistoryItem {
  id: string;
  content: string;
  created_at: string;
  status: string;
  policy: {
    id: string;
    title: string;
    ministry: string;
  } | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    email: string;
    role: string;
    fullName: string | null;
  } | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileAndFeedback = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();
        if (authError || !session) {
          setError('You must be signed in to view your profile.');
          setIsLoading(false);
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();

        setProfile({
          email: session.user.email ?? '',
          role: profileData?.role ?? 'user',
          fullName: profileData?.full_name ?? null,
        });

        const { data: feedbackData, error: dbError } = await supabase
          .from('feedback')
          .select('id, content, created_at, status, policy:policies(id, title, ministry)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (dbError) {
          throw dbError;
        }

        setFeedbackList((feedbackData as unknown as FeedbackHistoryItem[]) || []);
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setError('An error occurred while loading your profile.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileAndFeedback();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error || 'Profile not found.'}
        </div>
        <div className="mt-4">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Go to Sign In page &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-surface border border-border-custom rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-[#1B6CA8] to-[#0D4F85] px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-surface/20 p-3 rounded-full">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {profile.fullName || 'Citizen User'}
              </h1>
              <p className="text-sm text-blue-100">{profile.email}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-bg-base border-t border-border-custom flex flex-wrap gap-6 text-sm text-text-secondary">
          <div>
            <span className="font-semibold text-text-primary">Account Role: </span>
            <span className="capitalize">{profile.role}</span>
          </div>
          <div>
            <span className="font-semibold text-text-primary">Feedback Submitted: </span>
            {feedbackList.length}
          </div>
          {profile.role === 'admin' && (
            <div>
              <Link href="/admin/policies" className="text-primary hover:underline font-medium">
                Admin Panel &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Your Feedback History
      </h2>

      {feedbackList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center bg-surface shadow-sm">
          <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-2" />
          <p className="text-text-secondary text-sm">
            You haven&apos;t submitted feedback for any policies yet.
          </p>
          <Link
            href="/policies"
            className="mt-4 inline-flex px-4 py-2 bg-primary hover:bg-[#0D4F80] text-white font-medium rounded-md text-sm transition-colors"
          >
            Browse Policies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-border-custom rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {item.policy ? (
                      <Link
                        href={`/policies/${item.policy.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {item.policy.title}
                      </Link>
                    ) : (
                      'Unknown Policy'
                    )}
                  </h3>
                  <p className="text-xs text-text-secondary">{item.policy?.ministry || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      item.status === 'reviewed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : item.status === 'flagged'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="capitalize">{item.status}</span>
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary bg-bg-base p-3 rounded-lg border border-border-custom italic">
                &ldquo;{item.content}&rdquo;
              </p>
              <div className="mt-3 text-xs text-text-muted">
                Submitted on{' '}
                {new Date(item.created_at).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
