import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface FilterSection {
  title: string
  items: { label: string; count: number }[]
}

const defaultSections: FilterSection[] = [
  {
    title: 'Type',
    items: [
      { label: 'Dashboard', count: 32 },
      { label: 'AI Tool', count: 12 },
      { label: 'Analytics', count: 18 },
      { label: 'Automation', count: 9 },
    ],
  },
  {
    title: 'Industry',
    items: [
      { label: 'Finance', count: 24 },
      { label: 'Healthcare', count: 18 },
      { label: 'Retail', count: 15 },
      { label: 'Manufacturing', count: 11 },
      { label: 'Education', count: 8 },
    ],
  },
  {
    title: 'Function',
    items: [
      { label: 'Data Analytics', count: 28 },
      { label: 'Reporting', count: 22 },
      { label: 'Forecasting', count: 16 },
      { label: 'Automation', count: 14 },
    ],
  },
  {
    title: 'Solution',
    items: [
      { label: 'AI-Powered', count: 35 },
      { label: 'Real-time', count: 21 },
      { label: 'Predictive', count: 19 },
      { label: 'Custom', count: 12 },
    ],
  },
  {
    title: 'Tech',
    items: [
      { label: 'AI', count: 28 },
      { label: 'Gen AI', count: 15 },
      { label: 'Power BI', count: 18 },
      { label: 'Tableau', count: 14 },
      { label: 'Python', count: 22 },
      { label: 'Automation', count: 12 },
    ],
  },
]

export interface FilterSidebarProps {
  /** When provided, replaces static demo counts (e.g. derived from live POCs). */
  sections?: FilterSection[]
  /** Controlled selection; omit for uncontrolled internal state. */
  selectedFilters?: Set<string>
  onSelectedFiltersChange?: (next: Set<string>) => void
}

export function FilterSidebar({ sections, selectedFilters: controlled, onSelectedFiltersChange }: FilterSidebarProps) {
  const filterSections = sections ?? defaultSections

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Type', 'Industry', 'Tech'])
  )
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set())
  const selectedFilters = controlled ?? internalSelected

  const setSelectedFilters = (updater: (prev: Set<string>) => Set<string>) => {
    const next = updater(selectedFilters)
    if (onSelectedFiltersChange) onSelectedFiltersChange(next)
    else setInternalSelected(next)
  }

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filter)) next.delete(filter)
      else next.add(filter)
      return next
    })
  }

  return (
    <aside className="w-64 bg-white border-r-2 border-[#CBD5E1] overflow-y-auto">
      <div className="p-4">
        <h2 className="font-bold text-[#1E293B] text-lg mb-4">Filters</h2>

        <div className="space-y-1">
          {filterSections.map((section) => {
            const isExpanded = expandedSections.has(section.title)

            return (
              <div key={section.title} className="border-b border-[#CBD5E1] pb-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between py-2 hover:bg-[#F1F5F9] px-2 rounded-lg transition-colors"
                >
                  <span className="font-bold text-[15px] text-[#1E293B]">{section.title}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#475569]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#475569]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const filterId = `${section.title}-${item.label}`
                      const isSelected = selectedFilters.has(filterId)

                      return (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => toggleFilter(filterId)}
                          className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-[15px] font-medium transition-all ${isSelected
                              ? 'bg-[#0F766E]/15 text-[#0F766E] border border-[#0F766E]/30'
                              : 'hover:bg-[#F1F5F9] text-[#1E293B] border border-transparent'
                            }`}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#0F766E] text-white' : 'bg-[#CBD5E1] text-[#475569]'
                              }`}
                          >
                            {item.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
