import { verifyAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { FileText, MessageSquare, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const { authorized, supabase } = await verifyAdmin();

  if (!authorized) {
    redirect('/unauthorized');
  }

  // Fetch some basic stats
  const [
    { count: totalPolicies },
    { count: pendingPolicies },
    { count: totalFeedback },
    { count: unreviewedFeedback },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('feedback').select('*', { count: 'exact', head: true }),
    supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unreviewed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      title: 'Total Policies',
      value: totalPolicies || 0,
      icon: FileText,
      href: '/admin/policies',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Pending Policies',
      value: pendingPolicies || 0,
      icon: Clock,
      href: '/admin/policies',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Total Feedback',
      value: totalFeedback || 0,
      icon: MessageSquare,
      href: '/admin/feedback',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Unreviewed Feedback',
      value: unreviewedFeedback || 0,
      icon: AlertCircle,
      href: '/admin/feedback',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Registered Users',
      value: totalUsers || 0,
      icon: Users,
      href: '#',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-inter">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of system statistics and activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-surface border border-border-custom rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-text-primary group-hover:text-primary transition-colors">
                  {stat.value}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-surface border border-border-custom rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-text-secondary" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/upload"
              className="flex items-center justify-between p-4 rounded-lg border border-border-custom hover:bg-bg-base transition-colors group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div>
                <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors">
                  Upload Policy
                </h3>
                <p className="text-sm text-text-secondary mt-1">Publish a new document</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                +
              </div>
            </Link>
            <Link
              href="/admin/policies"
              className="flex items-center justify-between p-4 rounded-lg border border-border-custom hover:bg-bg-base transition-colors group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div>
                <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors">
                  Manage Policies
                </h3>
                <p className="text-sm text-text-secondary mt-1">View processing status</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                →
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-border-custom rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-text-secondary" />
            Recent Activity
          </h2>
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-border-custom rounded-lg p-6">
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-text-primary font-medium">System is running smoothly</p>
            <p className="text-sm text-text-secondary mt-1">
              Check back later for recent activity updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
