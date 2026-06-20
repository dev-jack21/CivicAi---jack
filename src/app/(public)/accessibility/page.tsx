export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-6">
        Accessibility Statement
      </h1>
      <p className="text-sm text-text-secondary mb-8">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-text-primary leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">1. Our Commitment</h2>
          <p>
            CivicAI is built on the principle of &quot;Access First.&quot; We believe that
            government policies should be understandable and accessible to all citizens, including
            people with visual, hearing, cognitive, or physical impairments. We design and build our
            platform to conform with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as
            a baseline standard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            2. Accessibility Features
          </h2>
          <p>
            The platform includes several features designed to improve accessibility for all users:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>AI Audio Narration:</strong> Every policy has a pre-rendered or real-time
              audio summary using high-quality Text-to-Speech voices (including a Kenyan English
              neural voice) so you can listen instead of reading.
            </li>
            <li>
              <strong>Adjustable Font Size:</strong> You can increase or decrease the default text
              size directly from the navigation bar to read comfortably.
            </li>
            <li>
              <strong>High Contrast Mode:</strong> Toggle high-contrast theme in the navbar to
              change the background to black and text to high-contrast white/blue, meeting strict
              contrast requirements.
            </li>
            <li>
              <strong>Keyboard Navigation & Skip Link:</strong> A hidden &quot;Skip to main
              content&quot; link is available for screen reader and keyboard users. All interactive
              elements have visible focus rings and logical tab orders.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            3. Audio Player Keyboard Shortcuts
          </h2>
          <p>
            When using the policy audio player, you can control playback entirely from your
            keyboard:
          </p>
          <table className="min-w-full divide-y divide-border-custom mt-4 border border-border-custom rounded-lg overflow-hidden">
            <thead className="bg-bg-base">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-primary">Key</th>
                <th className="px-4 py-2 text-left font-semibold text-text-primary">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              <tr>
                <td className="px-4 py-2 font-mono bg-bg-base font-bold">Spacebar</td>
                <td className="px-4 py-2">Play / Pause</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono bg-bg-base font-bold">Left / Right Arrows</td>
                <td className="px-4 py-2">Seek backward / forward 5 seconds</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono bg-bg-base font-bold">Up / Down Arrows</td>
                <td className="px-4 py-2">Increase / Decrease volume</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono bg-bg-base font-bold">M</td>
                <td className="px-4 py-2">Mute / Unmute</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">4. Feedback & Contact</h2>
          <p>
            If you encounter any accessibility barriers on CivicAI, or if you have suggestions for
            improvement, please contact us. We are continuously working to enhance the platform
            experience for everyone.
          </p>
        </section>
      </div>
    </div>
  );
}
