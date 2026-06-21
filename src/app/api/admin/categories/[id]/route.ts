import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/auth/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const routeSchema = z.object({ id: z.coerce.number().int().positive() });

const updateSchema = z.object({
  name: z.string().min(2).max(80).trim().optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only')
    .optional(),
});

/** PATCH /api/admin/categories/[id] — update category */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const routeParsed = routeSchema.safeParse({ id: rawId });
  if (!routeParsed.success) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
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
    .from('categories')
    .update(parsed.data)
    .eq('id', routeParsed.data.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A category with that name or slug already exists' },
        { status: 409 }
      );
    }
    console.error('[PATCH /api/admin/categories/[id]]', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

/** DELETE /api/admin/categories/[id] — delete category (only if unused) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const routeParsed = routeSchema.safeParse({ id: rawId });
  if (!routeParsed.success) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
  }

  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  const db = createServiceRoleClient();

  // Check if any policies use this category
  const { count } = await db
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', routeParsed.data.id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} polic${count === 1 ? 'y' : 'ies'} use this category` },
      { status: 409 }
    );
  }

  const { error } = await db.from('categories').delete().eq('id', routeParsed.data.id);

  if (error) {
    console.error('[DELETE /api/admin/categories/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Category deleted' });
}
