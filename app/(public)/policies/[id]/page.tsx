interface PolicyPageProps {
  params: Promise<{ id: string }>;
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold">Policy {id}</h1>
    </main>
  );
}
