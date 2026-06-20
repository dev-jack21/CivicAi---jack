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

export default function FeedbackTable({ feedback, onStatusChange }: FeedbackTableProps) {
  const getDisplayName = (user: FeedbackRow['user']): string => {
    if (!user) return 'Anonymous';
    return user.full_name || user.email.split('@')[0];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
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
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-left">Policy</th>
            <th className="p-3 text-left">User</th>
            <th className="p-3 text-left">Comment</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Submitted</th>
            <th className="p-3 text-left">Reviewed</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedback.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <div className="font-medium text-text-primary">
                  {item.policy?.title || 'Unknown Policy'}
                </div>
                <div className="text-xs text-text-muted">{item.policy?.ministry}</div>
              </td>
              <td className="p-3 text-sm text-text-secondary">{getDisplayName(item.user)}</td>
              <td className="p-3 text-sm text-text-secondary max-w-xs truncate">{item.content}</td>
              <td className="p-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${item.status === 'unreviewed' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${item.status === 'reviewed' ? 'bg-green-100 text-green-800' : ''}
                    ${item.status === 'flagged' ? 'bg-red-100 text-red-800' : ''}
                  `}
                >
                  {item.status}
                </span>
              </td>
              <td className="p-3 text-sm text-text-muted">{formatDate(item.created_at)}</td>
              <td className="p-3 text-sm text-text-muted">
                {item.reviewed_at ? formatDate(item.reviewed_at) : '-'}
              </td>
              <td className="p-3">
                {onStatusChange && (
                  <select
                    value={item.status}
                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="unreviewed">Unreviewed</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="flagged">Flagged</option>
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
