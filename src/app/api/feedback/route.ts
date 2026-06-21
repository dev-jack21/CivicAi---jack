import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify the admin session using the cookie-based client
  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) {
    return errorResponse!;
  }

  // Use service role client to bypass RLS on the profiles join.
  // The `profiles` table has an RLS policy that only allows users to read
  // their own profile row. Without the service role client the
  // `user:profiles(full_name, email)` foreign-table join returns null / errors
  // for every feedback row that belongs to a different user.
  const serviceClient = createServiceRoleClient();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const policyId = searchParams.get('policy_id');

  let query = serviceClient
    .from('feedback')
    .select(
      'id, content, created_at, status, reviewed_at, user:user_id(full_name, email), policy:policies(id, title, ministry)'
    )
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (policyId) {
    query = query.eq('policy_id', policyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[/api/feedback] Supabase error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  return NextResponse.json({ feedback: data || [] });
}
