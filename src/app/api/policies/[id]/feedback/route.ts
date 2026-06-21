import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { feedbackSchema } from '@/lib/validators/feedback';

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parsed = routeParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid policy ID' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: policy } = await supabase.from('policies').select('id').eq('id', id).single();

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
  }

  const { data: feedbackList } = await supabase
    .from('feedback')
    .select('id, content, created_at, user:user_id(full_name, email)')
    .eq('policy_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ policyId: id, feedback: feedbackList || [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parsed = routeParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid policy ID' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: policy } = await supabase.from('policies').select('id').eq('id', id).single();

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = feedbackSchema.safeParse(body);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || 'Invalid feedback content';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const { content } = validation.data;

  const { error: insertError } = await supabase.from('feedback').insert({
    policy_id: id,
    user_id: user.id,
    content,
    status: 'unreviewed',
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'You have already submitted feedback for this policy' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }

  return NextResponse.json(
    { message: 'Feedback submitted successfully', policyId: id },
    { status: 201 }
  );
}
