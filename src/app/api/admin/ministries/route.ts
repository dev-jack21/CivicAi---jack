import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/auth/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const ministrySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(150).trim(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only')
    .optional(),
});

/** GET /api/admin/ministries — list curated ministries with usage count */
export async function GET() {
  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  const db = createServiceRoleClient();

  const { data: ministries, error } = await db
    .from('ministries')
    .select('id, name, slug, created_at')
    .order('name');

  if (error) {
    console.error('[GET /api/admin/ministries]', error);
    return NextResponse.json({ error: 'Failed to fetch ministries' }, { status: 500 });
  }

  // Get usage count from policies
  const { data: policyCounts } = await db.from('policies').select('ministry');

  const countMap: Record<string, number> = {};
  (policyCounts ?? []).forEach((row) => {
    if (row.ministry) {
      countMap[row.ministry] = (countMap[row.ministry] ?? 0) + 1;
    }
  });

  const withCount = (ministries ?? []).map((m) => ({
    ...m,
    policy_count: countMap[m.name] ?? 0,
  }));

  return NextResponse.json({ ministries: withCount });
}

/** POST /api/admin/ministries — create a new ministry */
export async function POST(request: NextRequest) {
  const { authorized, errorResponse } = await verifyAdmin();
  if (!authorized) return errorResponse!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ministrySchema.safeParse(body);
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
  const { data, error } = await db.from('ministries').insert({ name, slug }).select().single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A ministry with that name or slug already exists' },
        { status: 409 }
      );
    }
    console.error('[POST /api/admin/ministries]', error);
    return NextResponse.json({ error: 'Failed to create ministry' }, { status: 500 });
  }

  return NextResponse.json({ ministry: data }, { status: 201 });
}
