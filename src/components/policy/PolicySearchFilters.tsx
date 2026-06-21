'use client';

import { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Select, Input, Button } from '@/components/ui';

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
        <Select
          id={`category-filter-${variant}`}
          name="category"
          defaultValue={category}
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((cat) => ({ value: cat.slug, label: cat.name })),
          ]}
          containerClassName="w-full"
        />
      </div>

      <div>
        <label htmlFor={`ministry-filter-${variant}`} className="sr-only">
          Filter by ministry
        </label>
        <Select
          id={`ministry-filter-${variant}`}
          name="ministry"
          defaultValue={ministry}
          options={[
            { value: '', label: 'All Ministries' },
            ...ministries.map((m) => ({ value: m, label: m })),
          ]}
          containerClassName="w-full"
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto" size="md">
        Apply Filters
      </Button>
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
            <Input
              id="search-input-sidebar"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search policies..."
              className="pl-10 pr-4"
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
        <Input
          id="search-input-inline"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search policies..."
          className="pl-10"
        />
      </div>

      {/* Mobile (<640px): filters stacked */}
      <div className="flex flex-col gap-3 sm:hidden">{filterFields}</div>

      {/* Tablet (640–1024px): collapsible filters */}
      <div className="hidden sm:block lg:hidden">
        {!filtersOpen && category && <input type="hidden" name="category" value={category} />}
        {!filtersOpen && ministry && <input type="hidden" name="ministry" value={ministry} />}
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-between"
          onClick={() => setFiltersOpen(!filtersOpen)}
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
        </Button>
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
