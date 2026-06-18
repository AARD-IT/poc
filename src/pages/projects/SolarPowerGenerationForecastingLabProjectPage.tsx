import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import Plot from 'react-plotly.js'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Download, FileUp, Loader2, Sparkles, SunMedium, CloudSun, Zap, Gauge } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'

const API_BASE_URL =
  import.meta.env.VITE_SOLAR_POWER_GENERATION_FORECASTING_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8014'

const REQUIRED_FIELDS = [
  'timestamp',
  'solar_radiation_wm2',
  'diffuse_radiation_wm2',
  'direct_normal_irradiance_wm2',
  'temperature_c',
  'humidity_pct',
  'wind_speed_mps',
  'wind_direction_deg',
  'cloud_cover_pct',
  'pressure_hpa',
  'dew_point_c',
  'forecast_generation_kwh',
  'actual_generation_kwh',
  'generation_error_kwh',
  'plant_id',
  'inverter_cluster_id',
  'weather_condition',
  'sunrise_time',
  'sunset_time',
  'day_of_year',
  'clearness_index',
  'panel_tilt_deg',
  'panel_azimuth_deg',
  'is_holiday_flag',
]

const FIELD_LABELS: Record<string, string> = {
  timestamp: 'Timestamp reading',
  solar_radiation_wm2: 'Global horizontal irradiance',
  diffuse_radiation_wm2: 'Diffuse irradiance',
  direct_normal_irradiance_wm2: 'DNI',
  temperature_c: 'Ambient temperature',
  humidity_pct: 'Humidity',
  wind_speed_mps: 'Wind speed',
  wind_direction_deg: 'Wind direction',
  cloud_cover_pct: 'Cloud cover',
  pressure_hpa: 'Atmospheric pressure',
  dew_point_c: 'Dew point',
  forecast_generation_kwh: 'Forecasted generation',
  actual_generation_kwh: 'Actual generation',
  generation_error_kwh: 'Forecast error',
  plant_id: 'Plant identifier',
  inverter_cluster_id: 'Cluster identifier',
  weather_condition: 'Weather category',
  sunrise_time: 'Sunrise',
  sunset_time: 'Sunset',
  day_of_year: 'Day index',
  clearness_index: 'Solar clarity index',
  panel_tilt_deg: 'Tilt angle',
  panel_azimuth_deg: 'Azimuth',
  is_holiday_flag: 'Holiday flag',
}

const DEFAULT_DATASET_COLUMNS = REQUIRED_FIELDS
const INSIGHT_COLUMNS = ['Insight', 'Entity', 'Metric', 'Action']

type DatasetMode = 'default' | 'upload' | 'mapping'
type Row = Record<string, unknown>
type Kpis = { total_actual_kwh: number; total_forecast_kwh: number; mae: number; rmse: number; mape_pct: number }
type InsightRow = { Insight: string; Entity: string; Metric: string; Action: string }

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Request failed'
    throw new Error(message)
  }
  return response.json()
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(4)
  return String(value)
}

function formatMetric(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

function buildCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return ''
    const text = String(value).replace(/"/g, '""')
    return /[",\n]/.test(text) ? `"${text}"` : text
  }
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\n')
}

function DataTable({ rows, maxRows = 10 }: { rows: Row[]; maxRows?: number }) {
  const displayRows = rows.slice(0, maxRows)
  const columns = Object.keys(displayRows[0] ?? {})

  if (!displayRows.length) {
    return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No rows to display.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column} className="bg-slate-50 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-600">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayRows.map((row, rowIndex) => (
          <TableRow key={rowIndex} className="border-slate-200">
            {columns.map((column) => (
              <TableCell key={`${rowIndex}-${column}`} className="max-w-[220px] whitespace-normal px-3 py-3 text-slate-700">
                {formatCell(row[column])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function MetricCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${accent}`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#0F172A]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function FilterSelector({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">{label}</p>
      <div className="mb-4 mt-3 min-h-[56px] rounded-[16px] border border-slate-200 bg-white px-4 py-3">
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-semibold text-[#0F766E]"
              >
                {option} ×
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">Choose one or more {label.toLowerCase()}</div>
        )}
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${selected.includes(option) ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SolarPowerGenerationForecastingLabProjectPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<DatasetMode>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [data, setData] = useState<Row[]>([])
  const [filteredData, setFilteredData] = useState<Row[]>([])
  const [defaultPreviewRows, setDefaultPreviewRows] = useState<Row[]>([])
  const [filteredPreviewRows, setFilteredPreviewRows] = useState<Row[]>([])
  const [plants, setPlants] = useState<string[]>([])
  const [clusters, setClusters] = useState<string[]>([])
  const [weatherConditions, setWeatherConditions] = useState<string[]>([])
  const [selectedPlants, setSelectedPlants] = useState<string[]>([])
  const [selectedClusters, setSelectedClusters] = useState<string[]>([])
  const [selectedWeatherConditions, setSelectedWeatherConditions] = useState<string[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [dateMin, setDateMin] = useState('')
  const [dateMax, setDateMax] = useState('')
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [charts, setCharts] = useState<any>({})
  const [mlResult, setMlResult] = useState<any>(null)
  const [insights, setInsights] = useState<InsightRow[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const defaultTableColumns = useMemo(() => Object.keys(defaultPreviewRows[0] ?? data[0] ?? {}), [defaultPreviewRows, data])
  const filteredTableColumns = useMemo(() => Object.keys(filteredPreviewRows[0] ?? filteredData[0] ?? data[0] ?? {}), [filteredPreviewRows, filteredData, data])
  const dataForTopTable = defaultPreviewRows.length ? defaultPreviewRows : data.slice(0, 10)

  const timeseries = charts.actual_vs_forecast_timeseries ?? []
  const scatter = charts.actual_vs_forecast_scatter ?? []
  const scatterRange = charts.scatter_axis_range ?? null
  const errorByWeather = charts.error_by_weather ?? []
  const clearness = charts.clearness_vs_generation ?? []

  useEffect(() => {
    void loadDefault()
  }, [])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlants, selectedClusters, selectedWeatherConditions, dateStart, dateEnd])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    setSelectedPlants([])
    setSelectedClusters([])
    setSelectedWeatherConditions([])
    setDateStart('')
    setDateEnd('')
    setUploadFile(null)
    setFileColumns([])
    setMapping({})

    try {
      const response = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      const rows = response.data ?? []
      setData(rows)
      setFilteredData(rows)
      setDefaultPreviewRows(response.preview ?? rows.slice(0, 10))
      setFilteredPreviewRows(response.preview ?? rows.slice(0, 10))
      setPlants((response.plant_ids ?? []).map(String))
      setClusters((response.cluster_ids ?? []).map(String))
      setWeatherConditions((response.weather_conditions ?? []).map(String))
      setDateMin(response.date_min ?? '')
      setDateMax(response.date_max ?? '')
      setStatusMessage(response.warning ? String(response.warning) : 'Default dataset loaded from GitHub.')
      await analyzeRows(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function analyzeRows(rows: Row[]) {
    if (!rows.length) {
      setKpis(null)
      setFilteredData([])
      setFilteredPreviewRows([])
      setCharts({})
      setMlResult(null)
      setInsights([])
      return
    }

    try {
      const filterResponse = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          plant_ids: selectedPlants.length ? selectedPlants : undefined,
          cluster_ids: selectedClusters.length ? selectedClusters : undefined,
          weather_conditions: selectedWeatherConditions.length ? selectedWeatherConditions : undefined,
          date_start: dateStart || undefined,
          date_end: dateEnd || undefined,
        }),
      }).then(handleResponse)

      const filteredRows = filterResponse.data ?? rows
      setFilteredData(filteredRows)
      setFilteredPreviewRows(filterResponse.preview ?? filteredRows.slice(0, 15))
      setKpis(filterResponse.kpis ?? null)
      rows = filteredRows
    } catch (err) {
      console.error(err)
    }

    try {
      const chartResponse = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setCharts(chartResponse)
    } catch (err) {
      console.error(err)
      setCharts({})
    }

    try {
      const mlResponse = await fetch(`${API_BASE_URL}/ml/predict-generation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setMlResult(mlResponse)
    } catch (err) {
      console.error(err)
      setMlResult(null)
    }

    try {
      const insightResponse = await fetch(`${API_BASE_URL}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setInsights(insightResponse.insights ?? [])
    } catch (err) {
      console.error(err)
      setInsights([])
    }
  }

  async function downloadRows(rows: Row[], filename: string) {
    const response = await fetch(`${API_BASE_URL}/download-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: rows }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || 'Download failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  async function handleUpload(file: File) {
    setUploadFile(file)
    setError(null)
    setLoading(true)
    setStatusMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch(`${API_BASE_URL}/upload-csv`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = uploadResponse.data ?? []

      if (mode === 'mapping') {
        const columnsResponse = await fetch(`${API_BASE_URL}/get-columns`, {
          method: 'POST',
          body: formData,
        }).then(handleResponse)

        const uploadedColumns = (columnsResponse.columns ?? []).map(String)
        setFileColumns(uploadedColumns)
        setDefaultPreviewRows(uploadResponse.preview ?? rows.slice(0, 10))
        setFilteredPreviewRows(uploadResponse.preview ?? rows.slice(0, 15))
        setData(rows)
        setFilteredData(rows)
        setPlants((uploadResponse.plant_ids ?? []).map(String))
        setClusters((uploadResponse.cluster_ids ?? []).map(String))
        setWeatherConditions((uploadResponse.weather_conditions ?? []).map(String))
        setMapping(Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, uploadedColumns.includes(field) ? field : ''])))
        setStatusMessage('CSV uploaded. Map the columns, then apply the mapping to unlock the analytics.')
        return
      }

      setMode('upload')
      setData(rows)
      setFilteredData(rows)
      setDefaultPreviewRows(uploadResponse.preview ?? rows.slice(0, 10))
      setFilteredPreviewRows(uploadResponse.preview ?? rows.slice(0, 15))
      setPlants((uploadResponse.plant_ids ?? []).map(String))
      setClusters((uploadResponse.cluster_ids ?? []).map(String))
      setWeatherConditions((uploadResponse.weather_conditions ?? []).map(String))
      setDateMin('')
      setDateMax('')
      setSelectedPlants([])
      setSelectedClusters([])
      setSelectedWeatherConditions([])
      setStatusMessage(uploadResponse.warning ? String(uploadResponse.warning) : 'CSV uploaded successfully.')
      await analyzeRows(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  async function applyMapping() {
    if (!uploadFile) return

    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const params = new URLSearchParams()
      for (const field of REQUIRED_FIELDS) {
        params.set(field, mapping[field] ?? '')
      }

      const response = await fetch(`${API_BASE_URL}/apply-mapping?${params.toString()}`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = response.data ?? []
      setData(rows)
      setFilteredData(rows)
      setDefaultPreviewRows(response.preview ?? rows.slice(0, 10))
      setFilteredPreviewRows(response.preview ?? rows.slice(0, 15))
      setPlants((response.plant_ids ?? []).map(String))
      setClusters((response.cluster_ids ?? []).map(String))
      setWeatherConditions((response.weather_conditions ?? []).map(String))
      setSelectedPlants([])
      setSelectedClusters([])
      setSelectedWeatherConditions([])
      setStatusMessage('Manual mapping applied successfully.')
      await analyzeRows(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Mapping failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    void handleUpload(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    void handleUpload(file)
  }

  const filteredCountText = `${filteredData.length} of ${data.length || filteredData.length}`
  const actualVsForecastSeries = (timeseries as Row[]).map((row) => ({
    x: row.timestamp,
    actual: Number(row.actual_generation_kwh ?? 0),
    forecast: Number(row.forecast_generation_kwh ?? 0),
  }))

  const chartX = actualVsForecastSeries.map((item) => item.x)
  const actualY = actualVsForecastSeries.map((item) => item.actual)
  const forecastY = actualVsForecastSeries.map((item) => item.forecast)
  const scatterX = (scatter as Row[]).map((row) => Number(row.forecast_generation_kwh ?? 0))
  const scatterY = (scatter as Row[]).map((row) => Number(row.actual_generation_kwh ?? 0))
  const diagonalMin = scatterRange?.min ?? Math.min(...scatterX, ...scatterY, 0)
  const diagonalMax = scatterRange?.max ?? Math.max(...scatterX, ...scatterY, 1)
  const weatherLabels = (errorByWeather as Row[]).map((row) => row.weather_condition ?? row.weather_condition ?? '')
  const weatherErrors = (errorByWeather as Row[]).map((row) => Number(row.abs_error ?? 0))
  const clearnessX = (clearness as Row[]).map((row) => Number(row.clearness_index ?? 0))
  const clearnessY = (clearness as Row[]).map((row) => Number(row.actual_generation_kwh ?? 0))

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
            <span>Solar Power</span>
            <span className="text-slate-300">•</span>
            <span>Solar Power Generation Forecasting Lab</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0F172A] md:text-5xl">Solar Power Generation Forecasting Lab</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
            Forecast solar generation, compare actual versus planned output, analyze weather-driven losses, and evaluate plant-level forecasting accuracy with an interactive React dashboard.
          </p>
        </div>

        <Tabs>
          <TabList className="mb-8 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Overview</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Important Attributes</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Application</Tab>
          </TabList>

          <TabPanel>
            <div className="space-y-6">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Purpose</p>
                    <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Solar telemetry and forecast intelligence in one lab</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      SCADA plant data and weather conditions are combined to forecast generation, compare actual against forecast output, and uncover the weather patterns that drive the largest prediction errors.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[#CCFBF1] bg-[#ECFDF5] px-5 py-4 text-[#0F766E] shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Who should use this</p>
                    <p className="mt-2 text-sm leading-6">Energy analysts, plant managers, forecasting teams, and operations leaders.</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={<SunMedium className="h-5 w-5 text-[#0F766E]" />} label="Total Actual Generation (kWh)" value="Display only" accent="bg-[#ECFDF5]" />
                <MetricCard icon={<Gauge className="h-5 w-5 text-[#0369A1]" />} label="RMSE / MAE vs Forecast" value="Display only" accent="bg-[#EFF6FF]" />
                <MetricCard icon={<CloudSun className="h-5 w-5 text-[#0F766E]" />} label="MAPE by Plant / Cluster" value="Display only" accent="bg-[#ECFDF5]" />
                <MetricCard icon={<Zap className="h-5 w-5 text-[#0369A1]" />} label="Cloud & Weather Driven Loss" value="Display only" accent="bg-[#EFF6FF]" />
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-3xl font-bold text-[#0F172A]">Required Column Data Dictionary</h2>
                <p className="mt-3 max-w-3xl text-slate-600">Uploaded files are validated against the 24 required solar telemetry and weather columns before analytics runs.</p>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Column</TableHead>
                          <TableHead className="font-semibold text-slate-700">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {REQUIRED_FIELDS.map((field) => (
                          <TableRow key={field}>
                            <TableCell className="font-semibold text-[#0F172A]">{field}</TableCell>
                            <TableCell className="text-slate-600">{FIELD_LABELS[field]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <h3 className="text-2xl font-bold text-[#0F172A]">Independent Variables</h3>
                  <p className="mt-2 text-sm text-slate-500">18 features feed the RandomForestRegressor.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['solar_radiation_wm2', 'diffuse_radiation_wm2', 'direct_normal_irradiance_wm2', 'temperature_c', 'humidity_pct', 'wind_speed_mps', 'cloud_cover_pct', 'pressure_hpa', 'dew_point_c', 'day_of_year', 'clearness_index', 'panel_tilt_deg', 'panel_azimuth_deg', 'weather_condition', 'plant_id', 'inverter_cluster_id', 'is_holiday_flag', 'timestamp'].map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <h3 className="text-2xl font-bold text-[#0F172A]">Dependent Variables</h3>
                  <p className="mt-2 text-sm text-slate-500">Forecast and error outputs used for analytics and model evaluation.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['forecast_generation_kwh', 'actual_generation_kwh', 'generation_error_kwh'].map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-8">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Dataset Options</p>
                <RadioGroup value={mode} onValueChange={(value) => setMode(value as DatasetMode)} className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    { value: 'default', title: 'Default Dataset', description: 'Automatically load the GitHub solar forecasting dataset.' },
                    { value: 'upload', title: 'Upload CSV', description: 'Upload your own CSV and analyze it immediately.' },
                    { value: 'mapping', title: 'Upload CSV + Column Mapping', description: 'Upload a file and manually map the 24 required columns.' },
                  ].map((option) => (
                    <label key={option.value} className={`cursor-pointer rounded-3xl border p-5 transition ${mode === option.value ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={option.value} className="mt-1 border-[#0F766E]" />
                        <div>
                          <p className="text-lg font-semibold text-[#0F172A]">{option.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">{error}</div>}
              {statusMessage && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">{statusMessage}</div>}

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Step 1</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">{mode === 'mapping' ? 'Upload CSV for Mapping' : mode === 'upload' ? 'Upload CSV file' : 'Load Default Dataset'}</h3>
                    <p className="mt-2 text-slate-600">{mode === 'default' ? 'Dataset loads automatically from GitHub RAW.' : 'Drag and drop file here or use the browse button. Limit 200MB per file • CSV'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="default" onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="h-4 w-4" />
                      Browse CSV
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => void loadDefault()}>
                      Reload Default Data
                    </Button>
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileInputChange} />

                {mode === 'default' && !loading && data.length > 0 && (
                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Default dataset loaded from GitHub</p>
                        <p className="text-sm text-slate-500">Columns: {DEFAULT_DATASET_COLUMNS.join(' • ')}</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => void downloadRows(data, 'solar_default_dataset.csv')}>
                        <Download className="h-4 w-4" />
                        Download Default Data
                      </Button>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <DataTable rows={dataForTopTable} />
                      </div>
                    </div>
                  </div>
                )}

                {(mode === 'upload' || mode === 'mapping') && !uploadFile && (
                  <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="mt-6 cursor-pointer rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-[#0F766E] hover:bg-[#F8FBFF]">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="rounded-full bg-[#ECFDF5] p-4 text-[#0F766E]">
                        <FileUp className="h-8 w-8" />
                      </div>
                      <h4 className="mt-4 text-xl font-bold text-[#0F172A]">Drag and drop file here</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">Limit 200MB per file • CSV</p>
                    </div>
                  </div>
                )}

                {loading && <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Processing data...</div>}
              </section>

              {mode === 'mapping' && uploadFile && fileColumns.length > 0 && (
                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Step 2</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Preview and map columns</h3>
                  <p className="mt-2 text-slate-600">Map the uploaded CSV headers to the required solar dataset fields.</p>

                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="overflow-x-auto">
                      <DataTable rows={defaultPreviewRows} maxRows={5} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {REQUIRED_FIELDS.map((field) => (
                      <label key={field} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <span className="mb-2 block font-semibold text-slate-700">Map → {field}</span>
                        <Select value={mapping[field] ?? ''} onValueChange={(value) => setMapping((prev) => ({ ...prev, [field]: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>
                          <SelectContent>
                            {fileColumns.map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={() => void applyMapping()} variant="default">
                      Apply Mapping
                    </Button>
                    <p className="text-sm text-slate-500">This validates the uploaded file against the required solar schema.</p>
                  </div>
                </section>
              )}

              {data.length > 0 && (
                <>
                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">STEP 2 — FILTERS & PREVIEW</h3>
                        <p className="mt-1 text-sm text-slate-500">Use the filters below to narrow the solar dataset and preview the result.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void analyzeRows(data)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59]"
                      >
                        Apply filters
                      </button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                      <FilterSelector label="Plant Filter" options={plants} selected={selectedPlants} onToggle={(value) => setSelectedPlants((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} />
                      <FilterSelector label="Inverter Cluster" options={clusters} selected={selectedClusters} onToggle={(value) => setSelectedClusters((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} />
                      <FilterSelector label="Weather Condition" options={weatherConditions} selected={selectedWeatherConditions} onToggle={(value) => setSelectedWeatherConditions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} />
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Date Range</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <Input type="date" value={dateStart} min={dateMin || undefined} max={dateMax || undefined} onChange={(e) => setDateStart(e.target.value)} />
                          <Input type="date" value={dateEnd} min={dateMin || undefined} max={dateMax || undefined} onChange={(e) => setDateEnd(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Filtered Rows: {filteredCountText}</h3>
                        <p className="mt-1 text-sm text-slate-500">Preview of the filtered result set, limited to the first 15 rows.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => void downloadRows(filteredData.slice(0, 500), 'solar_filtered_preview.csv')}>
                        <Download className="h-4 w-4" />
                        Download filtered preview
                      </Button>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <DataTable rows={filteredPreviewRows} maxRows={15} />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <h3 className="text-xl font-semibold text-slate-900">KPI Section</h3>
                    <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                      <MetricCard icon={<SunMedium className="h-5 w-5 text-[#0F766E]" />} label="Total Actual Generation (kWh)" value={kpis ? formatMetric(kpis.total_actual_kwh) : '—'} accent="bg-[#ECFDF5]" />
                      <MetricCard icon={<Gauge className="h-5 w-5 text-[#0369A1]" />} label="Total Forecast Generation (kWh)" value={kpis ? formatMetric(kpis.total_forecast_kwh) : '—'} accent="bg-[#EFF6FF]" />
                      <MetricCard icon={<Sparkles className="h-5 w-5 text-[#0369A1]" />} label="MAE / RMSE (kWh)" value={kpis ? `${formatMetric(kpis.mae)} / ${formatMetric(kpis.rmse)}` : '—'} accent="bg-[#EFF6FF]" />
                      <MetricCard icon={<CloudSun className="h-5 w-5 text-[#0F766E]" />} label="MAPE (%)" value={kpis ? formatPercent(kpis.mape_pct) : '—'} accent="bg-[#ECFDF5]" />
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Charts & Diagnostics</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Plotly charts for forecast quality</h3>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                        <h4 className="mb-3 text-lg font-semibold text-[#0F172A]">Actual vs Forecast Generation (kWh)</h4>
                        <Plot
                          data={[
                            {
                              x: chartX,
                              y: actualY,
                              type: 'scatter',
                              mode: 'lines',
                              name: 'Actual',
                              line: { color: '#DC2626', width: 3 },
                            },
                            {
                              x: chartX,
                              y: forecastY,
                              type: 'scatter',
                              mode: 'lines',
                              name: 'Forecast',
                              line: { color: '#2563EB', width: 3, dash: 'dash' },
                            },
                          ]}
                          layout={{
                            title: 'Actual vs Forecast Generation',
                            autosize: true,
                            height: 520,
                            margin: { l: 50, r: 24, t: 50, b: 50 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'timestamp', gridcolor: '#E2E8F0' },
                            yaxis: { title: 'generation kWh', gridcolor: '#E2E8F0' },
                            legend: { orientation: 'h' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                        <h4 className="mb-3 text-lg font-semibold text-[#0F172A]">Actual vs Forecast Scatter</h4>
                        <Plot
                          data={[
                            {
                              x: scatterX,
                              y: scatterY,
                              type: 'scatter',
                              mode: 'markers',
                              name: 'Generation',
                              marker: { color: '#0369A1', size: 8 },
                            },
                            {
                              x: [diagonalMin, diagonalMax],
                              y: [diagonalMin, diagonalMax],
                              type: 'scatter',
                              mode: 'lines',
                              name: 'Ideal fit',
                              line: { color: 'red', dash: 'dash', width: 2 },
                            },
                          ]}
                          layout={{
                            title: 'Actual vs Forecast Generation Scatter',
                            autosize: true,
                            height: 520,
                            margin: { l: 50, r: 24, t: 50, b: 50 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'forecast_generation_kwh', gridcolor: '#E2E8F0' },
                            yaxis: { title: 'actual_generation_kwh', gridcolor: '#E2E8F0' },
                            legend: { orientation: 'h' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                        <h4 className="mb-3 text-lg font-semibold text-[#0F172A]">Average Absolute Error by Weather Condition</h4>
                        <Plot
                          data={[
                            {
                              x: weatherLabels,
                              y: weatherErrors,
                              type: 'bar',
                              name: 'abs_error',
                              marker: { color: '#0F766E' },
                              text: weatherErrors,
                              textposition: 'auto',
                            },
                          ]}
                          layout={{
                            title: 'Average Absolute Error by Weather Condition',
                            autosize: true,
                            height: 520,
                            margin: { l: 50, r: 24, t: 50, b: 110 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'weather_condition', tickangle: -25, gridcolor: '#E2E8F0' },
                            yaxis: { title: 'abs_error', gridcolor: '#E2E8F0' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                        <h4 className="mb-3 text-lg font-semibold text-[#0F172A]">Clearness Index vs Actual Generation</h4>
                        <Plot
                          data={[
                            {
                              x: clearnessX,
                              y: clearnessY,
                              type: 'scatter',
                              mode: 'markers',
                              name: 'Generation',
                              marker: { color: '#0F766E', size: 8 },
                            },
                          ]}
                          layout={{
                            title: 'Clearness Index vs Actual Generation',
                            autosize: true,
                            height: 520,
                            margin: { l: 50, r: 24, t: 50, b: 50 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'clearness_index', gridcolor: '#E2E8F0' },
                            yaxis: { title: 'actual_generation_kwh', gridcolor: '#E2E8F0' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Machine Learning</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">RandomForestRegressor</h3>
                      </div>
                    </div>
                    <div className="mt-6 rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#ECFDF5] to-white p-6">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="rounded-full bg-[#0F766E] p-4 text-white shadow-lg shadow-teal-100">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Model trained successfully</p>
                          <p className="mt-1 text-base text-slate-600">The backend trains a RandomForestRegressor on the active solar dataset and reports RMSE and R².</p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Rows</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.train_size && mlResult?.test_size ? mlResult.train_size + mlResult.test_size : data.length}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">RMSE</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.rmse ?? '—'}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">R² Score</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.r2 ?? '—'}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Test Size</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.test_size ?? '—'}</p></div>
                      </div>

                      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="bg-slate-50">Actual_kWh</TableHead>
                                <TableHead className="bg-slate-50">Predicted_kWh</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(mlResult?.predictions ?? []).length ? (
                                mlResult.predictions.map((row: Row, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{formatCell(row.Actual_kWh)}</TableCell>
                                    <TableCell>{formatCell(row.Predicted_kWh)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={2} className="py-8 text-center text-slate-500">Prediction table will appear after analysis.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button type="button" variant="outline" onClick={() => void downloadRows(mlResult?.predictions ?? [], 'solar_generation_predictions.csv')}>
                          <Download className="h-4 w-4" />
                          Download Predictions CSV
                        </Button>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Automated Insights</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Backend-generated observations</h3>
                      </div>
                      <Button type="button" variant="outline" onClick={() => void downloadRows(insights, 'solar_forecasting_insights.csv')}>
                        <Download className="h-4 w-4" />
                        Download Insights
                      </Button>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>{INSIGHT_COLUMNS.map((column) => <TableHead key={column} className="bg-slate-100 font-semibold text-slate-700">{column}</TableHead>)}</TableRow>
                          </TableHeader>
                          <TableBody>
                            {insights.length ? insights.map((row, index) => (
                              <TableRow key={`${row.Insight}-${index}`}>
                                {INSIGHT_COLUMNS.map((column) => (
                                  <TableCell key={column} className="whitespace-normal text-slate-700">{row[column as keyof InsightRow] ?? '—'}</TableCell>
                                ))}
                              </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-slate-500">Insights will appear after analysis.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}
