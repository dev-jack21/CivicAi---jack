import Select from '@/components/ui/Select';

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

interface FeedbackTableProps {
  feedback: FeedbackRow[];
  onStatusChange?: (id: string, status: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'flagged', label: 'Flagged' },
];

const STATUS_BADGE: Record<string, string> = {
  unreviewed: 'bg-amber-50 text-amber-700 border border-amber-200',
  reviewed: 'bg-green-50 text-green-700 border border-green-200',
  flagged: 'bg-red-50 text-red-700 border border-red-200',
};

export default function FeedbackTable({ feedback, onStatusChange }: FeedbackTableProps) {
  const getDisplayName = (user: FeedbackRow['user']): string => {
    if (!user) return 'Anonymous';
    return user.full_name || user.email.split('@')[0];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-base border-b border-border-custom">
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Policy
            </th>
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Comment
            </th>
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Reviewed
            </th>
            <th className="px-4 py-3 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {feedback.map((item) => (
            <tr key={item.id} className="hover:bg-bg-base/60 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-text-primary text-sm">
                  {item.policy?.title || 'Unknown Policy'}
                </div>
                <div className="text-xs text-text-muted mt-0.5">{item.policy?.ministry}</div>
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">{getDisplayName(item.user)}</td>
              <td className="px-4 py-3 text-sm text-text-secondary max-w-xs">
                <span className="line-clamp-2">{item.content}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[item.status] ?? 'bg-bg-base text-text-muted border border-border-custom'}`}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
                {formatDate(item.created_at)}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
                {item.reviewed_at ? formatDate(item.reviewed_at) : '—'}
              </td>
              <td className="px-4 py-3">
                {onStatusChange && (
                  <Select
                    size="sm"
                    value={item.status}
                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                    options={STATUS_OPTIONS}
                    aria-label={`Change status for feedback ${item.id}`}
                    containerClassName="min-w-[120px]"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
