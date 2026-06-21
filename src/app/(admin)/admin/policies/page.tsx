'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, FileText, Loader2 } from 'lucide-react';

type PolicyStatus = 'pending' | 'processing' | 'ready' | 'failed';

interface AdminPolicy {
  id: string;
  title: string;
  ministry: string;
  category: string | null;
  description: string;
  summary: string | null;
  audio_url: string | null;
  document_url: string;
  status: PolicyStatus;
  created_at: string;
  feedback_count: number;
}

interface PolicyListResponse {
  policies: AdminPolicy[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const STATUS_CONFIG: Record<
  PolicyStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  processing: {
    label: 'Processing',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Ready',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  failed: {
    label: 'Failed',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const activeProcessingRef = useRef<Set<string>>(new Set());

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch('/api/policies?limit=50&admin=true');
      if (!res.ok) {
        throw new Error('Failed to fetch policies');
      }
      const data: PolicyListResponse = await res.json();
      setPolicies(data.policies);
      setLastRefreshed(new Date());
      setError(null);

      // Automatically trigger processing based on policy status
      data.policies.forEach((policy) => {
        if (policy.status === 'pending' && !activeProcessingRef.current.has(policy.id)) {
          activeProcessingRef.current.add(policy.id);
          fetch('/api/process/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ policy_id: policy.id }),
          }).catch((err) => {
            console.error('Failed to trigger summarize:', err);
          });
        } else if (
          policy.status === 'processing' &&
          !activeProcessingRef.current.has(policy.id + '_tts')
        ) {
          activeProcessingRef.current.add(policy.id + '_tts');
          fetch('/api/process/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ policy_id: policy.id }),
          }).catch((err) => {
            console.error('Failed to trigger tts:', err);
          });
        }
      });

      return data.policies;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const hasActiveJobs = useCallback(
    (list: AdminPolicy[]) => list.some((p) => p.status === 'pending' || p.status === 'processing'),
    []
  );

  useEffect(() => {
    fetchPolicies().then((list) => {
      if (hasActiveJobs(list)) {
        pollingRef.current = setInterval(() => {
          fetchPolicies().then((updated) => {
            if (!hasActiveJobs(updated)) {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
            }
          });
        }, 3000);
      }
      setLoading(false);
    });
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchPolicies, hasActiveJobs]);

  const handleRefresh = () => {
    setLoading(true);
    fetchPolicies();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateSummary = (text: string | null, maxLen = 120) => {
    if (!text) return null;
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Manage Policies
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            View processing status and manage uploaded policy documents.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center min-h-11 gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-custom rounded-lg hover:bg-bg-base transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {lastRefreshed && (
        <p className="text-xs text-text-muted">
          Last updated: {lastRefreshed.toLocaleTimeString('en-KE')}
          {policies.some((p) => p.status === 'pending' || p.status === 'processing') &&
            ' — Auto-refreshing every 3s'}
        </p>
      )}

      {loading && policies.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-text-secondary">Loading policies...</span>
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-custom p-12 text-center bg-surface shadow-sm">
          <FileText className="w-12 h-12 mx-auto text-text-muted mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">No policies yet</h2>
          <p className="text-text-secondary text-sm mb-4">
            Upload your first policy document to get started.
          </p>
          <Link
            href="/admin/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md text-sm transition-colors"
          >
            Upload Policy
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-custom bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-base">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Ministry
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Summary
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Audio
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {policies.map((policy) => {
                const statusCfg = STATUS_CONFIG[policy.status];
                return (
                  <tr key={policy.id} className="hover:bg-bg-base transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/policies/${policy.id}`}
                        className="font-medium text-primary hover:text-primary-dark hover:underline"
                      >
                        {policy.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{policy.ministry}</td>
                    <td className="px-4 py-3 text-text-secondary">{policy.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px]">
                      {policy.summary ? (
                        <span className="text-xs text-text-secondary leading-relaxed">
                          {truncateSummary(policy.summary)}
                        </span>
                      ) : policy.status === 'pending' ? (
                        <span className="text-xs text-yellow-600 italic">Awaiting processing</span>
                      ) : policy.status === 'processing' ? (
                        <span className="text-xs text-blue-600 italic">Generating summary...</span>
                      ) : (
                        <span className="text-xs text-text-muted italic">Not available</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {policy.audio_url ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatDate(policy.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
