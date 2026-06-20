import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runTtsStub } from '@/lib/process';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No valid session', status: 401 } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions', status: 403 } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { policy_id } = body;

    if (!policy_id || typeof policy_id !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'policy_id is required', status: 422 } },
        { status: 422 }
      );
    }

    await runTtsStub(policy_id);

    return NextResponse.json({ message: 'TTS generation complete' });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}
