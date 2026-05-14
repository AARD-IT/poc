import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface SearchFiltersContextValue {
  headerQuery: string
  setHeaderQuery: (q: string) => void
  resultsQuery: string
  setResultsQuery: (q: string) => void
  selectedFilters: Set<string>
  setSelectedFilters: (next: Set<string>) => void
}

const SearchFiltersContext = createContext<SearchFiltersContextValue | null>(null)

export function SearchFiltersProvider({ children }: { children: ReactNode }) {
  const [headerQuery, setHeaderQuery] = useState('')
  const [resultsQuery, setResultsQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())

  const value = useMemo(
    () => ({
      headerQuery,
      setHeaderQuery,
      resultsQuery,
      setResultsQuery,
      selectedFilters,
      setSelectedFilters,
    }),
    [headerQuery, resultsQuery, selectedFilters]
  )

  return <SearchFiltersContext.Provider value={value}>{children}</SearchFiltersContext.Provider>
}

export function useSearchFilters(): SearchFiltersContextValue {
  const ctx = useContext(SearchFiltersContext)
  if (!ctx) throw new Error('useSearchFilters must be used within SearchFiltersProvider')
  return ctx
}
