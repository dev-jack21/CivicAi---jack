export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-6">About CivicAI</h1>

      <div className="space-y-6 text-sm text-text-primary leading-relaxed">
        <p>
          <strong>CivicAI</strong> is a citizen-centered platform designed to bridge the gap between
          complex government policy documents and the general public in Kenya. Large policy papers,
          legislative acts, and frameworks are often filled with technical legal jargon, making them
          difficult for the average citizen to read and fully understand.
        </p>
        <p>
          Using state-of-the-art AI technology powered by Google&apos;s Gemini 2.0 Flash model,
          CivicAI extracts and translates these policy documents into plain, clear English. We
          present key highlights, explain what the policies mean for citizens directly, list crucial
          deadlines, and provide natural audio narrations so users can listen on the go.
        </p>

        <h2 className="text-lg font-semibold text-text-primary mt-8 mb-2">Our Key Objectives</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Simplify:</strong> Break down complex frameworks into clear summaries.
          </li>
          <li>
            <strong>Include:</strong> Build an accessible-first platform supporting screen readers,
            keyboard navigation, high contrast themes, and audio playbacks.
          </li>
          <li>
            <strong>Engage:</strong> Empower citizens to review policies and submit feedback,
            helping their voices be heard in civic matters.
          </li>
        </ul>
      </div>
    </div>
  );
}
