import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { tagColors } from '@/utils/tagColors'

export interface ProjectDetailCardProject {
  title: string
  description: string
  date: string
  client: string
  industry: string
  function: string
  tech: string
  contact: string
  tags: string[]
  viewRoute?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export interface ProjectDetailCardProps {
  project: ProjectDetailCardProject
  actions?: ReactNode
  eyebrow?: string
}

export function ProjectDetailCardSkeleton() {
  return (
    <section className="aa-surface rounded-[28px] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8 lg:p-10">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="aa-surface rounded-[24px] bg-white/95 p-6 shadow-sm md:p-8">
          <div className="h-3 w-28 animate-pulse rounded-full bg-[#CCFBF1]" />
          <div className="mt-4 h-8 w-3/4 animate-pulse rounded-xl bg-[#E2E8F0]" />
          <div className="mt-5 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
          <div className="mt-6 flex gap-3">
            <div className="h-12 w-40 animate-pulse rounded-2xl bg-[#E2E8F0]" />
            <div className="h-12 w-36 animate-pulse rounded-2xl bg-[#E2E8F0]" />
          </div>
        </article>

        <aside className="aa-surface rounded-[24px] bg-white/95 p-6 shadow-sm md:p-8">
          <div className="h-6 w-40 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]" />
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}

export default function ProjectDetailCard({ project, actions, eyebrow = 'Project overview' }: ProjectDetailCardProps) {
  const navigate = useNavigate()

  const defaultActions = (
    <>
      {project.viewRoute ? (
        <button
          type="button"
          onClick={() => navigate(project.viewRoute!)}
          className="aa-button aa-button-primary md:px-8 md:py-3.5"
        >
          View Full Details
        </button>
      ) : null}

      {project.secondaryHref ? (
        <a
          href={project.secondaryHref}
          target="_blank"
          rel="noreferrer"
          className="aa-button aa-button-secondary md:px-8 md:py-3.5"
        >
          {project.secondaryLabel ?? 'Open Demo'}
        </a>
      ) : null}
    </>
  )

  return (
    <section className="aa-surface rounded-[28px] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8 lg:p-10">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">{project.title}</h2>
        </div>
        <span className="rounded-full border border-[#CCFBF1] bg-[#ECFDF5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Live project</span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="aa-surface rounded-[24px] bg-white/95 p-6 shadow-sm md:p-8">
          <p className="mb-4 text-[14px] leading-6 text-[#475569]">{project.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {actions ?? defaultActions}
          </div>
        </article>

        <aside className="aa-surface rounded-[24px] bg-white/95 p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <h3 className="text-xl font-semibold text-[#0F172A]">Solution Details</h3>
            <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Live</span>
          </div>

          <dl className="mt-5 space-y-4">
            {[
              ['Updated', project.date],
              ['Client', project.client],
              ['Industry', project.industry],
              ['Function', project.function],
              ['Tech', project.tech],
              ['Contact', project.contact],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 md:grid-cols-[110px_1fr] md:gap-4">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">{label}</dt>
                <dd className="text-[15px] font-semibold text-[#0F172A]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t border-[#E2E8F0] pt-6">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#475569]">Tags</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${tagColors[tag] || 'border-[#CBD5E1] bg-[#F1F5F9] text-[#334155]'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
