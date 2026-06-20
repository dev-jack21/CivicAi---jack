import { Suspense } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import PolicyList from '@/components/policy/PolicyList';

export const revalidate = 60;

interface PoliciesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (ministry) params.set('ministry', ministry);
  params.set('page', page);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/policies?${params.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch policies');
  }

  return res.json() as Promise<import('@/types').PolicyListResponse>;
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
    <form
      method="GET"
      action="/policies"
      className="flex flex-col sm:flex-row gap-3 mb-8"
      role="search"
      aria-label="Search policies"
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          aria-hidden="true"
        />
        <label htmlFor="search-input" className="sr-only">
          Search policies
        </label>
        <input
          id="search-input"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search policies..."
          className="w-full pl-10 pr-4 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex gap-3">
        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <select
            id="category-filter"
            name="category"
            defaultValue={category}
            className="appearance-none pl-10 pr-8 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="ministry-filter" className="sr-only">
          Filter by ministry
        </label>
        <select
          id="ministry-filter"
          name="ministry"
          defaultValue={ministry}
          className="appearance-none px-3 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">All Ministries</option>
          {ministries.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Filter
        </button>
      </div>
    </form>
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
          className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          ← Prev
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm font-medium text-text-muted border border-border-custom rounded-md cursor-not-allowed">
          ← Prev
        </span>
      )}

      <span className="text-sm text-text-secondary">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Next →
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm font-medium text-text-muted border border-border-custom rounded-md cursor-not-allowed">
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
        className="inline-flex px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors"
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
              Showing {data.policies.length} of {data.total} policy{data.total !== 1 ? 'ies' : 'y'}
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
      </>
    );
  } catch {
    return <ErrorState />;
  }
}

function PoliciesSkeleton() {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 h-11 bg-gray-100 rounded-md animate-pulse" />
        <div className="flex gap-3">
          <div className="w-44 h-11 bg-gray-100 rounded-md animate-pulse" />
          <div className="w-40 h-11 bg-gray-100 rounded-md animate-pulse" />
          <div className="w-20 h-11 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </>
  );
}

export default async function PoliciesPage({ searchParams }: PoliciesPageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">All Policies</h1>
      <Suspense fallback={<PoliciesSkeleton />}>
        <PoliciesContent searchParams={resolvedParams} />
      </Suspense>
    </div>
  );
}
