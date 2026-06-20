import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const { authorized, errorResponse, supabase } = await verifyAdmin();
  if (!authorized) {
    return errorResponse!;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const policyId = searchParams.get('policy_id');

  let query = supabase
    .from('feedback')
    .select(
      'id, content, created_at, status, reviewed_at, user:profiles(full_name, email), policy:policies(id, title, ministry)'
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
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  return NextResponse.json({ feedback: data || [] });
}
