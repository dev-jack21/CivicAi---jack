import React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-bg-base text-text-primary">
      {/* Left Column - Branding and Specs Showcase */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0D4F80] to-[#1B6CA8] text-white relative overflow-hidden min-h-screen"
        aria-label="CivicAI Information Panel"
      >
        {/* Glowing Ambient Spot */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />

        {/* Top Header/Logo */}
        <div className="z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/civicai-logo-white-on-blue.png" alt="CivicAI" className="h-24 w-auto" />
        </div>

        {/* Center Vision & How It Works */}
        <div className="max-w-md my-auto space-y-10 z-10">
          <div className="space-y-4">
            <span className="text-[#60A5FA] font-semibold text-xs tracking-wider uppercase">
              Our Vision
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Democratizing public participation in Kenya.
            </h2>
            <p className="text-zinc-100 text-sm leading-relaxed font-light">
              &ldquo;Every Kenyan citizen, literate or not, sighted or not, urban or rural, can
              understand and respond to government policies.&rdquo;
            </p>
          </div>

          <div className="border-t border-white/10 pt-8 space-y-6">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-300">
              How It Works
            </h3>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface/10 flex items-center justify-center font-bold text-xs text-[#60A5FA]">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Upload Documents</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Admins upload official Kenyan policy drafts (PDF and DOCX formats).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface/10 flex items-center justify-center font-bold text-xs text-[#60A5FA]">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Simplification</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  AI generates plain-language summaries and converts them to accessible audio
                  narrations.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface/10 flex items-center justify-center font-bold text-xs text-[#60A5FA]">
                3
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Listen & Share Voice</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Citizens listen to narration and submit direct feedback to make their voice heard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Constitution Quote */}
        <div className="text-xs text-zinc-300 border-t border-white/10 pt-6 z-10 space-y-2">
          <p className="leading-relaxed">
            Article 118 of the Constitution of Kenya 2010 mandates public participation. CivicAI
            empowers citizens to fulfill this constitutional role.
          </p>
        </div>
      </aside>

      {/* Right Column - Children Pages (LoginForm / RegisterForm) */}
      <main
        id="main-content"
        className="flex items-center justify-center p-6 sm:p-12 md:p-16 min-h-screen"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
