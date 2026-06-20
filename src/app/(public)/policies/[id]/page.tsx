import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AudioPlayer from '@/components/policy/AudioPlayer';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackList from '@/components/feedback/FeedbackList';

interface PolicyPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

function formatLongDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface SummarySection {
  heading: string;
  content: string[];
}

function parseSummary(summary: string): SummarySection[] {
  const sections: SummarySection[] = [];
  const lines = summary.split('\n');
  let current: SummarySection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^\*{2}(.+?)\*{2}/);
    if (headingMatch) {
      current = { heading: headingMatch[1], content: [] };
      sections.push(current);
      const rest = trimmed.slice(headingMatch[0].length).trim();
      if (rest) {
        current.content.push(rest);
      }
    } else if (current) {
      current.content.push(trimmed);
    }
  }

  return sections;
}

function SummarySectionView({ section }: { section: SummarySection }) {
  const isList = section.content.some((l) => l.startsWith('•') || l.startsWith('-'));

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold text-text-primary mb-2">{section.heading}</h3>
      {isList ? (
        <ul className="space-y-1.5">
          {section.content.map((item, i) => {
            const text = item.replace(/^[•-]\s*/, '');
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed"
              >
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                  aria-hidden="true"
                />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary leading-relaxed">{section.content.join(' ')}</p>
      )}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-gray-100 rounded" />
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-3/4 bg-gray-100 rounded" />
      <div className="h-4 w-5/6 bg-gray-100 rounded" />
    </div>
  );
}

function AudioPlayerSkeleton() {
  return <div className="w-full h-32 bg-gray-100 rounded-lg animate-pulse" />;
}

async function PolicyContent({ id }: { id: string }) {
  const supabase = await createServerSupabaseClient();

  const { data: policy, error } = await supabase
    .from('policies')
    .select('*, category:categories(name), feedback_count:feedback(count)')
    .eq('id', id)
    .not('published_at', 'is', null)
    .eq('status', 'ready')
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single();
    userProfile = profile;
  }

  if (error || !policy) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary text-lg mb-4">Policy not found or not yet published.</p>
        <Link
          href="/policies"
          className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Policies
        </Link>
      </div>
    );
  }

  const feedbackCount = policy.feedback_count?.[0]?.count ?? 0;
  const effectiveDate = formatDate(policy.effective_date);
  const categoryName = policy.category?.name ?? null;
  const sections = policy.summary ? parseSummary(policy.summary) : [];

  const { data: feedbackList } = await supabase
    .from('feedback')
    .select('id, content, created_at, user:profiles(full_name, email)')
    .eq('policy_id', id)
    .eq('status', 'unreviewed')
    .order('created_at', { ascending: false });

  return (
    <>
      {/* Back link */}
      <Link
        href="/policies"
        className="inline-flex items-center gap-1.5 min-h-11 px-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Policies
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {categoryName && (
          <span
            className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-primary"
            aria-label={`Category: ${categoryName}`}
          >
            {categoryName}
          </span>
        )}
        <span className="text-sm text-text-secondary">{policy.ministry}</span>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-4">{policy.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6">
        {effectiveDate && (
          <span>
            Effective: <time dateTime={policy.effective_date}>{effectiveDate}</time>
          </span>
        )}
        <span aria-label={`${feedbackCount} citizen responses`}>
          {feedbackCount} citizen response{feedbackCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-8">
        <a
          href={policy.document_url}
          download
          className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 border border-border-custom text-sm font-medium text-text-primary rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Download Original
        </a>
        {policy.audio_url && (
          <a
            href="#audio-player"
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Listen to Summary
          </a>
        )}
      </div>

      {/* Audio Player */}
      {policy.audio_url && (
        <section id="audio-player" className="mb-10" aria-label="Audio player section">
          <Suspense fallback={<AudioPlayerSkeleton />}>
            <AudioPlayer src={policy.audio_url} title={policy.title} />
          </Suspense>
        </section>
      )}

      {/* AI Summary */}
      {sections.length > 0 && (
        <section aria-label="AI summary">
          <h2 className="text-xl font-bold text-text-primary mb-4">AI Summary</h2>
          <div className="bg-gray-50 border border-border-custom rounded-lg p-5">
            {sections.map((section, i) => (
              <SummarySectionView key={i} section={section} />
            ))}
          </div>
        </section>
      )}

      {/* Status info */}
      <p className="text-xs text-text-muted mt-8">
        Uploaded: {formatLongDate(policy.created_at)}
        {policy.published_at && <> &middot; Published: {formatLongDate(policy.published_at)}</>}
      </p>

      {/* Citizen Feedback Section */}
      <section className="mt-12" aria-label="Citizen feedback">
        <h2 className="text-xl font-bold text-text-primary mb-6">Citizen Feedback</h2>
        <FeedbackForm policyId={id} user={userProfile} />
      </section>

      {/* Public Feedback List */}
      {feedbackList && feedbackList.length > 0 && (
        <section className="mt-12" aria-label="Public feedback list">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Comments</h3>
          <FeedbackList policyId={id} />
        </section>
      )}
    </>
  );
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-6 w-64 bg-gray-100 rounded" />
            <div className="h-8 w-full bg-gray-100 rounded" />
            <SummarySkeleton />
          </div>
        }
      >
        <PolicyContent id={id} />
      </Suspense>
    </div>
  );
}
