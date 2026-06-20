'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  FileText,
  Headphones,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  ministry: string;
  category: string | null;
  summary: string | null;
  audio_url: string | null;
  feedback_count: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface PolicyListResponse {
  policies: Policy[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  categories: Category[];
  ministries: string[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedMinistry, setSelectedMinistry] = useState(searchParams.get('ministry') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'));

  const [results, setResults] = useState<Policy[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ministries, setMinistries] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback((q: string, cat: string, min: string, pg: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    if (min) params.set('ministry', min);
    if (pg > 1) params.set('page', String(pg));
    return params.toString() ? `?${params.toString()}` : '';
  }, []);

  const fetchResults = useCallback(async (q: string, cat: string, min: string, pg: number) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (cat) params.set('category', cat);
      if (min) params.set('ministry', min);
      params.set('page', String(pg));
      params.set('limit', '12');

      const res = await fetch(`/api/policies?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: PolicyListResponse = await res.json();
      setResults(data.policies);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setCategories(data.categories);
      setMinistries(data.ministries);
    } catch {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories/ministries on mount and run initial search if params present
  useEffect(() => {
    const initialQ = searchParams.get('q') || '';
    const initialCat = searchParams.get('category') || '';
    const initialMin = searchParams.get('ministry') || '';
    const initialPage = Number(searchParams.get('page') || '1');

    if (initialQ || initialCat || initialMin) {
      fetchResults(initialQ, initialCat, initialMin, initialPage);
    } else {
      // Still load categories/ministries for the filter panel
      fetch('/api/policies?limit=1').then(async (res) => {
        if (!res.ok) return;
        const data: PolicyListResponse = await res.json();
        setCategories(data.categories ?? []);
        setMinistries(data.ministries ?? []);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search on query change
  const triggerSearch = useCallback(
    (q: string, cat: string, min: string, pg: number) => {
      const urlSuffix = buildUrl(q, cat, min, pg);
      router.replace(`/search${urlSuffix}`, { scroll: false });
      fetchResults(q, cat, min, pg);
    },
    [buildUrl, fetchResults, router]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSearch(val, selectedCategory, selectedMinistry, 1);
    }, 400);
  };

  const handleFilterChange = (cat: string, min: string) => {
    setSelectedCategory(cat);
    setSelectedMinistry(min);
    setPage(1);
    triggerSearch(query, cat, min, 1);
  };

  const handlePageChange = (pg: number) => {
    setPage(pg);
    triggerSearch(query, selectedCategory, selectedMinistry, pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAll = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedMinistry('');
    setPage(1);
    setResults([]);
    setHasSearched(false);
    router.replace('/search', { scroll: false });
    inputRef.current?.focus();
  };

  const hasActiveFilters = selectedCategory || selectedMinistry;
  const activeFilterCount = [selectedCategory, selectedMinistry].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-1">
          Search Policies
        </h1>
        <p className="text-text-secondary text-sm">
          Search Kenya&apos;s published government policy documents by keyword, category, or
          ministry.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <label htmlFor="search-input" className="sr-only">
          Search policies
        </label>
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="search-input"
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by title, summary, or description…"
          className="w-full pl-11 pr-12 py-3 border border-border-custom rounded-xl bg-surface text-text-primary placeholder-text-muted text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          aria-label="Search policies"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              triggerSearch('', selectedCategory, selectedMinistry, 1);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter toggle + active chips row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
            showFilters || hasActiveFilters
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-text-secondary border-border-custom hover:bg-bg-base'
          }`}
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {selectedCategory && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {categories.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory}
            <button
              type="button"
              onClick={() => handleFilterChange('', selectedMinistry)}
              className="hover:text-primary-dark focus:outline-none"
              aria-label="Remove category filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {selectedMinistry && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {selectedMinistry}
            <button
              type="button"
              onClick={() => handleFilterChange(selectedCategory, '')}
              className="hover:text-primary-dark focus:outline-none"
              aria-label="Remove ministry filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {(hasActiveFilters || query) && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-bg-base rounded-xl border border-border-custom grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="category-filter"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => handleFilterChange(e.target.value, selectedMinistry)}
              className="w-full px-3 py-2 text-sm border border-border-custom rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ministry-filter"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              Ministry
            </label>
            <select
              id="ministry-filter"
              value={selectedMinistry}
              onChange={(e) => handleFilterChange(selectedCategory, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-custom rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Ministries</option>
              {ministries.map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results area */}
      {loading ? (
        <div className="flex items-center justify-center py-24" aria-live="polite" aria-busy="true">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-text-secondary text-sm">Searching…</span>
        </div>
      ) : !hasSearched ? (
        /* Landing prompt — no search yet */
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Search className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Start searching</h2>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            Type a keyword above to search across policy titles, summaries, and descriptions. Use
            the filters to narrow by category or ministry.
          </p>
        </div>
      ) : results.length === 0 ? (
        /* No results */
        <div className="text-center py-20" aria-live="polite">
          <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText className="w-8 h-8 text-text-muted" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No policies found</h2>
          <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
            Try different keywords, or remove some filters to broaden your search.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-text-secondary mb-5" aria-live="polite">
            {total} {total === 1 ? 'policy' : 'policies'} found
            {query && (
              <>
                {' '}
                for <strong className="text-text-primary">&ldquo;{query}&rdquo;</strong>
              </>
            )}
          </p>

          {/* Results grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
            aria-label="Search results"
          >
            {results.map((policy) => (
              <article
                key={policy.id}
                className="flex flex-col bg-surface border border-border-custom rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Category + Ministry */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {policy.category && (
                    <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {policy.category}
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">{policy.ministry}</span>
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold text-text-primary mb-1.5 leading-snug flex-1">
                  <Link
                    href={`/policies/${policy.id}`}
                    className="hover:text-primary transition-colors focus:outline-none focus:underline"
                  >
                    {policy.title}
                  </Link>
                </h2>

                <p className="text-xs text-text-muted mb-3">
                  Published: {formatDate(policy.created_at)}
                </p>

                {/* Summary */}
                {policy.summary && (
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    {truncate(policy.summary, 140)}
                  </p>
                )}

                {/* Metadata badges */}
                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                  {policy.audio_url && (
                    <span className="inline-flex items-center gap-1" aria-label="Audio available">
                      <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
                      Audio
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`${policy.feedback_count} citizen responses`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    {policy.feedback_count}
                  </span>
                </div>

                {/* Action */}
                <Link
                  href={`/policies/${policy.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  Read Summary
                </Link>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center justify-center min-h-10 min-w-10 p-2 border border-border-custom rounded-lg bg-surface text-text-secondary hover:bg-bg-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                // Show pages around current
                let pg: number;
                if (totalPages <= 7) {
                  pg = i + 1;
                } else if (page <= 4) {
                  pg = i + 1;
                } else if (page >= totalPages - 3) {
                  pg = totalPages - 6 + i;
                } else {
                  pg = page - 3 + i;
                }
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => handlePageChange(pg)}
                    aria-current={pg === page ? 'page' : undefined}
                    className={`inline-flex items-center justify-center min-h-10 min-w-10 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      pg === page
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-text-secondary border-border-custom hover:bg-bg-base'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center justify-center min-h-10 min-w-10 p-2 border border-border-custom rounded-lg bg-surface text-text-secondary hover:bg-bg-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
