import { type Policy } from '@/types';
import PolicyCard from './PolicyCard';

interface PolicyListProps {
  policies: Policy[];
}

export default function PolicyList({ policies }: PolicyListProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          id={policy.id}
          title={policy.title}
          ministry={policy.ministry}
          category={policy.category}
          summary={policy.summary}
          audio_url={policy.audio_url}
          feedback_count={policy.feedback_count}
          created_at={policy.created_at}
        />
      ))}
    </div>
  );
}
