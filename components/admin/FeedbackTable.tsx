interface FeedbackRow {
  id: string;
  policyTitle: string;
  userEmail: string;
  rating: number;
  comment: string | null;
  isReviewed: boolean;
  createdAt: string;
}

interface FeedbackTableProps {
  feedback: FeedbackRow[];
}

export default function FeedbackTable({ feedback }: FeedbackTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Policy</th>
          <th className="p-2 text-left">User</th>
          <th className="p-2 text-left">Rating</th>
          <th className="p-2 text-left">Comment</th>
          <th className="p-2 text-left">Reviewed</th>
          <th className="p-2 text-left">Date</th>
        </tr>
      </thead>
      <tbody>
        {feedback.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-2">{item.policyTitle}</td>
            <td className="p-2">{item.userEmail}</td>
            <td className="p-2">{item.rating}/5</td>
            <td className="p-2">{item.comment ?? '-'}</td>
            <td className="p-2">{item.isReviewed ? 'Yes' : 'No'}</td>
            <td className="p-2">{new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
