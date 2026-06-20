'use client';

import { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface PolicySearchFiltersProps {
  search: string;
  category: string;
  ministry: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  ministries: string[];
  /** sidebar = always visible in desktop sidebar; inline = top of content area */
  variant: 'sidebar' | 'inline';
}

export default function PolicySearchFilters({
  search,
  category,
  ministry,
  categories,
  ministries,
  variant,
}: PolicySearchFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(Boolean(category || ministry));

  const filterFields = (
    <>
      <div>
        <label htmlFor={`category-filter-${variant}`} className="sr-only">
          Filter by category
        </label>
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <select
            id={`category-filter-${variant}`}
            name="category"
            defaultValue={category}
            className="w-full appearance-none pl-10 pr-8 min-h-11 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`ministry-filter-${variant}`} className="sr-only">
          Filter by ministry
        </label>
        <select
          id={`ministry-filter-${variant}`}
          name="ministry"
          defaultValue={ministry}
          className="w-full appearance-none px-3 min-h-11 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">All Ministries</option>
          {ministries.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto inline-flex items-center justify-center min-h-11 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Apply Filters
      </button>
    </>
  );

  if (variant === 'sidebar') {
    return (
      <form
        method="GET"
        action="/policies"
        className="space-y-4"
        role="search"
        aria-label="Search and filter policies"
      >
        <div>
          <label
            htmlFor="search-input-sidebar"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Search
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="search-input-sidebar"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search policies..."
              className="w-full pl-10 pr-4 min-h-11 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-text-primary mb-3">Filters</p>
          <div className="space-y-3">{filterFields}</div>
        </div>
      </form>
    );
  }

  return (
    <form
      method="GET"
      action="/policies"
      className="mb-8"
      role="search"
      aria-label="Search and filter policies"
    >
      {/* Search — always visible on mobile and tablet */}
      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          aria-hidden="true"
        />
        <label htmlFor="search-input-inline" className="sr-only">
          Search policies
        </label>
        <input
          id="search-input-inline"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search policies..."
          className="w-full pl-10 pr-4 min-h-11 py-2.5 border border-border-custom rounded-md text-sm bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Mobile (<640px): filters stacked */}
      <div className="flex flex-col gap-3 sm:hidden">{filterFields}</div>

      {/* Tablet (640–1024px): collapsible filters */}
      <div className="hidden sm:block lg:hidden">
        {!filtersOpen && category && <input type="hidden" name="category" value={category} />}
        {!filtersOpen && ministry && <input type="hidden" name="ministry" value={ministry} />}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between min-h-11 px-4 py-2.5 border border-border-custom rounded-md text-sm font-medium text-text-primary bg-surface hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-expanded={filtersOpen}
          aria-controls="tablet-filters-panel"
        >
          <span className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" aria-hidden="true" />
            Filters
            {(category || ministry) && (
              <span className="text-xs font-normal text-primary">(active)</span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        {filtersOpen && (
          <div
            id="tablet-filters-panel"
            className="mt-3 flex flex-col gap-3 p-4 border border-border-custom rounded-md bg-gray-50"
          >
            {filterFields}
          </div>
        )}
      </div>
    </form>
  );
}
