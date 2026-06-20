export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[#111827] mb-6">Contact Us</h1>

      <div className="space-y-6 text-sm text-[#374151] leading-relaxed">
        <p>
          We would love to hear your thoughts, suggestions, and feedback on how we can make CivicAI
          better for you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          <div className="p-5 border border-[#E5E7EB] rounded-xl bg-zinc-50">
            <h2 className="font-bold text-[#111827] mb-2">General Inquiries</h2>
            <p className="text-[#6B7280]">
              Email us for general platform questions, media requests, or academic collaboration:
            </p>
            <p className="mt-3 font-semibold text-[#1B6CA8]">info@civicai.or.ke</p>
          </div>

          <div className="p-5 border border-[#E5E7EB] rounded-xl bg-zinc-50">
            <h2 className="font-bold text-[#111827] mb-2">Technical Support</h2>
            <p className="text-[#6B7280]">
              For bug reports, accessibility barriers, or issues related to your user account:
            </p>
            <p className="mt-3 font-semibold text-[#1B6CA8]">support@civicai.or.ke</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-[#111827] mt-8 mb-2">Location</h2>
        <p>
          Nairobi, Kenya
          <br />
          CivicAI Project Secretariat
        </p>
      </div>
    </div>
  );
}
