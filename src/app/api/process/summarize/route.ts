import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { runSummarize } from '@/lib/process';

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

    const summary = await runSummarize(policy_id);

    return NextResponse.json({ message: 'Summarization complete', summary });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}
