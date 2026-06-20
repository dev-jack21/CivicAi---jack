export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-6">Privacy Policy</h1>
      <p className="text-sm text-text-secondary mb-8">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-text-primary leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            1. Compliance with the Kenya Data Protection Act 2019
          </h2>
          <p>
            CivicAI is committed to protecting the privacy of Kenyan citizens and users of this
            platform. We process personal data in strict compliance with the Kenya Data Protection
            Act 2019 (KDPA). Our lawful basis for processing personal data is the consent obtained
            during registration, and the public interest of facilitating civic participation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            2. Data Minimization & Collection
          </h2>
          <p>
            We adhere to the principle of data minimization. We only collect the following personal
            data necessary to operate the platform and allow you to submit feedback:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Email address (for authentication and account management)</li>
            <li>Full Name (optional, for displaying feedback attribution)</li>
            <li>Citizen feedback comments and policy ratings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">3. How Your Data is Used</h2>
          <p>
            Your email is used solely to authenticate your account and ensure unique feedback
            submissions. Your name and comments are displayed alongside the relevant policies to
            support transparent civic dialogue. We do NOT use your personal data for advertising or
            tracking purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            4. Sharing with Third Parties
          </h2>
          <p>
            We do not sell or share your personal data with any commercial third parties. To
            generate policy summaries, document text is processed using the Google Gemini API in a
            secure, anonymized manner. Speech synthesis is performed using edge-tts/gTTS, which do
            not store or process personal identifier details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            5. Data Retention & Your Rights
          </h2>
          <p>
            You have the right to access the feedback you have submitted at any time via your
            Profile page. You also have the right to request deletion of your account. Upon account
            deletion, all associated personal data and submitted feedback will be permanently
            removed from our databases (cascade deletion).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            6. Data Breach & Security
          </h2>
          <p>
            We protect your data using secure industry standards including SSL/TLS encryption in
            transit and secure database RLS (Row Level Security) policies at rest. In the event of a
            data breach, we have a 72-hour notification target to alert affected users and the
            relevant data protection commissioner.
          </p>
        </section>
      </div>
    </div>
  );
}
