import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  FilePlus,
  History,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
  AlertCircle,
  Loader,
} from 'lucide-react'
import {
  generatePreOffer,
  generateOfferLetter,
  generateInternship,
  calculateSalaryBreakup,
  getHistory,
  clearHistory as clearHistoryApi,
  downloadPdf,
  downloadDocx,
  getRoleResponsibilities,
  type SalaryParseResponse,
  type DocumentResponse,
  type HistoryResponse,
} from '../../services/offerLetterApi'

type OfferTab = 'pre-offer' | 'offer-letter' | 'internship-certificate' | 'history'

type PreOfferForm = {
  candidateName: string
  salutation: string
  role: string
  letterDate: string
  joiningDate: string
  includeTraining: boolean
  trainingMode: 'preset' | 'manual'
  trainingDuration: string
  includeProbation: boolean
  probationMode: 'preset' | 'manual'
  probationDuration: string
  ctcRangeOption: string
  ctcRangeCustom: string
  fixedStipendOption: string
  fixedStipendCustom: string
  incentiveOption: string
  incentiveCustom: string
}

type OfferLetterForm = {
  candidateName: string
  salutation: string
  role: string
  department: string
  salaryPrompt: string
  letterDate: string
  joiningDate: string
}

type InternshipForm = {
  internName: string
  salutation: string
  registrationNumber: string
  institution: string
  department: string
  role: string
  datesMode: 'auto' | 'manual'
  startDate: string
  endDate: string
  letterDate: string
  responsibilities: string
  reviewNotes: string
}

type HistoryItem = {
  id?: number
  documentType?: string
  candidate?: string
  timestamp?: string
  summary?: string
  [key: string]: any
}

const SALUTATIONS = ['Ms.', 'Mr.']
const PRE_OFFER_ROLES = [
  'Data Analyst',
  'Business Analyst',
  'Software Developer',
  'HR Executive',
  'Talent Acquisition Intern',
  'Data Analytics Intern',
  'Marketing Intern',
  'Business Development Intern',
  'Other',
]
const CTC_RANGE_OPTIONS = [
  '₹2 LPA – ₹3 LPA',
  '₹3 LPA – ₹5 LPA',
  '₹4 LPA – ₹6 LPA',
  '₹5 LPA – ₹8 LPA',
  '₹8 LPA – ₹10 LPA',
  'Other',
]
const STIPEND_OPTIONS = ['₹10,000', '₹12,000', '₹15,000', 'Other']
const INCENTIVE_OPTIONS = ['None', '₹15,000', '₹18,000', '₹20,000', 'Other']
const OFFER_ROLES = [
  'Data Analyst Trainee',
  'Data Analyst',
  'Business Analyst',
  'Software Developer',
  'HR Executive',
  'Talent Acquisition Intern',
  'Data Analytics Intern',
  'Marketing Intern',
  'Business Development Intern',
  'Other',
]
const OFFER_DEPARTMENTS = ['Analytics', 'Technology', 'HR', 'Business Development', 'Marketing', 'Finance', 'Operations']
const INTERNSHIP_DEPARTMENTS = [
  'Computer Science and Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Artificial Intelligence and Machine Learning',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Business Administration (BBA)',
  'Commerce (B.Com)',
  'MBA',
  'Mathematics',
  'Physics',
  'Psychology',
  'English Literature',
  'Economics',
  'Other',
]
const INTERNSHIP_ROLES = [
  'Data Analytics Trainee',
  'Data Analyst',
  'Business Analyst',
  'Software Developer',
  'HR Executive',
  'Talent Acquisition Intern',
  'Data Analytics Intern',
  'Marketing Intern',
  'Business Development Intern',
  'Other',
]
const RESPONSIBILITY_SUGGESTIONS = [
  'Data collection, cleaning, and preprocessing',
  'Building reports and dashboards using Power BI / Excel',
  'End-to-end business development activities',
  'Client engagement and lead generation',
  'Completion of mandatory technical and professional training programs',
]

const initialPreOffer: PreOfferForm = {
  candidateName: '',
  salutation: 'Ms.',
  role: 'Data Analyst',
  letterDate: new Date().toISOString().slice(0, 10),
  joiningDate: new Date().toISOString().slice(0, 10),
  includeTraining: true,
  trainingMode: 'preset',
  trainingDuration: '15 days',
  includeProbation: true,
  probationMode: 'preset',
  probationDuration: '2-4 months',
  ctcRangeOption: '₹2 LPA – ₹3 LPA',
  ctcRangeCustom: '',
  fixedStipendOption: '₹10,000',
  fixedStipendCustom: '',
  incentiveOption: '₹15,000',
  incentiveCustom: '',
}

const initialOfferLetter: OfferLetterForm = {
  candidateName: '',
  salutation: 'Ms.',
  role: 'Data Analyst Trainee',
  department: 'Analytics',
  salaryPrompt: 'e.g. "6 LPA, 40% basic, no PF, 10% variable"',
  letterDate: new Date().toISOString().slice(0, 10),
  joiningDate: new Date().toISOString().slice(0, 10),
}

const initialInternship: InternshipForm = {
  internName: '',
  salutation: 'Ms.',
  registrationNumber: '',
  institution: '',
  department: 'Computer Science and Engineering',
  role: 'Data Analytics Trainee',
  datesMode: 'manual',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
  letterDate: new Date().toISOString().slice(0, 10),
  responsibilities:
    'Work on Data collection, cleaning, and preprocessing tasks and ensure quality delivery.\nBuilding reports and dashboards using Power BI / Excel.\nWork on end-to-end business development activities and ensure quality delivery.\nWork on client engagement and lead generation tasks and ensure quality delivery.\nCompletion of mandatory technical and professional training programs.',
  reviewNotes:
    'Work on Data collection, cleaning, and preprocessing tasks and ensure quality delivery.\nBuilding reports and dashboards using Power BI / Excel.\nWork on end-to-end business development activities and ensure quality delivery.\nWork on client engagement and lead generation tasks and ensure quality delivery.\nCompletion of mandatory technical and professional training programs.',
}

const defaultHistory: HistoryItem[] = []

function formatDuration(start: string, end: string) {
  if (!start || !end) return '0 days'
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diff = Math.max(0, endDate.getTime() - startDate.getTime())
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function parseSalaryPrompt(prompt: string) {
  const normalized = prompt.trim()
  const ctcMatch = normalized.match(/(\d+(?:\.\d+)?)\s*LPA/i)
  const ctcAnnual = ctcMatch ? parseFloat(ctcMatch[1]) * 100000 : 0

  const basicFixedMatch = normalized.match(/basic\s*(\d+(?:\.\d+)?)\s*LPA/i)
  const basicPercentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*basic/i)
  const basicAnnual = basicFixedMatch
    ? parseFloat(basicFixedMatch[1]) * 100000
    : basicPercentMatch && ctcAnnual
    ? (ctcAnnual * parseFloat(basicPercentMatch[1])) / 100
    : ctcAnnual * 0.4

  const variablePercentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*variable/i)
  const variableAnnual = variablePercentMatch && ctcAnnual ? (ctcAnnual * parseFloat(variablePercentMatch[1])) / 100 : 0

  const hraPercentMatch = normalized.match(/hra\s*(?:[:\-])?\s*(\d+(?:\.\d+)?)\s*%/i)
  const hraPercentOfBasic = hraPercentMatch ? parseFloat(hraPercentMatch[1]) : 20
  const hraAnnual = (basicAnnual * hraPercentOfBasic) / 100

  const noPf = /no\s*pf/i.test(normalized)
  let pfAnnual = 0
  const pfMatch = normalized.match(/pf\s*(\d+(?:\.\d+)?)\s*%\s*(?:on\s*(\d+(?:\.\d+)?)\s*%\s*CTC)?/i)
  if (!noPf && pfMatch && ctcAnnual) {
    const pfPercent = parseFloat(pfMatch[1])
    const pfBaseFactor = pfMatch[2] ? parseFloat(pfMatch[2]) / 100 : 1
    pfAnnual = (ctcAnnual * pfBaseFactor * pfPercent) / 100
  }

  const specialAllowanceAnnual = Math.max(0, ctcAnnual - basicAnnual - hraAnnual - variableAnnual - pfAnnual)
  const grossMonthly = Math.round((basicAnnual + hraAnnual + specialAllowanceAnnual) / 12)

  return {
    ctcAnnual,
    basicAnnual,
    hraAnnual,
    pfAnnual,
    variableAnnual,
    specialAllowanceAnnual,
    grossMonthly,
    hraPercentOfBasic,
    basicPercent:
      ctcAnnual > 0 ? Math.round((basicAnnual / ctcAnnual) * 10000) / 100 : 0,
    variablePercent:
      ctcAnnual > 0 ? Math.round((variableAnnual / ctcAnnual) * 10000) / 100 : 0,
    pfDescription: noPf ? 'Not applicable' : pfAnnual > 0 ? `₹${Math.round(pfAnnual / 12).toLocaleString('en-IN')}/mo` : 'Not applicable',
  }
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#166534] text-xs font-semibold uppercase tracking-[0.08em]">
      <CheckCircle2 className="w-3.5 h-3.5" />
      {children}
    </span>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-[#0F172A] mb-2">{title}</h2>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  )
}

export function OfferLetterProjectPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<OfferTab>('pre-offer')
  const [preOfferForm, setPreOfferForm] = useState<PreOfferForm>(initialPreOffer)
  const [preOfferLoading, setPreOfferLoading] = useState(false)
  const [preOfferError, setPreOfferError] = useState<string | null>(null)
  const [preOfferResult, setPreOfferResult] = useState<DocumentResponse | null>(null)
  
  const [offerLetterForm, setOfferLetterForm] = useState<OfferLetterForm>(initialOfferLetter)
  const [offerLetterLoading, setOfferLetterLoading] = useState(false)
  const [offerLetterError, setOfferLetterError] = useState<string | null>(null)
  const [offerLetterResult, setOfferLetterResult] = useState<DocumentResponse | null>(null)
  const [salaryBreakupVisible, setSalaryBreakupVisible] = useState(false)
  const [salaryBreakup, setSalaryBreakup] = useState<SalaryParseResponse | null>(null)
  const [salaryLoading, setSalaryLoading] = useState(false)
  const [salaryError, setSalaryError] = useState<string | null>(null)
  
  const [internshipForm, setInternshipForm] = useState<InternshipForm>(initialInternship)
  const [internshipLoading, setInternshipLoading] = useState(false)
  const [internshipError, setInternshipError] = useState<string | null>(null)
  const [internshipResult, setInternshipResult] = useState<DocumentResponse | null>(null)
  
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(defaultHistory)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null)
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const data = await getHistory()
      setHistoryItems(data.history || [])
    } catch (error) {
      console.error('Error loading history:', error)
      setHistoryError(error instanceof Error ? error.message : 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const parsedOfferSalary = useMemo(() => 
    salaryBreakup ? salaryBreakup : parseSalaryPrompt(offerLetterForm.salaryPrompt)
  , [salaryBreakup, offerLetterForm.salaryPrompt])

  const salaryBreakupTable = useMemo(
    () => [
      { label: 'Basic Salary', value: `${formatRupees(parsedOfferSalary.basicAnnual / 12)}/mo` },
      { label: 'HRA', value: `${formatRupees(parsedOfferSalary.hraAnnual / 12)}/mo` },
      { label: 'PF — Employer', value: parsedOfferSalary.pfAnnual > 0 ? `${formatRupees(parsedOfferSalary.pfAnnual / 12)}/mo` : 'N/A/mo' },
      { label: 'Special Allowance', value: `${formatRupees(parsedOfferSalary.specialAllowanceAnnual / 12)}/mo` },
      { label: 'Gross Monthly', value: `${formatRupees(parsedOfferSalary.grossMonthly)}/mo` },
      { label: 'Variable Pay (Annual)', value: `${formatRupees(parsedOfferSalary.variableAnnual)}` },
      { label: 'Total CTC (Annual)', value: `${formatRupees(parsedOfferSalary.ctcAnnual)}`, highlight: true },
    ],
    [parsedOfferSalary],
  )

  const preOfferCtcRange =
    preOfferForm.ctcRangeOption === 'Other' ? preOfferForm.ctcRangeCustom || 'Other' : preOfferForm.ctcRangeOption
  const preOfferStipend =
    preOfferForm.fixedStipendOption === 'Other' ? preOfferForm.fixedStipendCustom || 'Other' : preOfferForm.fixedStipendOption
  const preOfferIncentive =
    preOfferForm.incentiveOption === 'Other' ? preOfferForm.incentiveCustom || 'Other' : preOfferForm.incentiveOption
  const preOfferIncentiveLabel = preOfferIncentive === 'None' ? 'Not applicable' : `Up to ${preOfferIncentive} / month`

  const preOfferTrainingPeriod = useMemo(() => {
    if (!preOfferForm.includeTraining || !preOfferForm.joiningDate) return null
    const days = parseInt(preOfferForm.trainingDuration, 10)
    const startDate = new Date(preOfferForm.joiningDate)
    if (Number.isNaN(days) || days <= 0) return null
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + days)
    return `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (${days} day${days === 1 ? '' : 's'})`
  }, [preOfferForm.includeTraining, preOfferForm.joiningDate, preOfferForm.trainingDuration])

  const internshipDuration = useMemo(
    () => formatDuration(internshipForm.startDate, internshipForm.endDate),
    [internshipForm.startDate, internshipForm.endDate],
  )

  async function handleCalculateSalaryBreakup() {
    setSalaryLoading(true)
    setSalaryError(null)
    try {
      const result = await calculateSalaryBreakup({ prompt: offerLetterForm.salaryPrompt })
      setSalaryBreakup(result)
      setSalaryBreakupVisible(true)
    } catch (error) {
      setSalaryError(error instanceof Error ? error.message : 'Failed to calculate salary')
    } finally {
      setSalaryLoading(false)
    }
  }

  async function handleGeneratePreOffer() {
    if (!preOfferForm.candidateName.trim()) {
      setPreOfferError('Please enter candidate name')
      return
    }
    if (!preOfferForm.role.trim()) {
      setPreOfferError('Please select a role')
      return
    }
    if (!preOfferForm.joiningDate) {
      setPreOfferError('Please set joining date')
      return
    }

    setPreOfferLoading(true)
    setPreOfferError(null)
    try {
      const result = await generatePreOffer({
        candidate_name: preOfferForm.candidateName.trim(),
        salutation: preOfferForm.salutation,
        role: preOfferForm.role.trim(),
        joining_date: preOfferForm.joiningDate,
        letter_date: preOfferForm.letterDate,
        stipend: preOfferStipend,
        incentive: preOfferIncentive === 'None' ? '' : preOfferIncentive,
        ctc_range: preOfferCtcRange,
        training_period: preOfferForm.includeTraining ? preOfferForm.trainingDuration : undefined,
        probation_start: preOfferForm.includeProbation ? preOfferForm.joiningDate : undefined,
        probation_dur: preOfferForm.probationDuration,
        has_probation: preOfferForm.includeProbation,
      })
      setPreOfferResult(result)
      await loadHistory()
    } catch (error) {
      setPreOfferError(error instanceof Error ? error.message : 'Failed to generate pre-offer letter')
    } finally {
      setPreOfferLoading(false)
    }
  }

  async function handleGenerateOfferLetter() {
    if (!offerLetterForm.candidateName.trim()) {
      setOfferLetterError('Please enter candidate name')
      return
    }
    if (!offerLetterForm.role.trim()) {
      setOfferLetterError('Please select a role')
      return
    }
    if (!offerLetterForm.joiningDate) {
      setOfferLetterError('Please set joining date')
      return
    }
    if (!salaryBreakup) {
      setOfferLetterError('Please calculate salary breakup first')
      return
    }

    setOfferLetterLoading(true)
    setOfferLetterError(null)
    try {
      const result = await generateOfferLetter({
        candidate_name: offerLetterForm.candidateName.trim(),
        salutation: offerLetterForm.salutation,
        role: offerLetterForm.role.trim(),
        department: offerLetterForm.department,
        joining_date: offerLetterForm.joiningDate,
        letter_date: offerLetterForm.letterDate,
        salary_data: salaryBreakup,
      })
      setOfferLetterResult(result)
      await loadHistory()
    } catch (error) {
      setOfferLetterError(error instanceof Error ? error.message : 'Failed to generate offer letter')
    } finally {
      setOfferLetterLoading(false)
    }
  }

  async function handleGenerateInternship() {
    if (!internshipForm.internName.trim()) {
      setInternshipError('Please enter intern name')
      return
    }
    if (!internshipForm.role.trim()) {
      setInternshipError('Please select a role')
      return
    }
    if (!internshipForm.startDate || !internshipForm.endDate) {
      setInternshipError('Please set start and end dates')
      return
    }

    setInternshipLoading(true)
    setInternshipError(null)
    try {
      const responsibilities = internshipForm.responsibilities
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const result = await generateInternship({
        intern_name: internshipForm.internName.trim(),
        salutation: internshipForm.salutation,
        reg_no: internshipForm.registrationNumber,
        college: internshipForm.institution,
        department: internshipForm.department,
        role: internshipForm.role.trim(),
        start_date: internshipForm.startDate,
        end_date: internshipForm.endDate,
        duration: internshipDuration,
        responsibilities: responsibilities,
        letter_date: internshipForm.letterDate,
      })
      setInternshipResult(result)
      await loadHistory()
    } catch (error) {
      setInternshipError(error instanceof Error ? error.message : 'Failed to generate internship certificate')
    } finally {
      setInternshipLoading(false)
    }
  }

  async function handleDownload(type: 'pdf' | 'docx', jobId: string, label: string) {
    setDownloadLoading(`${type}-${jobId}`)
    try {
      if (type === 'pdf') {
        await downloadPdf(jobId, label)
      } else {
        await downloadDocx(jobId, label)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Download failed'
      alert(`${errorMsg}`)
    } finally {
      setDownloadLoading(null)
    }
  }

  async function clearHistory() {
    if (!window.confirm('Are you sure you want to clear all history?')) {
      return
    }
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      await clearHistoryApi()
      setHistoryItems([])
      setExpandedHistory(null)
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Failed to clear history')
    } finally {
      setHistoryLoading(false)
    }
  }

  function toggleHistory(id: number) {
    setExpandedHistory((current) => (current === id ? null : id))
  }

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-[13px] font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl leading-none">📝</span>
            <h1 className="text-[2.25rem] font-bold text-[#0F172A] leading-tight">
              Offer Letter Generator
            </h1>
          </div>
          <p className="text-[#64748B] text-[15px] max-w-3xl">
            Convert HR workflows into polished offer letters, internship certificates, and downloadable employee communications — all within the Analytics Avenue ecosystem.
          </p>
        </div>

        <div className="border-b-2 border-[#E2E8F0] mb-10">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'pre-offer', label: 'Pre-Offer Letter' },
                { id: 'offer-letter', label: 'Offer Letter' },
                { id: 'internship-certificate', label: 'Internship Certificate' },
                { id: 'history', label: 'History' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#1a3c6e] font-semibold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[3px] rounded-t bg-[#E85D04]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'pre-offer' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8">
            <div className="space-y-6">
              <SectionHeader
                title="Pre-Offer Letter"
                description="Generate a pre-offer letter with probation terms and compensation details."
              />

              <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Full name</label>
                    <input
                      type="text"
                      value={preOfferForm.candidateName}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, candidateName: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      placeholder="Enter candidate full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Salutation</label>
                    <select
                      value={preOfferForm.salutation}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, salutation: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {SALUTATIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Role / Designation</label>
                    <select
                      value={preOfferForm.role}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, role: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {PRE_OFFER_ROLES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#334155] mb-2">Joining date</label>
                      <input
                        type="date"
                        value={preOfferForm.joiningDate}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, joiningDate: e.target.value }))}
                        className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#334155] mb-2">Letter date</label>
                      <input
                        type="date"
                        value={preOfferForm.letterDate}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, letterDate: e.target.value }))}
                        className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="rounded-2xl border border-[#E2E8F0] p-5 bg-[#F8FAFC]">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        id="training-checkbox"
                        type="checkbox"
                        checked={preOfferForm.includeTraining}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, includeTraining: e.target.checked }))}
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <label htmlFor="training-checkbox" className="text-[14px] font-semibold text-[#0F172A]">
                        Include Training Period
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <label className="inline-flex items-center gap-2 text-[13px] text-[#475569]">
                        <input
                          type="radio"
                          name="training-mode"
                          checked={preOfferForm.trainingMode === 'preset'}
                          onChange={() => setPreOfferForm((s) => ({ ...s, trainingMode: 'preset' }))}
                          className="h-4 w-4 text-[#0F766E]"
                        />
                        Preset Duration
                      </label>
                      <label className="inline-flex items-center gap-2 text-[13px] text-[#475569]">
                        <input
                          type="radio"
                          name="training-mode"
                          checked={preOfferForm.trainingMode === 'manual'}
                          onChange={() => setPreOfferForm((s) => ({ ...s, trainingMode: 'manual' }))}
                          className="h-4 w-4 text-[#0F766E]"
                        />
                        Enter Manually
                      </label>
                    </div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Training duration</label>
                    <select
                      value={preOfferForm.trainingDuration}
                      disabled={!preOfferForm.includeTraining}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, trainingDuration: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition disabled:bg-[#F8FAFC]"
                    >
                      <option>15 days</option>
                      <option>1 month</option>
                      <option>2 months</option>
                      <option>3 months</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-[#E2E8F0] p-5 bg-[#F8FAFC]">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        id="probation-checkbox"
                        type="checkbox"
                        checked={preOfferForm.includeProbation}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, includeProbation: e.target.checked }))}
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <label htmlFor="probation-checkbox" className="text-[14px] font-semibold text-[#0F172A]">
                        Include Probation Period
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <label className="inline-flex items-center gap-2 text-[13px] text-[#475569]">
                        <input
                          type="radio"
                          name="probation-mode"
                          checked={preOfferForm.probationMode === 'preset'}
                          onChange={() => setPreOfferForm((s) => ({ ...s, probationMode: 'preset' }))}
                          className="h-4 w-4 text-[#0F766E]"
                        />
                        Preset Duration
                      </label>
                      <label className="inline-flex items-center gap-2 text-[13px] text-[#475569]">
                        <input
                          type="radio"
                          name="probation-mode"
                          checked={preOfferForm.probationMode === 'manual'}
                          onChange={() => setPreOfferForm((s) => ({ ...s, probationMode: 'manual' }))}
                          className="h-4 w-4 text-[#0F766E]"
                        />
                        Enter Manually
                      </label>
                    </div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Probation duration</label>
                    <select
                      value={preOfferForm.probationDuration}
                      disabled={!preOfferForm.includeProbation}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, probationDuration: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition disabled:bg-[#F8FAFC]"
                    >
                      <option>2-4 months</option>
                      <option>3-6 months</option>
                      <option>4-6 months</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">CTC range (post confirmation)</label>
                    <select
                      value={preOfferForm.ctcRangeOption}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, ctcRangeOption: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {CTC_RANGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {preOfferForm.ctcRangeOption === 'Other' && (
                      <input
                        type="text"
                        value={preOfferForm.ctcRangeCustom}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, ctcRangeCustom: e.target.value }))}
                        placeholder="Enter custom range"
                        className="mt-3 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Fixed stipend / base pay</label>
                    <select
                      value={preOfferForm.fixedStipendOption}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, fixedStipendOption: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {STIPEND_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {preOfferForm.fixedStipendOption === 'Other' && (
                      <input
                        type="text"
                        value={preOfferForm.fixedStipendCustom}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, fixedStipendCustom: e.target.value }))}
                        placeholder="Enter amount"
                        className="mt-3 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Performance incentive</label>
                    <select
                      value={preOfferForm.incentiveOption}
                      onChange={(e) => setPreOfferForm((s) => ({ ...s, incentiveOption: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {INCENTIVE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {preOfferForm.incentiveOption === 'Other' && (
                      <input
                        type="text"
                        value={preOfferForm.incentiveCustom}
                        onChange={(e) => setPreOfferForm((s) => ({ ...s, incentiveCustom: e.target.value }))}
                        placeholder="Enter amount"
                        className="mt-3 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff] text-[#0F766E] shadow-sm">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Preview & Generate</p>
                    <p className="text-[13px] text-[#64748B]">Confirm the pre-offer letter details before generating the final document.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#CBD5E1] bg-white p-5 text-[14px] text-[#334155] min-h-[320px]">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                      <span className="text-[#64748B]">Candidate</span>
                      <span className="font-semibold text-[#1E293B]">{preOfferForm.candidateName || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                      <span className="text-[#64748B]">Role</span>
                      <span className="font-semibold text-[#1E293B]">{preOfferForm.role}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                      <span className="text-[#64748B]">Joining</span>
                      <span className="font-semibold text-[#1E293B]">{preOfferForm.joiningDate ? new Date(preOfferForm.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                    </div>
                    {preOfferForm.includeTraining && preOfferTrainingPeriod && (
                      <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                        <span className="text-[#64748B]">Training</span>
                        <span className="font-semibold text-[#1E293B]">{preOfferTrainingPeriod}</span>
                      </div>
                    )}
                    {preOfferForm.includeProbation && (
                      <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                        <span className="text-[#64748B]">Probation Starts</span>
                        <span className="font-semibold text-[#1E293B]">{preOfferForm.joiningDate ? new Date(preOfferForm.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                      <span className="text-[#64748B]">Stipend</span>
                      <span className="font-semibold text-[#1E293B]">{preOfferStipend} / month</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E2E8F0] pb-3">
                      <span className="text-[#64748B]">Incentive</span>
                      <span className="font-semibold text-[#1E293B]">{preOfferIncentiveLabel}</span>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span className="text-[#64748B]">CTC range</span>
                      <span className="font-semibold text-[#1E293B]">{preOfferCtcRange.replace('–', 'to')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePreOffer}
                    disabled={preOfferLoading}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-white font-semibold transition hover:bg-[#0D5F58] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {preOfferLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate Pre-Offer Letter
                      </>
                    )}
                  </button>

                  {preOfferError && (
                    <div className="mt-5 rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{preOfferError}</div>
                    </div>
                  )}

                  {preOfferResult && (
                    <>
                      <div className="mt-5 rounded-2xl border border-[#D1E7DD] bg-[#ECFDF5] px-4 py-3 text-sm text-[#166534]">
                        Pre-offer letter generated successfully!
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownload('pdf', preOfferResult.job_id, 'pre-offer')}
                          disabled={downloadLoading === `pdf-${preOfferResult.job_id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15803D] px-5 py-3 text-white font-semibold transition hover:bg-[#13673D] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadLoading === `pdf-${preOfferResult.job_id}` ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" /> Download PDF
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload('docx', preOfferResult.job_id, 'pre-offer')}
                          disabled={downloadLoading === `docx-${preOfferResult.job_id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-white font-semibold transition hover:bg-[#14532d] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadLoading === `docx-${preOfferResult.job_id}` ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" /> Download DOCX
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'offer-letter' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8">
            <div className="space-y-6">
              <SectionHeader
                title="Offer Letter"
                description="Draft a final offer letter with full salary breakup, compensation summary, and role details for HR automation hires."
              />

              <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Full name</label>
                    <input
                      type="text"
                      value={offerLetterForm.candidateName}
                      onChange={(e) => setOfferLetterForm((s) => ({ ...s, candidateName: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                      placeholder="Enter candidate full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Salutation</label>
                    <select
                      value={offerLetterForm.salutation}
                      onChange={(e) => setOfferLetterForm((s) => ({ ...s, salutation: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      <option value="Ms.">Ms.</option>
                      <option value="Mr.">Mr.</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Designation</label>
                    <select
                      value={offerLetterForm.role}
                      onChange={(e) => setOfferLetterForm((s) => ({ ...s, role: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {OFFER_ROLES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Department</label>
                    <select
                      value={offerLetterForm.department}
                      onChange={(e) => setOfferLetterForm((s) => ({ ...s, department: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {OFFER_DEPARTMENTS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Joining date</label>
                    <input
                      type="date"
                      value={offerLetterForm.joiningDate}
                      onChange={(e) => setOfferLetterForm((s) => ({ ...s, joiningDate: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Letter date</label>
                    <input
                      type="date"
                      value={offerLetterForm.letterDate}
                      onChange={(e) => setOfferLetterForm((s) => ({ ...s, letterDate: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white shadow-sm">
                <div className="mb-5">
                  <label className="block text-[13px] font-semibold text-[#334155] mb-2">Salary prompt</label>
                  <textarea
                    value={offerLetterForm.salaryPrompt}
                    onChange={(e) => setOfferLetterForm((s) => ({ ...s, salaryPrompt: e.target.value }))}
                    rows={5}
                    placeholder={'e.g. "6 LPA, 40% basic, no PF, 10% variable"\n"5 LPA, basic 4 LPA, PF 12% on 70% CTC"'}
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition resize-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCalculateSalaryBreakup}
                    disabled={salaryLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] text-white rounded-xl font-semibold transition hover:bg-[#0D5F58] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {salaryLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Calculate Salary Breakup
                      </>
                    )}
                  </button>
                </div>

                {salaryError && (
                  <div className="mt-4 rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>{salaryError}</div>
                  </div>
                )}

                {salaryBreakupVisible && (
                  <>
                    <div className="mt-6 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                      <p className="text-[13px] leading-relaxed text-[#0F172A]">
                        <span className="font-semibold">CTC:</span> {formatRupees(parsedOfferSalary.ctcAnnual)}
                        <span className="mx-2 text-[#64748B]">|</span>
                        <span className="font-semibold">Basic:</span> {parsedOfferSalary.basicPercent.toFixed(1)}% of CTC
                        <span className="mx-2 text-[#64748B]">|</span>
                        <span className="font-semibold">HRA:</span> {parsedOfferSalary.hraPercentOfBasic.toFixed(1)}% of Basic
                        <span className="mx-2 text-[#64748B]">|</span>
                        <span className="font-semibold">PF:</span> {parsedOfferSalary.pfDescription}
                        <span className="mx-2 text-[#64748B]">|</span>
                        <span className="font-semibold">Variable:</span> {parsedOfferSalary.variablePercent.toFixed(1)}% of CTC
                      </p>
                    </div>
                    <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white shadow-sm mt-6">
                      <h3 className="text-lg font-bold text-[#0F172A] mb-4">Salary breakup</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-[14px] text-[#334155]">
                          <tbody className="divide-y divide-[#E2E8F0]">
                            {salaryBreakupTable.map((row) => (
                              <tr key={row.label} className={row.highlight ? 'bg-[#ECFDF5]' : ''}>
                                <td className="py-4 font-semibold text-[#0F172A]">{row.label}</td>
                                <td className="py-4 text-[#134E4A]">{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-6">
                  <button
                    type="button"
                    onClick={handleGenerateOfferLetter}
                    disabled={offerLetterLoading || !salaryBreakup}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] text-white rounded-xl font-semibold transition hover:bg-[#0D5F58] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {offerLetterLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FilePlus className="w-4 h-4" />
                        Generate Offer Letter
                      </>
                    )}
                  </button>
                </div>

                {offerLetterError && (
                  <div className="mt-4 rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>{offerLetterError}</div>
                  </div>
                )}

                {offerLetterResult && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload('pdf', offerLetterResult.job_id, 'offer-letter')}
                      disabled={downloadLoading === `pdf-${offerLetterResult.job_id}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#15803D] hover:bg-[#13673D] text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadLoading === `pdf-${offerLetterResult.job_id}` ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> PDF
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('docx', offerLetterResult.job_id, 'offer-letter')}
                      disabled={downloadLoading === `docx-${offerLetterResult.job_id}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#166534] hover:bg-[#14532d] text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadLoading === `docx-${offerLetterResult.job_id}` ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> DOCX
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'internship-certificate' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8">
            <div className="space-y-6">
              <SectionHeader
                title="Internship Certificate"
                description="Issue internship certificates with start/end dates, duration summaries, and role responsibilities in a crisp professional layout."
              />

              <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white shadow-sm">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Intern details</p>
                  <p className="mt-2 text-[14px] text-[#64748B]">Enter intern information for the certificate draft.</p>
                </div>
                <div className="mb-5">
                  <label className="block text-[13px] font-semibold text-[#334155] mb-2">Full name</label>
                  <input
                    type="text"
                    value={internshipForm.internName}
                    onChange={(e) => setInternshipForm((s) => ({ ...s, internName: e.target.value }))}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Salutation</label>
                    <select
                      value={internshipForm.salutation}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, salutation: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {SALUTATIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Registration number</label>
                    <input
                      type="text"
                      value={internshipForm.registrationNumber}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, registrationNumber: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">College / Institution</label>
                    <input
                      type="text"
                      value={internshipForm.institution}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, institution: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Department</label>
                    <select
                      value={internshipForm.department}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, department: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {INTERNSHIP_DEPARTMENTS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-6">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Role</label>
                    <select
                      value={internshipForm.role}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, role: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    >
                      {INTERNSHIP_ROLES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0284C7] shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Internship period</p>
                    <p className="text-[13px] text-[#64748B]">Set the certificate dates and verify duration.</p>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[13px] font-semibold text-[#334155] mb-2">Date entry mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInternshipForm((s) => ({ ...s, datesMode: 'manual' }))}
                      className={`rounded-xl border px-4 py-3 text-[14px] font-semibold transition ${
                        internshipForm.datesMode === 'manual'
                          ? 'border-[#0F766E] bg-[#ECFDF5] text-[#0F766E]'
                          : 'border-[#CBD5E1] bg-white text-[#475569]'
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternshipForm((s) => ({ ...s, datesMode: 'auto' }))}
                      className={`rounded-xl border px-4 py-3 text-[14px] font-semibold transition ${
                        internshipForm.datesMode === 'auto'
                          ? 'border-[#0F766E] bg-[#ECFDF5] text-[#0F766E]'
                          : 'border-[#CBD5E1] bg-white text-[#475569]'
                      }`}
                    >
                      Auto (start + duration)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">Start date</label>
                    <input
                      type="date"
                      value={internshipForm.startDate}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#334155] mb-2">End date</label>
                    <input
                      type="date"
                      value={internshipForm.endDate}
                      onChange={(e) => setInternshipForm((s) => ({ ...s, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <div className="inline-flex items-center rounded-full bg-[#EEF2FF] px-4 py-2 text-[13px] font-semibold text-[#4338CA]">
                    Duration: {internshipDuration}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[13px] font-semibold text-[#334155] mb-2">Letter date</label>
                  <input
                    type="date"
                    value={internshipForm.letterDate}
                    onChange={(e) => setInternshipForm((s) => ({ ...s, letterDate: e.target.value }))}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition"
                  />
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[#334155]">Type responsibilities</p>
                      <p className="text-[12px] text-[#64748B]">Auto-filled from role — editable. Spelling & grammar auto-fixed, minimum 5 points ensured.</p>
                    </div>
                  </div>
                  <textarea
                    value={internshipForm.responsibilities}
                    onChange={(e) => setInternshipForm((s) => ({ ...s, responsibilities: e.target.value }))}
                    rows={6}
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition resize-none"
                  />
                </div>

                <div className="mb-5 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <p className="text-[13px] font-semibold text-[#0F172A] mb-3">Review & edit (auto-corrected)</p>
                  <textarea
                    value={internshipForm.reviewNotes}
                    onChange={(e) => setInternshipForm((s) => ({ ...s, reviewNotes: e.target.value }))}
                    rows={4}
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 transition resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateInternship}
                    disabled={internshipLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0F766E] text-white rounded-xl font-semibold transition hover:bg-[#0D5F58] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {internshipLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Generate Internship Certificate
                      </>
                    )}
                  </button>

                  {internshipError && (
                    <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{internshipError}</div>
                    </div>
                  )}

                  {internshipResult && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownload('pdf', internshipResult.job_id, 'internship-certificate')}
                        disabled={downloadLoading === `pdf-${internshipResult.job_id}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#15803D] hover:bg-[#13673D] text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadLoading === `pdf-${internshipResult.job_id}` ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" /> PDF
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload('docx', internshipResult.job_id, 'internship-certificate')}
                        disabled={downloadLoading === `docx-${internshipResult.job_id}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#166534] hover:bg-[#14532d] text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadLoading === `docx-${internshipResult.job_id}` ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" /> DOCX
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <SectionHeader
              title="History"
              description="Track generated HR documents, review recent activity, and clear history entries when needed."
            />
            <div className="border border-[#E2E8F0] rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Recent document activity</p>
                  <p className="text-[14px] text-[#64748B]">Review the last generated offers, pre-offers and certificates.</p>
                </div>
                <button
                  type="button"
                  onClick={clearHistory}
                  disabled={historyLoading || historyItems.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFC] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <History className="w-4 h-4" /> Clear history
                </button>
              </div>

              {historyError && (
                <div className="mb-6 rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{historyError}</div>
                </div>
              )}

              {historyLoading && !historyItems.length ? (
                <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-sm text-[#475569]">
                  <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading history...
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-sm text-[#475569]">
                      No history entries available. Generate a document to populate the history list.
                    </div>
                  ) : (
                    historyItems.map((item, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleHistory(idx)}
                          className="w-full flex items-center justify-between gap-4 p-5 bg-white hover:bg-[#F8FAFC] transition"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">{item.document_type || 'Document'}</p>
                            <p className="text-[13px] text-[#64748B]">{item.candidate_name || item.intern_name || 'Unknown'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] text-[#64748B]">{item.created_at || 'N/A'}</p>
                            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E]">
                              {expandedHistory === idx ? 'Hide details' : 'View details'}
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedHistory === idx ? 'rotate-180' : ''}`} />
                            </span>
                          </div>
                        </button>
                        {expandedHistory === idx && (
                          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-5 text-[14px] text-[#475569]">
                            <div className="space-y-2">
                              {Object.entries(item).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-[#64748B]">{key}:</span>
                                  <span className="font-semibold text-[#1E293B]">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
