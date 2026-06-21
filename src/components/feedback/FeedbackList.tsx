'use client';

import { useState, useEffect } from 'react';

interface Feedback {
  id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
  } | null;
}

interface FeedbackListProps {
  policyId: string;
}

export default function FeedbackList({ policyId }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deliberate decision: Display first name only for privacy (data minimization)
  // Per security requirements: show minimal identifying information publicly
  // Full names are stored in the database but only first names are displayed

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/policies/${policyId}/feedback`);
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        const data = await response.json();
        setFeedback(data.feedback || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [policyId]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border-custom rounded-lg p-4 shadow-sm">
            <div className="h-4 w-32 bg-border-custom rounded mb-2" />
            <div className="h-3 w-24 bg-border-custom rounded" />
            <div className="h-3 w-full bg-border-custom rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
        <p>Error loading feedback: {error}</p>
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="bg-surface border border-border-custom rounded-lg p-8 text-center shadow-sm">
        <p className="text-text-secondary">No public feedback available yet.</p>
      </div>
    );
  }

  const getDisplayName = (user: Feedback['user']): string => {
    if (!user) return 'Anonymous';

    if (user.full_name) {
      const nameParts = user.full_name.split(' ');
      if (nameParts.length > 1) {
        return nameParts[0];
      }
      return user.full_name;
    }

    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  return (
    <div className="space-y-4">
      {feedback.map((item) => {
        const displayName = getDisplayName(item.user);
        const formattedDate = new Date(item.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        return (
          <div
            key={item.id}
            className="bg-surface border border-border-custom rounded-lg p-4 hover:bg-bg-base transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">{displayName}</span>
              <time
                dateTime={item.created_at}
                className="text-xs text-text-muted"
                title={new Date(item.created_at).toLocaleString('en-GB')}
              >
                {formattedDate}
              </time>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{item.content}</p>
          </div>
        );
      })}
    </div>
  );
}
