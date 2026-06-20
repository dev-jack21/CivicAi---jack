import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { runTts } from '@/lib/process';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { authorized, errorResponse } = await verifyAdmin();
    if (!authorized) {
      return errorResponse!;
    }

    const body = await request.json();
    const { policy_id } = body;

    if (!policy_id || typeof policy_id !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'policy_id is required', status: 422 } },
        { status: 422 }
      );
    }

    await runTts(policy_id);

    return NextResponse.json({ message: 'TTS generation complete' });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}
