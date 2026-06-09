import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { getVisibleProjects } from '@/config/projects'

interface FilterSection {
  title: string
  items: { label: string; count: number }[]
}

function buildDefaultSections(): FilterSection[] {
  const counts = getVisibleProjects().reduce<Record<string, number>>((acc, project) => {
    const label = project.category?.trim() || 'Other'
    acc[label] = (acc[label] ?? 0) + 1
    return acc
  }, {})

  return [
    {
      title: 'Industry',
      items: Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count })),
    },
  ]
}

const defaultSections = buildDefaultSections()

export interface FilterSidebarProps {
  /** When provided, replaces static demo counts (e.g. derived from live POCs). */
  sections?: FilterSection[]
  /** Controlled selection; omit for uncontrolled internal state. */
  selectedFilters?: Set<string>
  onSelectedFiltersChange?: (next: Set<string>) => void
}

export function FilterSidebar({ sections, selectedFilters: controlled, onSelectedFiltersChange }: FilterSidebarProps) {
  const filterSections = sections ?? defaultSections

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Industry']))
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
    <aside className="w-72 border-r border-[#E2E8F0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[inset_-1px_0_0_rgba(226,232,240,0.7)] backdrop-blur-sm overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {filterSections.map((section) => {
            const isExpanded = expandedSections.has(section.title)

            return (
              <div key={section.title} className="border-b border-[#CBD5E1] pb-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-[#F8FAFC]"
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
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-[15px] font-medium transition-all duration-200 ${isSelected
                              ? 'border-[#0F766E]/30 bg-[#ECFDF5] text-[#0F766E] shadow-sm'
                              : 'border-transparent text-[#1E293B] hover:bg-[#F8FAFC] hover:border-[#E2E8F0]'
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
