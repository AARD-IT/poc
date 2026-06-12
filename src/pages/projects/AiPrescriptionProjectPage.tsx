import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  ChevronDown,
  X,
  CircleHelp,
  Rocket,
  XCircle,
  Loader2,
  CheckCircle2,
  FileText,
  Trash2,
} from 'lucide-react'

export const AI_PRESCRIPTION_STREAMLIT_ORIGIN = 'https://6jqgsyupocbatrzmhjz9am.streamlit.app/'

type Tab = 'overview' | 'application' | 'special-consultation'

/* ─── Overview content ─────────────────────────────────────── */
const capabilities = [
  'Supports 9 domains — Finance, Healthcare, Supply Chain, E-Commerce, HR Analytics, Automobile, Manufacturing, Retail, and Cyber Security.',
  'AI generates personalised prescription text with domain-specific bullets using Groq LLaMA 3.3 70B.',
  'Download as PDF (3 pages) or editable Word (.docx) document.',
  "Send the prescription directly to the candidate's email with CC support.",
  'Career table includes roles, challenges, key skills, and targeted companies per domain.',
]

const businessImpact = [
  'Replace manual prescription writing — generate tailored career documents in seconds.',
  'Deliver consistent, professional-grade prescriptions to every prospective student.',
  'Send directly to candidates via email without leaving the app.',
  'Word export lets consultants make last-minute edits before sharing.',
  'Scale across hundreds of consultations without additional effort.',
]

/* ─── Sub-components ───────────────────────────────────────── */
function OverviewTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Overview</h2>

      {/* Purpose card */}
      <div className="aa-card p-6 mb-8 bg-white">
        <p className="text-[11px] font-bold text-[#0284C7] tracking-widest uppercase mb-3">
          Purpose
        </p>
        <p className="text-[15px] text-[#334155] leading-relaxed">
          Generate personalised, AI-powered career prescriptions for aspiring data professionals —
          combining Groq LLaMA 3.3 70B intelligence with domain-specific career templates to produce
          a structured 3-page PDF and editable Word document covering skills, projects, roles, and
          targeted companies.
        </p>
      </div>

      {/* Two columns: Capabilities + Business Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Capabilities */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#0284C7]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Capabilities</h3>
          </div>
          <div className="aa-card p-5 bg-white h-full">
            <ul className="space-y-3">
              {capabilities.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#334155] leading-relaxed">
                  <ChevronRight className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Business Impact */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#0F766E]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Business Impact</h3>
          </div>
          <div className="aa-card p-5 bg-white h-full">
            <ul className="space-y-3">
              {businessImpact.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#334155] leading-relaxed">
                  <Target className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


const DEFAULT_PROGRAMS = [
  'Nationwide Data Analytics Training and Placement Program 2026',
  'Nationwide Data Engineering and Gen AI Program 2026',
  'Nationwide Data Analytics and Business Intelligence Program 2026',
]

const DEFAULT_TECHS = [
  'SQL',
  'Python',
  'Statistics',
  'Power BI',
  'Machine Learning',
  'Gen AI',
  'Cloud',
  'ETL',
  'Data Engineering',
  'Tableau',
  'Visualization',
]

const DOMAINS = [
  'Finance',
  'Supply Chain',
  'Healthcare',
  'HR Analytics',
  'E-Commerce',
  'Automobile',
  'Manufacturing',
  'Retail',
  'Cyber Security',
  'Marketing Analytics',
]

const STATUSES = ['Working Professional', 'Student', 'Job Seeker']
const DEFAULT_CONSULTATION_NOTE_EXAMPLE =
  'As per our discussion, you completed B.Com and have two years of experience in accounts. You cannot directly become a Data Analyst at this stage, but this programme will bridge that gap and help you transition into a data-driven role with the right skills and projects.'

function ApplicationTab({
  consultationNote,
}: {
  consultationNote: string
  setConsultationNote: (value: string) => void
}) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Working Professional')
  const [program, setProgram] = useState(DEFAULT_PROGRAMS[0])
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(DEFAULT_TECHS.slice(0, 6))
  const [domainOpen, setDomainOpen] = useState(false)
  const [techOpen, setTechOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [composeLoading, setComposeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [aiContent, setAiContent] = useState<Record<string, any> | null>(null)
  const [tableRows, setTableRows] = useState<any[]>([])
  const [domainMap, setDomainMap] = useState<Record<string, number>>({})
  const [emailTo, setEmailTo] = useState('')
  const [emailCc, setEmailCc] = useState('')
  const [emailSubject, setEmailSubject] = useState('Your Learning & Internship Journey – Analytics Avenue')
  const [emailBody, setEmailBody] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [emailReady, setEmailReady] = useState(false)
  const [programOptions, setProgramOptions] = useState(DEFAULT_PROGRAMS)
  const [techOptions, setTechOptions] = useState(DEFAULT_TECHS)
  const [tierOptions, setTierOptions] = useState<string[]>(['Standard – Total ₹25,000 (₹20,000 + ₹5,000)'])
  const [consultants, setConsultants] = useState<string[]>(['VETRISELVAN G'])
  const [feeTier, setFeeTier] = useState('Standard – Total ₹25,000 (₹20,000 + ₹5,000)')
  const [consultant, setConsultant] = useState('VETRISELVAN G')
  const [customTotal, setCustomTotal] = useState('25000')
  const [customOnboarding, setCustomOnboarding] = useState('20000')
  const [customRemaining, setCustomRemaining] = useState('5000')
  const [customConsultant, setCustomConsultant] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const techDropdownRef = useRef<HTMLDivElement>(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  function getDefaultEmailBody(recipientName: string, domains: string[]) {
    const domainText = domains.length > 0 ? domains.join(', ') : 'E-Commerce'
    return `Dear ${recipientName || 'Candidate'},\n\nThank you for your recent consultation with Analytics Avenue.\n\nAs discussed, please find attached your personalised Career Prescription prepared by our team. This document outlines your tailored roadmap and domain-specific career opportunities in ${domainText}.\n\nPlease review the attached prescription and connect with us for the next steps.\n\nBest regards,\nAnalytics Avenue`
  }

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch(`${apiBase}/`)
        const data = await response.json()
        if (response.ok) {
          if (Array.isArray(data.valid_programs) && data.valid_programs.length) setProgramOptions(data.valid_programs)
          if (Array.isArray(data.valid_techs) && data.valid_techs.length) setTechOptions(data.valid_techs)
          if (Array.isArray(data.program_tiers) && data.program_tiers.length) setTierOptions(data.program_tiers)
          if (Array.isArray(data.consultants) && data.consultants.length) setConsultants(data.consultants)
        }
      } catch {
        // keep static defaults
      }
    }
    loadOptions()
  }, [apiBase])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDomainOpen(false)
      }
      if (techDropdownRef.current && !techDropdownRef.current.contains(e.target as Node)) {
        setTechOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setEmailBody(getDefaultEmailBody(name, selectedDomains))
  }, [name, selectedDomains])

  function toggleDomain(domain: string) {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain],
    )
  }

  function selectAll() {
    setSelectedDomains(selectedDomains.length === DOMAINS.length ? [] : [...DOMAINS])
  }

  function removeDomain(domain: string) {
    setSelectedDomains((prev) => prev.filter((d) => d !== domain))
  }

  function clearAll() {
    setSelectedDomains([])
  }

  function toggleTechnology(technology: string) {
    setSelectedTechnologies((prev) =>
      prev.includes(technology) ? prev.filter((item) => item !== technology) : [...prev, technology],
    )
  }

  function clearAllTechnologies() {
    setSelectedTechnologies([])
  }

  async function handleGeneratePrescription() {
    setError(null)
    setSuccess(false)

    if (!name.trim()) {
      setError('Please enter the candidate name.')
      return
    }

    if (selectedDomains.length === 0) {
      setError('Please select at least one domain.')
      return
    }

    if (selectedDomains.length > 3) {
      setError('Please select up to 3 domains only.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          status,
          domains: selectedDomains,
          technologies: selectedTechnologies,
          program,
          consultation_note: consultationNote,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Failed to generate prescription.')
      }

      setJobId(data.job_id)
      setAiContent(data.ai_content)
      setTableRows(data.table_rows)
      setDomainMap(data.domain_map)
      setSuccess(true)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Unable to generate prescription.')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadPdf() {
    if (!jobId) return
    window.open(`${apiBase}/download/pdf/${jobId}`, '_blank')
  }

  function handleDownloadDocx() {
    if (!jobId) return
    window.open(`${apiBase}/download/docx/${jobId}`, '_blank')
  }

  async function handleComposeEmail() {
    setError(null)
    if (!jobId) {
      setError('Please generate the prescription before composing the email.')
      return
    }

    const total = feeTier === 'Custom' ? Number(customTotal || 0) : 25000
    const onboarding = feeTier === 'Custom' ? Number(customOnboarding || 0) : 20000
    const remaining = feeTier === 'Custom' ? Number(customRemaining || 0) : 5000
    const consultantName = consultant === 'Other' ? customConsultant.trim().toUpperCase() : consultant

    setComposeLoading(true)
    try {
      const response = await fetch(`${apiBase}/compose-email-body`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: name,
          total,
          onboarding,
          remaining,
          consultant_name: consultantName || 'VETRISELVAN G',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to compose email body.')
      setEmailSubject(data.subject || emailSubject)
      setEmailBody(data.text_body || '')
      setHtmlBody(data.html_body || '')
      setEmailReady(true)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Unable to compose email body.')
    } finally {
      setComposeLoading(false)
    }
  }

  async function handleSendEmail() {
    setError(null)
    if (!jobId) {
      setError('Please generate the prescription before sending email.')
      return
    }

    if (!emailTo.trim() || !emailTo.includes('@')) {
      setError('Enter a valid recipient email address.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          to_email: emailTo,
          cc_emails: emailCc.split(',').map((item) => item.trim()).filter(Boolean),
          subject: emailSubject,
          body: emailBody,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Failed to send email.')
      }

      setSuccess(true)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Unable to send email.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendEmail() {
    setError(null)
    if (!jobId) {
      setError('Please generate the prescription before resending email.')
      return
    }
    if (!emailTo.trim() || !emailTo.includes('@')) {
      setError('Enter a valid recipient email address.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${apiBase}/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          to_email: emailTo,
          cc_emails: emailCc.split(',').map((item) => item.trim()).filter(Boolean),
          subject: emailSubject,
          body: emailBody,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to resend email.')
      setSuccess(true)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Unable to resend email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0F172A] mb-5">Your Details</h2>

      <div className="aa-card p-6 bg-white">
        {/* Row 1: Name + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Student Name"
              className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] placeholder:text-[#94A3B8] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-9 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className=" gap-5 mb-5">
          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Program Name</label>
            <div className="relative">
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-9 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition cursor-pointer"
              >
                {programOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
          <div />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">Technologies Needed</label>
            <CircleHelp className="w-4 h-4 text-[#94A3B8]" />
          </div>

          <div className="relative" ref={techDropdownRef}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setTechOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setTechOpen((o) => !o)
              }}
              className="min-h-[42px] w-full flex flex-wrap items-center gap-1.5 px-3 py-2 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] cursor-pointer focus:outline-none focus:border-[#1a3c6e]"
            >
              {selectedTechnologies.length === 0 ? (
                <span className="text-[14px] text-[#94A3B8] flex-1">Choose options</span>
              ) : (
                selectedTechnologies.map((tech) => (
                  <span key={tech} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0F766E] text-white text-[12px] font-semibold">
                    {tech}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTechnology(tech)
                      }}
                      className="hover:opacity-70"
                      aria-label={`Remove ${tech}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
              <div className="ml-auto flex items-center gap-1">
                {selectedTechnologies.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTechnologies([])
                    }}
                    className="text-[#94A3B8] hover:text-[#475569]"
                    aria-label="Clear all technologies"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${techOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {techOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedTechnologies(selectedTechnologies.length === techOptions.length ? [] : [...techOptions])}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] border-b border-[#E2E8F0] transition"
                >
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedTechnologies.length === techOptions.length ? 'bg-[#1a3c6e] border-[#1a3c6e]' : 'border-[#CBD5E1]'}`}>
                    {selectedTechnologies.length === techOptions.length && <span className="text-white text-[10px] font-bold">✓</span>}
                  </span>
                  Select all
                </button>
                {techOptions.map((item) => {
                  const checked = selectedTechnologies.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleTechnology(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#334155] hover:bg-[#F8FAFC] transition"
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-[#1a3c6e] border-[#1a3c6e]' : 'border-[#CBD5E1]'}`}>
                        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                      </span>
                      {item}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">Target Domains <span className="text-red-500">*</span></label>
            <CircleHelp className="w-4 h-4 text-[#94A3B8]" />
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setDomainOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setDomainOpen((o) => !o)
              }}
              className="min-h-[42px] w-full flex flex-wrap items-center gap-1.5 px-3 py-2 border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] cursor-pointer focus:outline-none focus:border-[#1a3c6e]"
            >
              {selectedDomains.length === 0 ? (
                <span className="text-[14px] text-[#94A3B8] flex-1">Choose options</span>
              ) : (
                selectedDomains.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EF4444] text-white text-[12px] font-semibold"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeDomain(d)
                      }}
                      className="hover:opacity-70"
                      aria-label={`Remove ${d}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
              <div className="ml-auto flex items-center gap-1">
                {selectedDomains.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearAll()
                    }}
                    className="text-[#94A3B8] hover:text-[#475569]"
                    aria-label="Clear all"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform ${domainOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {domainOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={selectAll}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] border-b border-[#E2E8F0] transition"
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedDomains.length === DOMAINS.length
                        ? 'bg-[#1a3c6e] border-[#1a3c6e]'
                        : 'border-[#CBD5E1]'
                    }`}
                  >
                    {selectedDomains.length === DOMAINS.length && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                  </span>
                  Select all
                </button>

                <div className="max-h-56 overflow-y-auto">
                  {DOMAINS.map((d) => {
                    const checked = selectedDomains.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#334155] hover:bg-[#F8FAFC] transition"
                      >
                        <span
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            checked ? 'bg-[#1a3c6e] border-[#1a3c6e]' : 'border-[#CBD5E1]'
                          }`}
                        >
                          {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                        </span>
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGeneratePrescription}
          disabled={loading}
          className="aa-button aa-button-primary px-6 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Prescription'}
        </button>

        {error && (
          <div className="mt-5 rounded-xl border border-[#F8D7DA] bg-[#FCE8EA] px-4 py-3 text-sm text-[#842029]">
            {error}
          </div>
        )}

        {success && jobId && (
          <div className="mt-5 rounded-xl border border-[#D1E7DD] bg-[#E6F4EA] px-4 py-3 text-sm text-[#0F5132]">
            Prescription generated successfully! You can download the file or send it by email.
          </div>
        )}

        {jobId && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="aa-button aa-button-primary px-6 py-3"
            >
              📄 Download PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              className="aa-button aa-button-secondary px-6 py-3"
            >
              📄 Download Word (.docx)
            </button>
          </div>
        )}
      </div>

      {jobId && (
        <div className="mt-8 aa-card p-6 bg-white">
          <h3 className="text-lg font-bold text-[#0F172A] mb-4">Compose & Send Email</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Fee Tier</label>
              <div className="relative">
                <select value={feeTier} onChange={(e) => setFeeTier(e.target.value)} className="w-full appearance-none px-3 py-2.5 pr-9 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition cursor-pointer">
                  {tierOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  <option value="Custom">Custom</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Consultant</label>
              <div className="relative">
                <select value={consultant} onChange={(e) => setConsultant(e.target.value)} className="w-full appearance-none px-3 py-2.5 pr-9 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition cursor-pointer">
                  {consultants.map((item) => <option key={item} value={item}>{item}</option>)}
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
              </div>
            </div>
          </div>
          {consultant === 'Other' && <input value={customConsultant} onChange={(e) => setCustomConsultant(e.target.value.toUpperCase())} placeholder="Enter consultant name" className="w-full mb-5 px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition" />}
          {feeTier === 'Custom' && <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5"><div><label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Total</label><input type="number" value={customTotal} onChange={(e) => setCustomTotal(e.target.value)} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition" /></div><div><label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Onboarding</label><input type="number" value={customOnboarding} onChange={(e) => setCustomOnboarding(e.target.value)} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition" /></div><div><label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Remaining</label><input type="number" value={customRemaining} onChange={(e) => setCustomRemaining(e.target.value)} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition" /></div></div>}
          <div className="flex flex-wrap gap-3 mb-5">
            <button type="button" onClick={handleComposeEmail} disabled={composeLoading} className="aa-button aa-button-primary px-6 py-3 disabled:opacity-70 disabled:cursor-not-allowed">{composeLoading ? 'Composing...' : 'Compose Email Body'}</button>
          </div>

          {emailReady && (
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">To *</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="candidate@email.com"
                className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">CC (comma-separated)</label>
              <input
                type="text"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                placeholder="cc1@email.com, cc2@email.com"
                className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Email Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-lg text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition resize-none"
              />
            </div>
            {htmlBody && <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Preview Formatted Email</label>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[13px] text-[#334155]" dangerouslySetInnerHTML={{ __html: htmlBody }} />
            </div>}

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={handleSendEmail} disabled={loading} className="aa-button aa-button-primary px-6 py-3 disabled:opacity-70 disabled:cursor-not-allowed">{loading ? 'Sending...' : 'Send Mail'}</button>
            </div>
          </div>
          )}
        </div>
      )}

      {aiContent && (
        <div className="mt-8 aa-card p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0F172A]">AI Content</h3>
          </div>
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 overflow-x-auto">
            {JSON.stringify(aiContent, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}


/* ─── Main page ────────────────────────────────────────────── */
export function AiPrescriptionProjectPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [consultationNote, setConsultationNote] = useState('')
  const [draftConsultationNote, setDraftConsultationNote] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ai-prescription-consultation-note') || ''
    const sanitized = saved.trim() === DEFAULT_CONSULTATION_NOTE_EXAMPLE.trim() ? '' : saved
    setConsultationNote(sanitized)
    setDraftConsultationNote(sanitized)
  }, [])

  return (
    <div className="min-h-full bg-white">
      {/* Page body */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-[13px] font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
        >
          ← Back
        </button>

        {/* Title block */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl leading-none">🤖</span>
            <h1 className="text-[2.25rem] font-bold text-[#0F172A] leading-tight">
              AI Prescription Generator
            </h1>
          </div>
          <p className="text-[#64748B] text-[15px] mt-1">
            Generate a personalised data career prescription powered by AI
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-1 shadow-sm">
          <div className="flex gap-0 flex-wrap">
            {(['overview', 'application', 'special-consultation'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 pb-3 text-[15px] font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-[#1a3c6e] font-semibold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[3px] rounded-t bg-[#E85D04]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'application' && (
          <ApplicationTab
            consultationNote={consultationNote}
            setConsultationNote={setConsultationNote}
          />
        )}
        {activeTab === 'special-consultation' && (
          <div className="aa-card p-6 bg-white">
            <div className="mb-6">
              <p className="text-[11px] font-bold text-[#0284C7] tracking-widest uppercase mb-2">Special Consultation</p>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Special Consultation Note</h2>
              <p className="text-[15px] text-[#475569] leading-relaxed">
                Type your custom consultation note below. This will appear directly under the Prescription heading in the generated PDF and Word document, followed by the AI-generated domain-specific content as usual.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 mb-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0F766E] mb-2">Example</p>
              <p className="text-[14px] text-[#334155] leading-relaxed">
                Use the textarea below to write your own consultation note. The example text is shown only for guidance and will not be saved unless you type it yourself and click <span className="font-semibold">Save Note</span>.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <label className="block text-[13px] font-semibold text-[#334155]">
                Consultation Note <span className="text-red-500">*</span>
              </label>
              <p className="text-[13px] text-[#64748B]">Add your personalised notes here. The saved value will continue to flow into the existing prescription generation request.</p>
            </div>

            <textarea
              value={draftConsultationNote}
              onChange={(e) => {
                setDraftConsultationNote(e.target.value)
                setSaveSuccess(false)
              }}
              rows={10}
              placeholder="e.g. As per our discussion, you completed B.Com and have two years of experience in accounts. You cannot directly become a Data Analyst at this stage, but this programme will bridge that gap and help you transition into a data-driven role with the right skills and projects."
              className="w-full px-4 py-3 border border-[#CBD5E1] rounded-2xl text-[14px] text-[#1E293B] bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10 transition resize-y min-h-[180px]"
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextNote = draftConsultationNote.trim()
                  localStorage.setItem('ai-prescription-consultation-note', nextNote)
                  setConsultationNote(nextNote)
                  setSaveSuccess(true)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a3c6e] px-5 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#142d53] transition"
              >
                <FileText className="w-4 h-4" />
                Save Note
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftConsultationNote('')
                  setConsultationNote('')
                  localStorage.setItem('ai-prescription-consultation-note', '')
                  setSaveSuccess(false)
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-5 py-3 text-[14px] font-semibold text-[#334155] hover:bg-[#F8FAFC] transition"
              >
                <Trash2 className="w-4 h-4" />
                Clear Note
              </button>
            </div>

            {saveSuccess && (
              <div className="mt-6 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#059669] mt-0.5" />
                  <p className="text-[14px] text-[#065F46] leading-relaxed">
                    ✅ Consultation note saved. Go to the Application tab and generate the prescription — your note will appear under the Prescription heading.
                  </p>
                </div>
              </div>
            )}

            {consultationNote.trim() && (
              <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <p className="text-[13px] font-semibold text-[#0F172A] mb-3">Currently saved note (will appear in next generated PDF):</p>
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-[14px] text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {consultationNote}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
