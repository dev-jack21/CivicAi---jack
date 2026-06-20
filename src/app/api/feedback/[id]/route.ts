import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/auth/admin';

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parsed = routeParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 });
  }

  const { authorized, errorResponse, supabase, session } = await verifyAdmin();
  if (!authorized || !session) {
    return errorResponse!;
  }
  const user = session.user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updateSchema = z.object({
    status: z.enum(['unreviewed', 'reviewed', 'flagged']),
  } as const);

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const { status } = validation.data;

  type UpdateData = {
    status: 'unreviewed' | 'reviewed' | 'flagged';
    reviewed_by?: string;
    reviewed_at?: string;
  };

  const updateData: UpdateData = { status };
  if (status === 'reviewed') {
    updateData.reviewed_by = user.id;
    updateData.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('feedback')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Feedback updated successfully', feedback: data });
}
