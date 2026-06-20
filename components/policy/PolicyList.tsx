import PolicyCard from './PolicyCard';

interface PolicyListProps {
  policies: Array<{ id: string; title: string; ministry: string; category: string }>;
}

export default function PolicyList({ policies }: PolicyListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {policies.map((policy) => (
        <PolicyCard key={policy.id} {...policy} />
      ))}
    </div>
  );
}
