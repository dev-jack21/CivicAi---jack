interface PolicyViewerProps {
  title: string;
  summary: string | null;
  audioUrl: string | null;
}

export default function PolicyViewer({ title, summary, audioUrl }: PolicyViewerProps) {
  return (
    <article className="prose max-w-none">
      <h1>{title}</h1>
      {summary && <div className="prose">{summary}</div>}
      {audioUrl && <audio controls src={audioUrl} />}
    </article>
  );
}
