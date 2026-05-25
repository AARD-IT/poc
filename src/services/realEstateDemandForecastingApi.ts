const API_BASE_URL =
  import.meta.env.VITE_REAL_ESTATE_DEMAND_FORECASTING_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'

export interface DemandForecastingDatasetResponse {
  total_rows: number
  columns: string[]
  cities: string[]
  property_types: string[]
  date_min?: string
  date_max?: string
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
  monthly_demand_trend: Array<{ Month: string; Demand: number }>
  demand_by_property_type: Array<{ Property_Type: string; Count: number }>
}

export interface ForecastResponse {
  historical_trend: Array<Record<string, any>>
  forecast: Array<{ Month: string; Forecast: number }>
  growth_percent: number
  months_used: number
  r2_score: number
}

export interface InsightsResponse {
  insights: Array<Record<string, any>>
  total_groups: number
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Request failed'
    throw new Error(message)
  }
  return response.json()
}

export async function loadDefaultDataset(): Promise<DemandForecastingDatasetResponse> {
  const response = await fetch(`${API_BASE_URL}/load-default`)
  return handleResponse(response)
}

export async function uploadCsv(file: File): Promise<DemandForecastingDatasetResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/upload-csv`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse(response)
}

export async function applyFilters(payload: {
  data: Record<string, any>[]
  cities?: string[]
  property_types?: string[]
  date_start?: string
  date_end?: string
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

export async function getForecast(data: Record<string, any>[]): Promise<ForecastResponse> {
  const response = await fetch(`${API_BASE_URL}/forecast`, {
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
