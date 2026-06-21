import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/auth/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80).trim(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only')
    .optional(),
});

/** GET /api/admin/categories — list all categories with policy count */
export async function GET() {
  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  const db = createServiceRoleClient();

  // Fetch categories with a count of associated policies
  const { data, error } = await db
    .from('categories')
    .select('id, name, slug, created_at')
    .order('name');

  if (error) {
    console.error('[GET /api/admin/categories]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  // Separately get policy counts per category
  const { data: counts } = await db
    .from('policies')
    .select('category_id')
    .not('category_id', 'is', null);

  const countMap: Record<number, number> = {};
  (counts ?? []).forEach((row) => {
    if (row.category_id != null) {
      countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
    }
  });

  const categoriesWithCount = (data ?? []).map((cat) => ({
    ...cat,
    policy_count: countMap[cat.id] ?? 0,
  }));

  return NextResponse.json({ categories: categoriesWithCount });
}

/** POST /api/admin/categories — create a new category */
export async function POST(request: NextRequest) {
  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  const { name } = parsed.data;
  const slug =
    parsed.data.slug ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const db = createServiceRoleClient();
  const { data, error } = await db.from('categories').insert({ name, slug }).select().single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A category with that name or slug already exists' },
        { status: 409 }
      );
    }
    console.error('[POST /api/admin/categories]', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
