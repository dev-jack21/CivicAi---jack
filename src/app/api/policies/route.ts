import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { policyUploadSchema } from '@/lib/validators/policy';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || '';
    const categorySlug = searchParams.get('category')?.trim() || '';
    const ministry = searchParams.get('ministry')?.trim() || '';

    let query = supabase
      .from('policies')
      .select('*, category:categories!inner(id, name, slug), feedback_count:feedback(count)', {
        count: 'exact',
      })
      .not('published_at', 'is', null)
      .eq('status', 'ready');

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,summary.ilike.%${search}%`
      );
    }

    if (categorySlug) {
      query = query.eq('category.slug', categorySlug);
    }

    if (ministry) {
      query = query.eq('ministry', ministry);
    }

    const {
      data: policies,
      error,
      count,
    } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch policies', status: 500 } },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const mapped = policies.map((p) => ({
      id: p.id,
      title: p.title,
      ministry: p.ministry,
      category: p.category?.name ?? null,
      description: p.description ?? '',
      summary: p.summary,
      audio_url: p.audio_url,
      document_url: p.document_url,
      status: p.status,
      published_at: p.published_at,
      created_at: p.created_at,
      feedback_count: p.feedback_count?.[0]?.count ?? 0,
    }));

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    const { data: ministriesData } = await supabase
      .from('policies')
      .select('ministry')
      .not('published_at', 'is', null)
      .eq('status', 'ready')
      .order('ministry');

    const ministries = [...new Set(ministriesData?.map((m) => m.ministry).filter(Boolean) ?? [])];

    return NextResponse.json({
      policies: mapped,
      total,
      page,
      limit,
      total_pages: totalPages,
      categories: categories ?? [],
      ministries,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}

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

    const parsed = policyUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            status: 422,
            details: parsed.error.flatten(),
          },
        },
        { status: 422 }
      );
    }

    const { document_url } = body;
    if (!document_url || typeof document_url !== 'string' || !document_url.startsWith('http')) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'document_url is required and must be a valid URL',
            status: 422,
          },
        },
        { status: 422 }
      );
    }

    const { title, ministry, category_id, description, effective_date } = parsed.data;

    const document_type = document_url.endsWith('.docx') ? 'docx' : 'pdf';

    const { data: policy, error } = await supabase
      .from('policies')
      .insert({
        title,
        ministry,
        category_id,
        description: description ?? null,
        document_url,
        document_type,
        status: 'pending',
        uploaded_by: session.user.id,
        effective_date: effective_date || null,
      })
      .select('id, title, status, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create policy', status: 500 } },
        { status: 500 }
      );
    }

    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const serviceRole = createServiceRoleClient();
    const { error: jobsError } = await serviceRole.from('processing_jobs').insert([
      { policy_id: policy.id, job_type: 'summarize', status: 'pending' },
      { policy_id: policy.id, job_type: 'tts', status: 'pending' },
    ]);

    if (jobsError) {
      console.error('Failed to insert processing jobs:', jobsError);
    }

    return NextResponse.json(policy, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      { status: 500 }
    );
  }
}
