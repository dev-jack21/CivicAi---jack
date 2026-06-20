interface PolicyCardProps {
  title: string;
  ministry: string;
  category: string;
}

export default function PolicyCard({ title, ministry, category }: PolicyCardProps) {
  return (
    <article className="p-4 border rounded">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-gray-600">
        {ministry} • {category}
      </p>
    </article>
  );
}
