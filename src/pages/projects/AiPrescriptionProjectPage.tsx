import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight, Zap, Target, TrendingUp, ChevronDown, X, CircleHelp, Rocket, XCircle } from 'lucide-react'

export const AI_PRESCRIPTION_STREAMLIT_ORIGIN = 'https://6jqgsyupocbatrzmhjz9am.streamlit.app/'

type Tab = 'overview' | 'application'

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
      <div className="border border-[#E2E8F0] rounded-xl p-6 mb-8 bg-white shadow-sm">
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
          <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white shadow-sm h-full">
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
          <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white shadow-sm h-full">
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
]

const STATUSES = ['Working Professional', 'Student', 'Job Seeker']

function ApplicationTab() {
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Working Professional')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [domainOpen, setDomainOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [aiContent, setAiContent] = useState<Record<string, any> | null>(null)
  const [tableRows, setTableRows] = useState<any[]>([])
  const [domainMap, setDomainMap] = useState<Record<string, number>>({})
  const [emailTo, setEmailTo] = useState('')
  const [emailCc, setEmailCc] = useState('')
  const [emailSubject, setEmailSubject] = useState(
    'Your Career Prescription – Analytics Avenue & Advanced Analytics',
  )
  const [emailBody, setEmailBody] = useState(getDefaultEmailBody('', []))
  const dropdownRef = useRef<HTMLDivElement>(null)

  function getDefaultEmailBody(recipientName: string, domains: string[]) {
    const domainText = domains.length > 0 ? domains.join(', ') : 'E-Commerce'
    return `Dear ${recipientName || 'Candidate'},\n\nThank you for your recent consultation with Analytics Avenue & Advanced Analytics.\n\nAs discussed, please find attached your personalised Career Prescription prepared by our Senior Data Scientist Mr. Subramani. This document outlines your tailored roadmap, key outcomes, and domain-specific career opportunities in ${domainText}.\n\nYour prescription covers:\n  • Customised career roadmap across E-Commerce\n  • Key technical skills: SQL, Python, Statistics, Power BI, Machine Learning, Gen AI\n  • Industry-relevant projects and placement support\n\nTo take the next step, please register and pay the initial ₹5,000 to block your seat:\nPayment Link: https://pages.razorpay.com/OpenAnalyticsAvenue\nUPI: aard@uco\n\nFeel free to reach out for any queries.\n\nWarm regards,\nData Consultant\nAnalytics Avenue & Advanced Analytics\nPh / WhatsApp: 9677298268\nEmail: supportteam@analyticsavenue.in`
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDomainOpen(false)
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

    let apiBase = import.meta.env.VITE_API_BASE_URL
    if (!apiBase) {
      console.warn('VITE_API_BASE_URL is not set — falling back to http://localhost:8000')
      apiBase = 'http://localhost:8000'
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
    const apiBasePdf = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    window.open(`${apiBasePdf}/download/pdf/${jobId}`, '_blank')
  }

  function handleDownloadDocx() {
    if (!jobId) return
    const apiBaseDocx = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    window.open(`${apiBaseDocx}/download/docx/${jobId}`, '_blank')
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

    const apiBaseEmail = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    setLoading(true)

    try {
      const response = await fetch(`${apiBaseEmail}/send-email`, {
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

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0F172A] mb-5">Your Details</h2>

      <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white shadow-sm">
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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">
              Target Domains <span className="text-red-500">*</span>
            </label>
            <CircleHelp className="w-4 h-4 text-[#94A3B8]" title="Select one or more domains" />
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3c6e] hover:bg-[#152e55] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-[15px] rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <Rocket className="w-4 h-4" />
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#15803D] hover:bg-[#13673D] text-white font-semibold rounded-lg transition shadow-sm"
            >
              📄 Download PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#166534] hover:bg-[#14532d] text-white font-semibold rounded-lg transition shadow-sm"
            >
              📄 Download Word (.docx)
            </button>
          </div>
        )}
      </div>

      {jobId && (
        <div className="mt-8 border border-[#E2E8F0] rounded-xl p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A] mb-4">Send Prescription by Email</h3>

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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-sm"
              >
                {loading ? 'Sending...' : 'Send Mail'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aiContent && (
        <div className="mt-8 border border-[#E2E8F0] rounded-xl p-6 bg-white shadow-sm">
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
        <div className="border-b-2 border-[#E2E8F0] mb-8">
          <div className="flex gap-0">
            {(['overview', 'application'] as Tab[]).map((tab) => (
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
        {activeTab === 'application' && <ApplicationTab />}
      </div>
    </div>
  )
}
