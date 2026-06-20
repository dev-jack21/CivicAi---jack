import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    const { data: policy, error } = await supabase
      .from('policies')
      .select('*, category:categories(name), feedback_count:feedback(count)')
      .eq('id', id)
      .not('published_at', 'is', null)
      .eq('status', 'ready')
      .single();

    if (error || !policy) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'The requested policy document does not exist.',
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    const feedbackCount = policy.feedback_count?.[0]?.count ?? 0;

    return NextResponse.json({
      id: policy.id,
      title: policy.title,
      ministry: policy.ministry,
      category: policy.category?.name ?? null,
      description: policy.description ?? '',
      summary: policy.summary,
      audio_url: policy.audio_url,
      document_url: policy.document_url,
      status: policy.status,
      published_at: policy.published_at,
      effective_date: policy.effective_date,
      created_at: policy.created_at,
      feedback_count: feedbackCount,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, errorResponse, supabase } = await verifyAdmin();
    if (!authorized) {
      return errorResponse!;
    }

    const { id } = await params;

    const { data: existing } = await supabase.from('policies').select('id').eq('id', id).single();

    if (!existing) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'The requested policy document does not exist.',
            status: 404,
          },
        },
        { status: 404 }
      );
    }

    const { error } = await supabase.from('policies').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete policy', status: 500 } },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}
