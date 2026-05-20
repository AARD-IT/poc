/**
 * Offer Letter Generator API Service
 * Uses VITE_OFFERLETTER_API_URL for deployed backend routing.
 */

const API_BASE_URL =
  import.meta.env.VITE_OFFERLETTER_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface PreOfferRequest {
  candidate_name: string
  salutation: string
  role: string
  joining_date: string
  letter_date?: string
  stipend?: string
  incentive?: string
  ctc_range?: string
  training_period?: string
  probation_start?: string
  probation_dur?: string
  has_probation?: boolean
  custom_rr?: string[]
}

export interface SalaryParseRequest {
  prompt: string
}

export interface SalaryParseResponse {
  ctc_annual: number
  basic_annual: number
  hra_annual: number
  pf_annual: number
  variable_annual: number
  special_allowance_annual: number
  gross_monthly: number
  hra_percent_of_basic: number
  basic_percent: number
  hra_percent: number
  pf_percent: number
  variable_percent: number
  pf_description: string
  ctcAnnual: number
  basicAnnual: number
  hraAnnual: number
  pfAnnual: number
  variableAnnual: number
  specialAllowanceAnnual: number
  grossMonthly: number
  hraPercentOfBasic: number
  basicPercent: number
  hraPercent: number
  pfPercent: number
  variablePercent: number
  ctcAnnualStr?: string
  basicMonthlyStr?: string
  hraMonthlyStr?: string
  pfMonthlyStr?: string
  specialAllowanceMonthlyStr?: string
  variableAnnualStr?: string
  grossMonthlyStr?: string
  ctcLpa?: string
  pfOpted?: boolean
  [key: string]: any
}

function normalizeSalaryParseResponse(response: any): SalaryParseResponse {
  return {
    ...response,
    ctcAnnual: response.ctc_annual ?? response.ctcAnnual ?? 0,
    basicAnnual: response.basic_annual ?? response.basicAnnual ?? 0,
    hraAnnual: response.hra_annual ?? response.hraAnnual ?? 0,
    pfAnnual: response.pf_annual ?? response.pfAnnual ?? 0,
    variableAnnual: response.variable_annual ?? response.variableAnnual ?? 0,
    specialAllowanceAnnual: response.special_allowance_annual ?? response.specialAllowanceAnnual ?? 0,
    grossMonthly: response.gross_monthly ?? response.grossMonthly ?? 0,
    basicPercent: response.base_percent ?? response.basic_percent ?? response.basicPercent ?? 0,
    hraPercent: response.hra_percent ?? response.hraPercent ?? 0,
    hraPercentOfBasic: response.hra_percent ?? response.hraPercent ?? response.hraPercentOfBasic ?? 0,
    pfPercent: response.pf_percent ?? response.pfPercent ?? 0,
    variablePercent: response.variable_percent ?? response.variablePercent ?? 0,
    base_percent: response.base_percent ?? response.basic_percent ?? response.basicPercent ?? 0,
    hra_percent: response.hra_percent ?? response.hraPercent ?? response.hraPercentOfBasic ?? 0,
    pf_percent: response.pf_percent ?? response.pfPercent ?? 0,
    variable_percent: response.variable_percent ?? response.variablePercent ?? 0,
    pfDescription: response.pf_description ?? response.pfDescription ?? 'Not applicable',
    ctcAnnualStr: response.ctc_annual_str ?? response.ctcAnnualStr ?? '',
    basicMonthlyStr: response.basic_monthly_str ?? response.basicMonthlyStr ?? '',
    hraMonthlyStr: response.hra_monthly_str ?? response.hraMonthlyStr ?? '',
    pfMonthlyStr: response.pf_monthly_str ?? response.pfMonthlyStr ?? '',
    specialAllowanceMonthlyStr: response.special_allowance_monthly_str ?? response.specialAllowanceMonthlyStr ?? '',
    variableAnnualStr: response.variable_annual_str ?? response.variableAnnualStr ?? '',
    grossMonthlyStr: response.gross_monthly_str ?? response.grossMonthlyStr ?? '',
    ctcLpa: response.ctc_lpa ?? response.ctcLpa ?? '',
    pfOpted: response.pf_opted ?? response.pfOpted ?? false,
  }
}

export interface OfferLetterRequest {
  candidate_name: string
  salutation: string
  role: string
  department: string
  joining_date: string
  letter_date?: string
  salary_data: SalaryParseResponse
  custom_rr?: string[]
}

export interface InternshipRequest {
  intern_name: string
  salutation: string
  reg_no?: string
  college?: string
  department?: string
  role: string
  start_date: string
  end_date: string
  duration?: string
  responsibilities?: string[]
  letter_date?: string
}

export interface DocumentResponse {
  job_id: string
  filename: string
  docx_path: string
  pdf_path: string
  success: boolean
}

export interface HistoryItem {
  [key: string]: any
}

export interface HistoryResponse {
  history: HistoryItem[]
  count: number
}

// ==========================================
// PRE-OFFER LETTER
// ==========================================

export async function generatePreOffer(data: PreOfferRequest): Promise<DocumentResponse> {
  const response = await fetch(`${API_BASE_URL}/pre-offer/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate pre-offer letter')
  }

  return response.json()
}

// ==========================================
// SALARY CALCULATION
// ==========================================

export async function calculateSalaryBreakup(data: SalaryParseRequest): Promise<SalaryParseResponse> {
  const response = await fetch(`${API_BASE_URL}/offer-letter/calculate-salary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to calculate salary')
  }

  const json = await response.json()
  return normalizeSalaryParseResponse(json)
}

// ==========================================
// OFFER LETTER
// ==========================================

export async function generateOfferLetter(data: OfferLetterRequest): Promise<DocumentResponse> {
  const response = await fetch(`${API_BASE_URL}/offer-letter/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate offer letter')
  }

  return response.json()
}

// ==========================================
// INTERNSHIP CERTIFICATE
// ==========================================

export async function generateInternship(data: InternshipRequest): Promise<DocumentResponse> {
  const response = await fetch(`${API_BASE_URL}/internship/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate internship certificate')
  }

  return response.json()
}

// ==========================================
// HISTORY
// ==========================================

export async function getHistory(): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch history')
  }

  return response.json()
}

export async function clearHistory(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to clear history')
  }

  return response.json()
}

// ==========================================
// DOWNLOAD FILES
// ==========================================

export async function downloadPdf(jobId: string, filename: string): Promise<void> {
  const url = `${API_BASE_URL}/download/pdf/${jobId}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to download PDF')
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

export async function downloadDocx(jobId: string, filename: string): Promise<void> {
  const url = `${API_BASE_URL}/download/docx/${jobId}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to download DOCX')
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

// ==========================================
// ROLES & RESPONSIBILITIES
// ==========================================

export async function getRoleResponsibilities(role: string): Promise<{ role: string; responsibilities: string[] }> {
  const response = await fetch(`${API_BASE_URL}/roles/${encodeURIComponent(role)}/responsibilities`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch responsibilities')
  }

  return response.json()
}
