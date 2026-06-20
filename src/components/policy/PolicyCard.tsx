import Link from 'next/link';
import { FileText, Headphones, MessageSquare } from 'lucide-react';

interface PolicyCardProps {
  id: string;
  title: string;
  ministry: string;
  category: string | null;
  summary: string | null;
  audio_url: string | null;
  feedback_count: number;
  created_at: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export default function PolicyCard({
  id,
  title,
  ministry,
  category,
  summary,
  audio_url,
  feedback_count,
  created_at,
}: PolicyCardProps) {
  return (
    <article className="flex flex-col border border-border-custom rounded-lg bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        {category && (
          <span
            className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-primary"
            aria-label={`Category: ${category}`}
          >
            {category}
          </span>
        )}
        <span className="text-xs text-text-secondary">{ministry}</span>
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-1.5 leading-snug">
        <Link href={`/policies/${id}`} className="hover:text-primary transition-colors">
          {title}
        </Link>
      </h3>

      <p className="text-xs text-text-muted mb-3">Uploaded: {formatDate(created_at)}</p>

      {summary && (
        <p className="text-sm text-text-secondary mb-4 leading-relaxed flex-1">
          {truncate(summary, 150)}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4 text-xs text-text-muted">
        {audio_url && (
          <span className="inline-flex items-center gap-1" aria-label="Audio available">
            <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
            Audio available
          </span>
        )}
        <span
          className="inline-flex items-center gap-1"
          aria-label={`${feedback_count} citizen responses`}
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          {feedback_count}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-border-custom">
        <Link
          href={`/policies/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          Read Summary
        </Link>
        {audio_url && (
          <Link
            href={`/policies/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Headphones className="w-4 h-4" aria-hidden="true" />
            Listen →
          </Link>
        )}
      </div>
    </article>
  );
}
