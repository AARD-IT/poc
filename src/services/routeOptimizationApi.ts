import axios from 'axios'
import type {
  RouteOptimizationAnomalyResponse,
  RouteOptimizationChartResponse,
  RouteOptimizationClusterResponse,
  RouteOptimizationCostSimulationResponse,
  RouteOptimizationDatasetResponse,
  RouteOptimizationFilterResponse,
  RouteOptimizationInsightsResponse,
  RouteOptimizationMlResponse,
  RouteOptimizationPlaybooksResponse,
  RouteOptimizationRow,
} from '@/types/routeOptimization'

const API_BASE_URL =
  import.meta.env.VITE_ROUTE_OPTIMIZATION_API_URL ||
  'http://127.0.0.1:8011'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function normalizeError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail || error.response?.data?.message || error.message
    return new Error(detail || 'Request failed')
  }
  if (error instanceof Error) return error
  return new Error('Request failed')
}

export async function loadDefaultDataset(): Promise<RouteOptimizationDatasetResponse> {
  try {
    const response = await api.get('/load-default')
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function uploadCsv(file: File): Promise<RouteOptimizationDatasetResponse> {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(`${API_BASE_URL}/upload-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getCsvColumns(file: File): Promise<{ columns: string[]; expected_cols: string[] }> {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(`${API_BASE_URL}/get-columns`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function applyColumnMapping(
  file: File,
  mapping: Record<string, string>,
): Promise<RouteOptimizationDatasetResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const backendFieldMap: Record<string, string> = {
    Timestamp: 'timestamp',
    Vehicle_ID: 'vehicle_id',
    Vehicle_Type: 'vehicle_type',
    Route_ID: 'route_id',
    Start_City: 'start_city',
    End_City: 'end_city',
    Route_Distance_km: 'route_distance_km',
    Traffic_Level: 'traffic_level',
    Weather_Condition: 'weather_condition',
    Predicted_Travel_Hours: 'predicted_travel_hours',
    Actual_Travel_Hours: 'actual_travel_hours',
    Predicted_Fuel_Liters: 'predicted_fuel_liters',
    Actual_Fuel_Liters: 'actual_fuel_liters',
    Vehicle_Capacity_kg: 'vehicle_capacity_kg',
    Load_Weight_kg: 'load_weight_kg',
    Delay_Hours: 'delay_hours',
    Efficiency_Score: 'efficiency_score',
  }

  Object.entries(mapping).forEach(([key, value]) => {
    if (!value) return
    formData.append(backendFieldMap[key] ?? key.toLowerCase(), value)
  })

  try {
    const response = await axios.post(`${API_BASE_URL}/apply-mapping`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function filterData(payload: {
  data: RouteOptimizationRow[]
  vehicle_ids?: string[]
  vehicle_types?: string[]
  route_ids?: string[]
  date_start?: string
  date_end?: string
}): Promise<RouteOptimizationFilterResponse> {
  try {
    const response = await api.post('/filter', payload)
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getChartData(data: RouteOptimizationRow[]): Promise<RouteOptimizationChartResponse> {
  try {
    const response = await api.post('/charts', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getClusters(data: RouteOptimizationRow[], n_clusters = 4): Promise<RouteOptimizationClusterResponse> {
  try {
    const response = await api.post('/clusters', { data, n_clusters })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getCostSimulation(data: RouteOptimizationRow[]): Promise<RouteOptimizationCostSimulationResponse> {
  try {
    const response = await api.post('/cost-simulation', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runRandomForest(data: RouteOptimizationRow[]): Promise<RouteOptimizationMlResponse> {
  try {
    const response = await api.post('/ml/random-forest', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runGradientBoosting(data: RouteOptimizationRow[]): Promise<RouteOptimizationMlResponse> {
  try {
    const response = await api.post('/ml/gradient-boosting', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runKnn(data: RouteOptimizationRow[]): Promise<RouteOptimizationMlResponse> {
  try {
    const response = await api.post('/ml/knn', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runAnomalyDetection(data: RouteOptimizationRow[]): Promise<RouteOptimizationAnomalyResponse> {
  try {
    const response = await api.post('/ml/anomaly-detection', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getInsights(data: RouteOptimizationRow[]): Promise<RouteOptimizationInsightsResponse> {
  try {
    const response = await api.post('/insights', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getPlaybooks(data: RouteOptimizationRow[]): Promise<RouteOptimizationPlaybooksResponse> {
  try {
    const response = await api.post('/playbooks', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function downloadFilteredCsv(data: RouteOptimizationRow[]): Promise<Blob> {
  try {
    const response = await api.post('/download-csv', { data }, { responseType: 'blob' })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}
