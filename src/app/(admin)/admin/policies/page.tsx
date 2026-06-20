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

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch('/api/policies?limit=50');
      if (!res.ok) {
        throw new Error('Failed to fetch policies');
      }
      const data: PolicyListResponse = await res.json();
      setPolicies(data.policies);
      setLastRefreshed(new Date());
      setError(null);
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
      <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            Manage Policies
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            View processing status and manage uploaded policy documents.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center min-h-11 gap-2 px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
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
        <p className="text-xs text-[#9CA3AF]">
          Last updated: {lastRefreshed.toLocaleTimeString('en-KE')}
          {policies.some((p) => p.status === 'pending' || p.status === 'processing') &&
            ' — Auto-refreshing every 3s'}
        </p>
      )}

      {loading && policies.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#1B6CA8]" />
          <span className="ml-2 text-sm text-[#6B7280]">Loading policies...</span>
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center bg-white shadow-sm">
          <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
          <h2 className="text-lg font-semibold text-[#111827] mb-2">No policies yet</h2>
          <p className="text-[#6B7280] text-sm mb-4">
            Upload your first policy document to get started.
          </p>
          <Link
            href="/admin/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B6CA8] hover:bg-[#0D4F80] text-white font-medium rounded-md text-sm transition-colors"
          >
            Upload Policy
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Ministry
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Summary
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Audio
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {policies.map((policy) => {
                const statusCfg = STATUS_CONFIG[policy.status];
                return (
                  <tr key={policy.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/policies/${policy.id}`}
                        className="font-medium text-[#1B6CA8] hover:text-[#0D4F80] hover:underline"
                      >
                        {policy.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{policy.ministry}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{policy.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] max-w-[200px]">
                      {policy.summary ? (
                        <span className="text-xs leading-relaxed">
                          {truncateSummary(policy.summary)}
                        </span>
                      ) : policy.status === 'pending' ? (
                        <span className="text-xs text-yellow-600 italic">Awaiting processing</span>
                      ) : policy.status === 'processing' ? (
                        <span className="text-xs text-blue-600 italic">Generating summary...</span>
                      ) : (
                        <span className="text-xs text-[#9CA3AF] italic">Not available</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {policy.audio_url ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280] whitespace-nowrap">
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
