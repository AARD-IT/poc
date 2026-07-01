import axios from 'axios'
import type {
  WarehouseOperationsChartResponse,
  WarehouseOperationsClusterResponse,
  WarehouseOperationsDatasetResponse,
  WarehouseOperationsFilterResponse,
  WarehouseOperationsInsightsResponse,
  WarehouseOperationsMlResponse,
  WarehouseOperationsPlaybooksResponse,
  WarehouseOperationsRow,
} from '@/types/warehouseOperations'

const API_BASE_URL =
  import.meta.env.VITE_WAREHOUSE_OPERATIONS_API_URL ||
  'http://127.0.0.1:8013'

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

export async function loadDefaultDataset(): Promise<WarehouseOperationsDatasetResponse> {
  try {
    const response = await api.get('/load-default')
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function uploadCsv(file: File): Promise<WarehouseOperationsDatasetResponse> {
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

export async function getCsvColumns(file: File): Promise<{ columns: string[]; required_cols: string[] }> {
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
): Promise<WarehouseOperationsDatasetResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const backendFieldMap: Record<string, string> = {
    Order_ID: 'order_id',
    Warehouse: 'warehouse',
    Zone: 'zone',
    Aisle: 'aisle',
    Bin: 'bin_col', // Special mapping to bin_col in FastAPI
    Order_Timestamp: 'order_timestamp',
    Shift: 'shift',
    Picker_ID: 'picker_id',
    SKU: 'sku',
    SKU_Weight_KG: 'sku_weight_kg',
    SKU_Cube_M3: 'sku_cube_m3',
    SKU_Class: 'sku_class',
    Pick_Qty: 'pick_qty',
    Travel_Distance_M: 'travel_distance_m',
    Travel_Time_Sec: 'travel_time_sec',
    Pick_Time_Sec: 'pick_time_sec',
    Pack_Time_Sec: 'pack_time_sec',
    Heatmap_Level: 'heatmap_level',
    Slotting_Score: 'slotting_score',
    Equipment_Type: 'equipment_type',
    Picker_Productivity_Items_Hour: 'picker_productivity_items_hour',
    Congestion_Factor: 'congestion_factor',
    Delay_Reason: 'delay_reason',
    Delay_Minutes: 'delay_minutes',
  }

  Object.entries(mapping).forEach(([key, value]) => {
    if (!value) return
    formData.append(backendFieldMap[key] || key.toLowerCase(), value)
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
  data: WarehouseOperationsRow[]
  warehouses?: string[]
  shifts?: string[]
  picker_ids?: string[]
  date_start?: string
  date_end?: string
}): Promise<WarehouseOperationsFilterResponse> {
  try {
    const response = await api.post('/filter', payload)
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getChartData(data: WarehouseOperationsRow[]): Promise<WarehouseOperationsChartResponse> {
  try {
    const response = await api.post('/charts', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getClusters(data: WarehouseOperationsRow[], n_clusters = 4): Promise<WarehouseOperationsClusterResponse> {
  try {
    const response = await api.post('/ml/clustering', { data, n_clusters })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runPickTimePredictor(data: WarehouseOperationsRow[]): Promise<WarehouseOperationsMlResponse> {
  try {
    const response = await api.post('/ml/pick-time', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runDelayPredictor(data: WarehouseOperationsRow[]): Promise<WarehouseOperationsMlResponse> {
  try {
    const response = await api.post('/ml/delay-predictor', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function runProductivityPredictor(data: WarehouseOperationsRow[]): Promise<WarehouseOperationsMlResponse> {
  try {
    const response = await api.post('/ml/productivity-predictor', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getInsights(data: WarehouseOperationsRow[]): Promise<WarehouseOperationsInsightsResponse> {
  try {
    const response = await api.post('/insights', { data })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function getPlaybooks(): Promise<WarehouseOperationsPlaybooksResponse> {
  try {
    const response = await api.get('/playbooks')
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function downloadFilteredCsv(data: WarehouseOperationsRow[]): Promise<Blob> {
  try {
    const response = await api.post('/download-csv', { data }, { responseType: 'blob' })
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}
