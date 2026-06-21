import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/auth/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const routeSchema = z.object({ id: z.coerce.number().int().positive() });

const updateSchema = z.object({
  name: z.string().min(3).max(150).trim().optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const routeParsed = routeSchema.safeParse({ id: rawId });
  if (!routeParsed.success) {
    return NextResponse.json({ error: 'Invalid ministry ID' }, { status: 400 });
  }

  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from('ministries')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', routeParsed.data.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A ministry with that name or slug already exists' },
        { status: 409 }
      );
    }
    console.error('[PATCH /api/admin/ministries/[id]]', error);
    return NextResponse.json({ error: 'Failed to update ministry' }, { status: 500 });
  }

  return NextResponse.json({ ministry: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const routeParsed = routeSchema.safeParse({ id: rawId });
  if (!routeParsed.success) {
    return NextResponse.json({ error: 'Invalid ministry ID' }, { status: 400 });
  }

  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  const db = createServiceRoleClient();

  // Fetch name to check usage
  const { data: ministry } = await db
    .from('ministries')
    .select('name')
    .eq('id', routeParsed.data.id)
    .single();

  if (ministry) {
    const { count } = await db
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .eq('ministry', ministry.name);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${count} polic${count === 1 ? 'y uses' : 'ies use'} this ministry`,
        },
        { status: 409 }
      );
    }
  }

  const { error } = await db.from('ministries').delete().eq('id', routeParsed.data.id);

  if (error) {
    console.error('[DELETE /api/admin/ministries/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete ministry' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Ministry deleted' });
}
