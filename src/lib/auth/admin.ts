import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No valid session', status: 401 } },
        { status: 401 }
      ),
      supabase,
      session: null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions', status: 403 } },
        { status: 403 }
      ),
      supabase,
      session,
    };
  }

  return {
    authorized: true,
    errorResponse: null,
    supabase,
    session,
  };
}
