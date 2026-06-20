import { Suspense } from 'react';
import Link from 'next/link';
import PolicyList from '@/components/policy/PolicyList';
import PolicySearchFilters from '@/components/policy/PolicySearchFilters';

export const revalidate = 60;

interface PoliciesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getPolicies({
  search,
  category,
  ministry,
  page,
}: {
  search: string;
  category: string;
  ministry: string;
  page: string;
}) {
  const supabase = await createServerSupabaseClient();
  const pageNum = Math.max(1, parseInt(page || '1', 10));
  const limit = 12;
  const offset = (pageNum - 1) * limit;

  let query = supabase
    .from('policies')
    .select(
      category
        ? '*, category:categories!inner(id, name, slug), feedback_count:feedback(count)'
        : '*, category:categories(id, name, slug), feedback_count:feedback(count)',
      { count: 'exact' }
    )
    .not('published_at', 'is', null)
    .eq('status', 'ready');

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,summary.ilike.%${search}%`
    );
  }

  if (category) {
    query = query.eq('category.slug', category);
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
    throw new Error('Failed to fetch policies');
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const mapped = (policies || []).map((p) => ({
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

  return {
    policies: mapped,
    total,
    page: pageNum,
    limit,
    total_pages: totalPages,
    categories: categories ?? [],
    ministries,
  };
}

function SearchForm({
  search,
  category,
  ministry,
  categories,
  ministries,
}: {
  search: string;
  category: string;
  ministry: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  ministries: string[];
}) {
  return (
    <div className="lg:hidden">
      <PolicySearchFilters
        search={search}
        category={category}
        ministry={ministry}
        categories={categories}
        ministries={ministries}
        variant="inline"
      />
    </div>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  search,
  category,
  ministry,
}: {
  currentPage: number;
  totalPages: number;
  search: string;
  category: string;
  ministry: string;
}) {
  if (totalPages <= 1) return null;

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (ministry) params.set('ministry', ministry);
    params.set('page', String(page));
    return `/policies?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-center gap-4 mt-10" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="inline-flex items-center justify-center min-h-11 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          ← Prev
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center min-h-11 px-4 py-2 text-sm font-medium text-text-muted border border-border-custom rounded-md cursor-not-allowed">
          ← Prev
        </span>
      )}

      <span className="text-sm text-text-secondary">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="inline-flex items-center justify-center min-h-11 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Next →
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center min-h-11 px-4 py-2 text-sm font-medium text-text-muted border border-border-custom rounded-md cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-16">
      <p className="text-text-secondary text-lg">
        {hasFilters
          ? 'No policies match your search. Try different keywords or filters.'
          : 'No policies found. Check back later for new policy documents.'}
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="text-center py-16">
      <p className="text-text-secondary text-lg mb-4">Something went wrong. Please try again.</p>
      <Link
        href="/policies"
        className="inline-flex items-center justify-center min-h-11 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}

async function PoliciesContent({
  searchParams,
}: {
  searchParams: Awaited<PoliciesPageProps['searchParams']>;
}) {
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const ministry = typeof searchParams.ministry === 'string' ? searchParams.ministry : '';
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1';

  const hasFilters = !!(search || category || ministry);

  try {
    const data = await getPolicies({ search, category, ministry, page });

    return (
      <>
        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* Desktop sidebar filters (>1024px) */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
            <PolicySearchFilters
              search={search}
              category={category}
              ministry={ministry}
              categories={data.categories ?? []}
              ministries={data.ministries ?? []}
              variant="sidebar"
            />
          </aside>

          <div className="flex-1 min-w-0">
            <SearchForm
              search={search}
              category={category}
              ministry={ministry}
              categories={data.categories ?? []}
              ministries={data.ministries ?? []}
            />

            {data.policies.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">
                  Showing {data.policies.length} of {data.total} policy
                  {data.total !== 1 ? 'ies' : 'y'}
                </p>
                <PolicyList policies={data.policies} />
                <PaginationBar
                  currentPage={data.page}
                  totalPages={data.total_pages}
                  search={search}
                  category={category}
                  ministry={ministry}
                />
              </>
            )}
          </div>
        </div>
      </>
    );
  } catch {
    return <ErrorState />;
  }
}

function PoliciesSkeleton() {
  return (
    <div className="lg:flex lg:gap-8 lg:items-start">
      <div className="hidden lg:block w-64 shrink-0 space-y-4">
        <div className="h-11 bg-gray-100 rounded-md animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-md animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-8 space-y-3">
          <div className="h-11 bg-gray-100 rounded-md animate-pulse" />
          <div className="h-11 bg-gray-100 rounded-md animate-pulse sm:hidden" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function PoliciesPage({ searchParams }: PoliciesPageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      <h1 className="text-2xl font-bold text-text-primary mb-6">All Policies</h1>
      <Suspense fallback={<PoliciesSkeleton />}>
        <PoliciesContent searchParams={resolvedParams} />
      </Suspense>
    </div>
  );
}
