const API_BASE_URL =
  import.meta.env.VITE_REAL_ESTATE_INTELLIGENCE_SUITE_API_URL ||
  import.meta.env.VITE_REALESTATE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000'

export interface RealEstateDatasetResponse {
  total_rows: number
  columns: string[]
  cities: string[]
  property_types: string[]
  area_min: number
  area_max: number
  preview: Record<string, any>[]
  data: Record<string, any>[]
  warning?: string | null
}

export interface FilterResponse {
  total_rows: number
  kpis: Record<string, number>
  preview: Record<string, any>[]
  data: Record<string, any>[]
}

export interface ChartDataResponse {
  price_histogram: Array<{ bin_start: number; bin_end: number; count: number }>
  city_avg_price: Array<Record<string, any>>
  price_vs_area: Array<Record<string, any>>
}

export interface GetColumnsResponse {
  columns: string[]
  required_cols: string[]
  file_bytes_b64: string
}

export interface MlPredictResponse {
  rmse: number
  r2: number
  test_size: number
  train_size: number
  predictions: Record<string, any>[]
}

export interface InsightsResponse {
  insights: Record<string, any>[]
  total_groups: number
}

export interface AiNarrativeResponse {
  narrative: string | null
  error: string | null
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Request failed'
    throw new Error(message)
  }
  return response.json()
}

export async function loadDefaultDataset(): Promise<RealEstateDatasetResponse> {
  const response = await fetch(`${API_BASE_URL}/load-default`)
  return handleResponse(response)
}

export async function uploadCsv(file: File): Promise<RealEstateDatasetResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/upload-csv`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse(response)
}

export async function getCsvColumns(file: File): Promise<GetColumnsResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/get-columns`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse(response)
}

export async function applyColumnMapping(file: File, mapping: {
  city: string
  property_type: string
  area_sqft: string
  price: string
}): Promise<RealEstateDatasetResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const params = new URLSearchParams({
    city: mapping.city,
    property_type: mapping.property_type,
    area_sqft: mapping.area_sqft,
    price: mapping.price,
  })

  const response = await fetch(`${API_BASE_URL}/apply-mapping?${params.toString()}`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse(response)
}

export async function filterData(payload: {
  data: Record<string, any>[]
  cities?: string[]
  property_types?: string[]
  area_min?: number
  area_max?: number
}): Promise<FilterResponse> {
  const response = await fetch(`${API_BASE_URL}/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function getChartData(data: Record<string, any>[]): Promise<ChartDataResponse> {
  const response = await fetch(`${API_BASE_URL}/charts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  return handleResponse(response)
}

export async function runMlPrediction(data: Record<string, any>[]): Promise<MlPredictResponse> {
  const response = await fetch(`${API_BASE_URL}/ml-predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  return handleResponse(response)
}

export async function getInsights(data: Record<string, any>[]): Promise<InsightsResponse> {
  const response = await fetch(`${API_BASE_URL}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  return handleResponse(response)
}

export async function generateAiNarrative(data: Record<string, any>[], kpis: Record<string, any>, insights: Record<string, any>[]): Promise<AiNarrativeResponse> {
  const response = await fetch(`${API_BASE_URL}/ai-narrative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, kpis, insights }),
  })
  return handleResponse(response)
}

export async function downloadFilteredCsv(data: Record<string, any>[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/download-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Download failed'
    throw new Error(message)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'real_estate_data.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
