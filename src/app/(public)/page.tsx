import Link from 'next/link';
import { ArrowRight, BookOpen, Headphones, ShieldCheck, MessageSquare } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import PolicyCard from '@/components/policy/PolicyCard';

// Opt out of static rendering so we get fresh policies
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch latest 3 published policies
  const { data: recentPolicies } = await supabase
    .from('policies')
    .select('*, category:categories(id, name, slug), feedback_count:feedback(count)')
    .not('published_at', 'is', null)
    .eq('status', 'ready')
    .order('published_at', { ascending: false })
    .limit(3);

  const mappedPolicies =
    recentPolicies?.map((p) => ({
      id: p.id,
      title: p.title,
      ministry: p.ministry,
      category: p.category?.name ?? null,
      summary: p.summary,
      audio_url: p.audio_url,
      feedback_count: p.feedback_count?.[0]?.count ?? 0,
      created_at: p.created_at,
    })) || [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 overflow-hidden bg-bg-base">
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6 leading-tight">
            Understand Government Policies in <span className="text-primary">Plain English</span>.
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            CivicAI translates complex Kenyan government documents into clear summaries and audio
            narrations, making it easy for every citizen to stay informed and participate.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/policies"
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-12 px-8 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-sm"
            >
              Browse Policies
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-12 px-8 bg-surface border border-border-custom text-text-primary hover:bg-bg-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-surface border-y border-border-custom">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Built for Citizens</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Our platform bridges the gap between the government and the public with tools designed
              for absolute clarity and accessibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-bg-base border border-border-custom shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Clear Summaries</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                We use advanced AI to extract key points from massive legal frameworks and present
                them in simple, easy-to-read bullet points.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg-base border border-border-custom shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Audio Narrations</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Listen on the go. Every translated policy includes a high-quality Text-to-Speech
                audio track so you can hear the details anywhere.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg-base border border-border-custom shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Civic Feedback</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Read what others are saying and securely submit your own thoughts to help influence
                future public decisions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg-base border border-border-custom shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Highly Accessible</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Toggle high-contrast themes and adjust font sizes anytime. We adhere to WCAG
                standards so nobody is left behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Policies Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-bg-base">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Recently Published</h2>
              <p className="text-text-secondary text-sm">
                The latest simplified policies ready for review.
              </p>
            </div>
            <Link
              href="/policies"
              className="inline-flex items-center text-primary font-medium hover:text-primary-dark transition-colors"
            >
              View all policies
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {mappedPolicies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mappedPolicies.map((policy) => (
                <PolicyCard key={policy.id} {...policy} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface border border-border-custom rounded-2xl shadow-sm">
              <p className="text-text-secondary">No policies have been published yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
