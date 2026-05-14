import { Outlet } from 'react-router'
import { FilterSidebar } from '@/app/components/FilterSidebar'
import { Header } from '@/app/components/Header'
import { SearchFiltersProvider, useSearchFilters } from '@/contexts/SearchFiltersContext'

function ShellInner() {
  const { headerQuery, setHeaderQuery, selectedFilters, setSelectedFilters } = useSearchFilters()

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Header searchQuery={headerQuery} onSearchChange={setHeaderQuery} />

      <div className="flex h-[calc(100vh-57px)]">
        <FilterSidebar
          selectedFilters={selectedFilters}
          onSelectedFiltersChange={setSelectedFilters}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Main dashboard shell: existing header + w-64 filter sidebar + scrollable content. */
export function MainShellWithSidebar() {
  return (
    <SearchFiltersProvider>
      <ShellInner />
    </SearchFiltersProvider>
  )
}
