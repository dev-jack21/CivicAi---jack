'use client';

import { useState, useEffect } from 'react';
import FeedbackTable from '@/components/admin/FeedbackTable';

interface FeedbackRow {
  id: string;
  content: string;
  created_at: string;
  status: string;
  reviewed_at: string | null;
  user: {
    full_name: string | null;
    email: string;
  } | null;
  policy: {
    id: string;
    title: string;
    ministry: string;
  } | null;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [policyFilter, setPolicyFilter] = useState<string>('');
  const [policies, setPolicies] = useState<{ id: string; title: string; ministry: string }[]>([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        let url = '/api/feedback';
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (policyFilter) {
          params.append('policy_id', policyFilter);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
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

    const fetchPolicies = async () => {
      try {
        const res = await fetch('/api/policies?limit=100');
        if (!res.ok) {
          throw new Error('Failed to fetch policies');
        }
        const data = await res.json();
        setPolicies(data.policies || []);
      } catch (err) {
        console.error('Failed to fetch policies:', err);
      }
    };

    fetchFeedback();
    fetchPolicies();
  }, [statusFilter, policyFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      await response.json();

      setFeedback((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: newStatus,
                reviewed_at: newStatus === 'reviewed' ? new Date().toISOString() : item.reviewed_at,
              }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-inter">
            Feedback Review
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review and respond to citizen comments and ratings on policies.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-border-custom p-12 text-center bg-surface shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-border-custom rounded w-3/4 mx-auto" />
            <div className="h-4 bg-border-custom rounded w-1/2 mx-auto" />
            <div className="h-32 bg-border-custom rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-inter">
          Feedback Review
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review and respond to citizen comments and ratings on policies.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border-custom p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-48">
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border-custom rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label
              htmlFor="policy-filter"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Policy
            </label>
            <select
              id="policy-filter"
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border-custom rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Policies</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        <FeedbackTable feedback={feedback} onStatusChange={handleStatusChange} />

        {feedback.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-text-secondary">No feedback found matching the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
