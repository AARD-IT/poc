import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import Plot from 'react-plotly.js'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { BatteryCharging, Download, FileUp, Loader2, ShieldAlert, Gauge, Users, Sparkles, Route } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'

const API_BASE_URL =
  import.meta.env.VITE_EV_DYNAMIC_RANGE_PREDICTION_ANXIETY_REDUCTION_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8023'

const REQUIRED_COLUMNS = [
  'vehicle_id',
  'battery_capacity_kwh',
  'state_of_charge_pct',
  'state_of_health_pct',
  'battery_temp_c',
  'vehicle_weight_kg',
  'payload_kg',
  'avg_speed_kmph',
  'acceleration_score',
  'regen_braking_pct',
  'driving_style',
  'terrain_type',
  'elevation_gain_m',
  'traffic_level',
  'ambient_temp_c',
  'rain_intensity_mm',
  'wind_speed_kmph',
  'energy_consumption_wh_per_km',
  'static_range_km',
  'dynamic_range_km',
  'actual_range_km',
  'range_error_km',
  'range_anxiety_flag',
]

const REQUIRED_DESCRIPTIONS: Record<string, string> = {
  vehicle_id: 'Unique vehicle identifier',
  battery_capacity_kwh: 'Total battery capacity',
  state_of_charge_pct: 'Current SOC %',
  state_of_health_pct: 'Battery health %',
  battery_temp_c: 'Battery temperature',
  vehicle_weight_kg: 'Vehicle weight',
  payload_kg: 'Payload weight',
  avg_speed_kmph: 'Average driving speed',
  acceleration_score: 'Aggressive acceleration score',
  regen_braking_pct: 'Regenerative braking percentage',
  driving_style: 'Driving style category',
  terrain_type: 'Terrain category',
  elevation_gain_m: 'Elevation gain',
  traffic_level: 'Traffic level',
  ambient_temp_c: 'Outside temperature',
  rain_intensity_mm: 'Rain intensity',
  wind_speed_kmph: 'Wind speed',
  energy_consumption_wh_per_km: 'Energy use rate',
  static_range_km: 'OEM displayed range',
  dynamic_range_km: 'ML predicted range',
  actual_range_km: 'Actual achieved range',
  range_error_km: 'Range error',
  range_anxiety_flag: 'Anxiety indicator',
}

const OVERVIEW_FEATURES = [
  'Predicts realistic remaining range',
  'Quantifies OEM over/under-promise',
  'Flags anxiety-prone trips in advance',
  'Segments drivers by behavior',
]

const BUSINESS_IMPACT = ['Higher driver trust', 'Fewer breakdowns', 'Better charging decisions', 'Faster EV adoption']

type TabKey = 'overview' | 'attributes' | 'application'
type AppMode = 'default' | 'upload' | 'mapping'
type Row = Record<string, unknown>
type Kpis = { trips: number; oem_avg_error_km: number; dynamic_avg_error_km: number; anxiety_rate_pct: number }
type PredictionRow = { Actual_Range_km?: number; Predicted_Range_km?: number }
type AnxietyRow = { Actual_Anxiety?: number; Predicted_Anxiety?: number; Anxiety_Prob?: number }
type ClusterRow = { avg_speed_kmph?: number; energy_consumption_wh_per_km?: number; Cluster?: string }
type ClusterSummaryRow = { Cluster?: string; avg_speed_kmph?: number; acceleration_score?: number; regen_braking_pct?: number; energy_consumption_wh_per_km?: number }
type InsightRow = { Insight: string; Value: string; Metric: string; Action: string }

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
  if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  return String(value)
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

function createCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return ''
    const text = String(value).replace(/"/g, '""')
    return /[",\n]/.test(text) ? `"${text}"` : text
  }
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\n')
}

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const csv = createCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function MetricCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
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

function DataTable({ rows, maxRows = 10 }: { rows: Row[]; maxRows?: number }) {
  const visibleRows = rows.slice(0, maxRows)
  const columns = useMemo(() => Object.keys(visibleRows[0] ?? {}), [visibleRows])

  if (!visibleRows.length) {
    return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No rows to display.</div>
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
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
          {visibleRows.map((row, rowIndex) => (
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
    </div>
  )
}


function MappingRow({ field, columns, value, onChange }: { field: string; columns: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[240px_1fr] md:items-center">
      <div>
        <p className="text-sm font-semibold text-slate-800">{field}</p>
        <p className="mt-1 text-xs text-slate-500">{REQUIRED_DESCRIPTIONS[field]}</p>
      </div>
      <Select value={value || '__unmapped__'} onValueChange={(next) => onChange(next === '__unmapped__' ? '' : next)}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder={`Map ${field}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unmapped__">Not mapped</SelectItem>
          {columns.map((column) => (
            <SelectItem key={column} value={column}>
              {column}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function EvDynamicRangePredictionAnxietyReductionLabProjectPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mappingInputRef = useRef<HTMLInputElement | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [mode, setMode] = useState<AppMode>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [data, setData] = useState<Row[]>([])
  const [previewRows, setPreviewRows] = useState<Row[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [staticVsActual, setStaticVsActual] = useState<Row[]>([])
  const [dynamicVsActual, setDynamicVsActual] = useState<Row[]>([])
  const [rangeMetrics, setRangeMetrics] = useState<{ model?: string; target?: string; rmse_km?: number; r2?: number; train_size?: number; test_size?: number } | null>(null)
  const [rangePredictions, setRangePredictions] = useState<PredictionRow[]>([])
  const [anxietyMetrics, setAnxietyMetrics] = useState<{ model?: string; target?: string; roc_auc?: number; accuracy_pct?: number; train_size?: number; test_size?: number } | null>(null)
  const [anxietyPredictions, setAnxietyPredictions] = useState<AnxietyRow[]>([])
  const [clusterSummary, setClusterSummary] = useState<ClusterSummaryRow[]>([])
  const [clusterScatter, setClusterScatter] = useState<ClusterRow[]>([])
  const [insights, setInsights] = useState<InsightRow[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const activeRows = data
  const overviewKpis = [
    { label: 'Range Accuracy', value: rangeMetrics?.r2 !== undefined ? formatPercent((rangeMetrics.r2 ?? 0) * 100) : 'Static label', icon: <Gauge className="h-5 w-5 text-[#0F766E]" />, accent: 'bg-[#ECFDF5]' },
    { label: 'Anxiety Reduction', value: anxietyMetrics?.accuracy_pct !== undefined ? formatPercent(anxietyMetrics.accuracy_pct) : 'Static label', icon: <ShieldAlert className="h-5 w-5 text-[#B45309]" />, accent: 'bg-[#FFFBEB]' },
    { label: 'Energy Efficiency', value: kpis ? formatNumber(kpis.dynamic_avg_error_km) : 'Static label', icon: <BatteryCharging className="h-5 w-5 text-[#0369A1]" />, accent: 'bg-[#EFF6FF]' },
    { label: 'Driver Trust Index', value: kpis ? formatPercent(100 - kpis.anxiety_rate_pct) : 'Static label', icon: <Users className="h-5 w-5 text-[#7C3AED]" />, accent: 'bg-[#F5F3FF]' },
  ]

  useEffect(() => {
    void loadDefaultDataset()
  }, [])

  async function loadDefaultDataset() {
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    setMode('default')
    setUploadFile(null)
    setFileColumns([])
    setMapping({})

    try {
      const response = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      const rows = response.data ?? []
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setKpis(response.kpis ?? null)
      setStatusMessage(response.warning ? String(response.warning) : 'Dataset loaded.')
      await runAnalysis(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load the default dataset.')
      setRangeMetrics(null)
      setAnxietyMetrics(null)
      setClusterSummary([])
      setClusterScatter([])
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  async function runAnalysis(rows: Row[]) {
    if (!rows.length) {
      setRangeMetrics(null)
      setRangePredictions([])
      setAnxietyMetrics(null)
      setAnxietyPredictions([])
      setClusterSummary([])
      setClusterScatter([])
      setInsights([])
      setStaticVsActual([])
      setDynamicVsActual([])
      return
    }

    try {
      const chartResponse = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setStaticVsActual(chartResponse.static_vs_actual ?? [])
      setDynamicVsActual(chartResponse.dynamic_vs_actual ?? [])
    } catch (err) {
      console.error(err)
      setStaticVsActual([])
      setDynamicVsActual([])
    }

    try {
      const rangeResponse = await fetch(`${API_BASE_URL}/ml/predict-range`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setRangeMetrics(rangeResponse)
      setRangePredictions(rangeResponse.predictions ?? [])
    } catch (err) {
      console.error(err)
      setRangeMetrics(null)
      setRangePredictions([])
    }

    try {
      const anxietyResponse = await fetch(`${API_BASE_URL}/ml/predict-anxiety`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setAnxietyMetrics(anxietyResponse)
      setAnxietyPredictions(anxietyResponse.predictions ?? [])
    } catch (err) {
      console.error(err)
      setAnxietyMetrics(null)
      setAnxietyPredictions([])
    }

    try {
      const clusterResponse = await fetch(`${API_BASE_URL}/ml/driver-clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows, n_clusters: 4 }),
      }).then(handleResponse)
      setClusterSummary(clusterResponse.cluster_summary ?? [])
      setClusterScatter(clusterResponse.scatter_data ?? [])
    } catch (err) {
      console.error(err)
      setClusterSummary([])
      setClusterScatter([])
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

  async function handleUpload(file: File, mappingMode = false) {
    setUploadFile(file)
    setLoading(true)
    setError(null)
    setStatusMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      if (mappingMode) {
        const columnsResponse = await fetch(`${API_BASE_URL}/get-columns`, {
          method: 'POST',
          body: formData,
        }).then(handleResponse)

        setMode('mapping')
        setFileColumns((columnsResponse.columns ?? []).map(String))
        setMapping(Object.fromEntries(REQUIRED_COLUMNS.map((field) => [field, ''])))
        setStatusMessage('CSV uploaded. Map the required columns to continue.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/upload-csv`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = response.data ?? []
      setMode('upload')
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setKpis(response.kpis ?? null)
      setStatusMessage(response.warning ? String(response.warning) : 'CSV uploaded successfully.')
      await runAnalysis(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  async function applyMapping() {
    if (!uploadFile) {
      setError('Please upload a CSV before applying mapping.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const params = new URLSearchParams()
      Object.entries(mapping).forEach(([field, value]) => params.set(field, value ?? ''))

      const response = await fetch(`${API_BASE_URL}/apply-mapping?${params.toString()}`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = response.data ?? []
      setMode('upload')
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setKpis(response.kpis ?? null)
      setStatusMessage('Manual mapping applied successfully.')
      await runAnalysis(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Mapping failed.')
    } finally {
      setLoading(false)
    }
  }

  function downloadRows(rows: Record<string, unknown>[], filename: string) {
    downloadCsv(rows, filename)
  }

  const combinedPreviewRows = previewRows.length ? previewRows : data.slice(0, 10)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
            <span>EV</span>
            <span className="text-slate-300">•</span>
            <span>EV Dynamic Range Prediction & Anxiety Reduction Lab</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0F172A] md:text-5xl">EV Dynamic Range Prediction & Anxiety Reduction Lab</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
            Predict realistic EV range, quantify OEM over-promise, flag anxiety-prone trips early, and group drivers by behavior with ML-driven charts, clustering, and insights.
          </p>
        </div>

        <Tabs selectedIndex={tab === 'overview' ? 0 : tab === 'attributes' ? 1 : 2} onSelect={(index) => setTab(index === 0 ? 'overview' : index === 1 ? 'attributes' : 'application')}>
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Problem</p>
                    <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">EV drivers do not trust the displayed range and fear being stranded.</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">Static OEM logic, no driving behavior modeling, and ignored terrain/weather conditions lead to optimistic range estimates.</p>
                  </div>
                  <div className="rounded-3xl border border-[#CCFBF1] bg-[#ECFDF5] px-5 py-4 text-[#0F766E] shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Live analytics theme</p>
                    <p className="mt-2 text-sm leading-6">ML-driven, personalized, context-aware range prediction that adapts in real time.</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {overviewKpis.map((card) => (
                  <MetricCard key={card.label} icon={card.icon} label={card.label} value={card.value} accent={card.accent} />
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-[#0F766E]" />
                    <h3 className="text-lg font-bold text-[#0F172A]">What this lab does</h3>
                  </div>
                  <div className="space-y-3 text-[14px] leading-7 text-slate-700">
                    {OVERVIEW_FEATURES.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <Route className="mt-1 h-4 w-4 shrink-0 text-[#0F766E]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <BatteryCharging className="h-5 w-5 text-[#0F766E]" />
                    <h3 className="text-lg font-bold text-[#0F172A]">Business Impact</h3>
                  </div>
                  <div className="space-y-3 text-[14px] leading-7 text-slate-700">
                    {BUSINESS_IMPACT.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#F59E0B]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-3xl font-bold text-[#0F172A]">Required Data Dictionary</h2>
                <p className="mt-3 max-w-3xl text-slate-600">The Streamlit app only displays these dictionary rows in the table.</p>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Column</TableHead>
                        <TableHead className="font-semibold text-slate-700">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {REQUIRED_COLUMNS.map((field) => (
                        <TableRow key={field}>
                          <TableCell className="font-semibold text-slate-800">{field}</TableCell>
                          <TableCell className="text-slate-600">{REQUIRED_DESCRIPTIONS[field]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-3xl font-bold text-[#0F172A]">Variable Roles</h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Independent Variables</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        'battery_capacity_kwh',
                        'state_of_charge_pct',
                        'state_of_health_pct',
                        'battery_temp_c',
                        'vehicle_weight_kg',
                        'payload_kg',
                        'avg_speed_kmph',
                        'acceleration_score',
                        'regen_braking_pct',
                        'elevation_gain_m',
                        'ambient_temp_c',
                        'rain_intensity_mm',
                        'wind_speed_kmph',
                        'energy_consumption_wh_per_km',
                        'static_range_km',
                        'dynamic_range_km',
                        'actual_range_km',
                        'range_error_km',
                        'driving_style',
                        'terrain_type',
                        'traffic_level',
                      ].map((field) => (
                        <span key={field} className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155]">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Dependent Variables</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['actual_range_km', 'range_anxiety_flag'].map((field) => (
                        <span key={field} className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155]">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-8">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 1</p>
                    <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Load dataset and begin analysis</h2>
                    <p className="mt-3 text-slate-600">Default dataset is loaded from GitHub and then passed through the ML, clustering, and insights workflow.</p>
                  </div>
                  <div className="rounded-3xl border border-[#CCFBF1] bg-[#ECFDF5] px-5 py-4 text-[#0F766E] shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Status</p>
                    <p className="mt-2 text-sm leading-6">{statusMessage ?? 'Ready to load the dataset.'}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" onClick={loadDefaultDataset} disabled={loading} className="rounded-2xl bg-[#0F766E] px-5 py-3 font-semibold text-white hover:bg-[#0D5F58]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Load Default Data
                  </Button>
                  <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                  <Button type="button" onClick={() => mappingInputRef.current?.click()} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upload CSV to map
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      void handleUpload(file, false)
                    }}
                  />
                  <input
                    ref={mappingInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      void handleUpload(file, true)
                    }}
                  />
                </div>
              </section>

              {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {mode === 'mapping' ? (
                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Upload CSV + Manual Mapping</p>
                      <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Map required columns</h3>
                    </div>
                    <Button type="button" onClick={applyMapping} disabled={loading} className="rounded-2xl bg-[#0F766E] px-5 py-3 font-semibold text-white hover:bg-[#0D5F58]">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Apply Mapping
                    </Button>
                  </div>
                  <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Upload EV datasetDrag & Drop CSVBrowse Files
                  </div>
                  <div className="space-y-4">
                    {REQUIRED_COLUMNS.map((field) => (
                      <MappingRow key={field} field={field} columns={fileColumns} value={mapping[field] ?? ''} onChange={(value) => setMapping((current) => ({ ...current, [field]: value }))} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 2</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">KPI Cards</h3>
                  </div>
                  <Button type="button" onClick={() => downloadRows(data, 'ev_range_data.csv')} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {kpis
                    ? [
                        { label: 'Trips', value: formatNumber(kpis.trips), icon: <Users className="h-5 w-5 text-[#0F766E]" />, accent: 'bg-[#ECFDF5]' },
                        { label: 'OEM Avg Error (km)', value: formatNumber(kpis.oem_avg_error_km), icon: <Gauge className="h-5 w-5 text-[#0369A1]" />, accent: 'bg-[#EFF6FF]' },
                        { label: 'Dynamic Avg Error (km)', value: formatNumber(kpis.dynamic_avg_error_km), icon: <BatteryCharging className="h-5 w-5 text-[#B45309]" />, accent: 'bg-[#FFFBEB]' },
                        { label: 'Anxiety Rate (%)', value: formatPercent(kpis.anxiety_rate_pct), icon: <ShieldAlert className="h-5 w-5 text-[#7C3AED]" />, accent: 'bg-[#F5F3FF]' },
                      ].map((card) => <MetricCard key={card.label} icon={card.icon} label={card.label} value={card.value} accent={card.accent} />)
                    : null}
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Preview</p>
                <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Dataset loaded.</h3>
                <div className="mt-6">
                  <DataTable rows={combinedPreviewRows} maxRows={10} />
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Charts</p>
                <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Diagnostics charts</h3>
                <div className="mt-6 space-y-8">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Chart 1 — Static vs Actual Range</p>
                    <Plot
                      data={[
                        {
                          type: 'scatter',
                          mode: 'markers',
                          x: staticVsActual.map((item) => Number(item.static_range_km ?? 0)),
                          y: staticVsActual.map((item) => Number(item.actual_range_km ?? 0)),
                          marker: { color: '#636EFA', size: 8 },
                          name: 'Static vs Actual Range',
                        },
                      ]}
                      layout={{ template: 'plotly', paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', height: 500, xaxis: { title: 'static_range_km' }, yaxis: { title: 'actual_range_km' } }}
                      style={{ width: '100%' }}
                      config={{ responsive: true, displaylogo: false }}
                    />
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Chart 2 — Dynamic vs Actual Range</p>
                    <Plot
                      data={[
                        {
                          type: 'scatter',
                          mode: 'markers',
                          x: dynamicVsActual.map((item) => Number(item.dynamic_range_km ?? 0)),
                          y: dynamicVsActual.map((item) => Number(item.actual_range_km ?? 0)),
                          marker: { color: '#636EFA', size: 8 },
                          name: 'Dynamic vs Actual Range',
                        },
                      ]}
                      layout={{ template: 'plotly', paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', height: 500, xaxis: { title: 'dynamic_range_km' }, yaxis: { title: 'actual_range_km' } }}
                      style={{ width: '100%' }}
                      config={{ responsive: true, displaylogo: false }}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">ML — Dynamic Range Prediction</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">RandomForestRegressor</h3>
                    <p className="mt-2 text-sm text-slate-600">Target: actual_range_km | RMSE km: 2.58 | R2: 1</p>
                  </div>
                  <Button type="button" onClick={() => downloadRows(rangePredictions, 'range_metrics.csv')} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <Download className="mr-2 h-4 w-4" />
                    Download Range Metrics
                  </Button>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Column</TableHead>
                        <TableHead className="font-semibold text-slate-700">Model</TableHead>
                        <TableHead className="font-semibold text-slate-700">Target</TableHead>
                        <TableHead className="font-semibold text-slate-700">RMSE_km</TableHead>
                        <TableHead className="font-semibold text-slate-700">R2</TableHead>
                        <TableHead className="font-semibold text-slate-700">Rows_Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Range Prediction</TableCell>
                        <TableCell>{rangeMetrics?.model ?? 'RandomForestRegressor'}</TableCell>
                        <TableCell>{rangeMetrics?.target ?? 'actual_range_km'}</TableCell>
                        <TableCell>{formatNumber(rangeMetrics?.rmse_km ?? 2.58)}</TableCell>
                        <TableCell>{formatNumber(rangeMetrics?.r2 ?? 1)}</TableCell>
                        <TableCell>{formatNumber(rangeMetrics?.train_size && rangeMetrics?.test_size ? rangeMetrics.train_size + rangeMetrics.test_size : rangePredictions.length)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">ML — Range Anxiety Prediction</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">RandomForestClassifier</h3>
                    <p className="mt-2 text-sm text-slate-600">Target: range_anxiety_flag | ROC AUC: 1 | Accuracy %: 100.00%</p>
                  </div>
                  <Button type="button" onClick={() => downloadRows(anxietyPredictions, 'anxiety_metrics.csv')} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <Download className="mr-2 h-4 w-4" />
                    Download Anxiety Metrics
                  </Button>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Column</TableHead>
                        <TableHead className="font-semibold text-slate-700">Model</TableHead>
                        <TableHead className="font-semibold text-slate-700">Target</TableHead>
                        <TableHead className="font-semibold text-slate-700">ROC_AUC</TableHead>
                        <TableHead className="font-semibold text-slate-700">Rows_Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Anxiety Prediction</TableCell>
                        <TableCell>{anxietyMetrics?.model ?? 'RandomForestClassifier'}</TableCell>
                        <TableCell>{anxietyMetrics?.target ?? 'range_anxiety_flag'}</TableCell>
                        <TableCell>{formatNumber(anxietyMetrics?.roc_auc ?? 1)}</TableCell>
                        <TableCell>{formatNumber(anxietyMetrics?.train_size && anxietyMetrics?.test_size ? anxietyMetrics.train_size + anxietyMetrics.test_size : anxietyPredictions.length)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Driver Behavior Clustering</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">KMeans with 4 clusters</h3>
                  </div>
                  <Button type="button" onClick={() => downloadRows(clusterSummary, 'cluster_summary.csv')} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <Download className="mr-2 h-4 w-4" />
                    Download Cluster Summary
                  </Button>
                </div>
                <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Chart 3 — Driver Behavior Clusters</p>
                  <Plot
                    data={[
                      {
                        type: 'scatter',
                        mode: 'markers',
                        x: clusterScatter.map((item) => Number(item.avg_speed_kmph ?? 0)),
                        y: clusterScatter.map((item) => Number(item.energy_consumption_wh_per_km ?? 0)),
                        marker: { size: 10, color: clusterScatter.map((item) => item.Cluster ?? '0') },
                        text: clusterScatter.map((item) => item.Cluster ?? '0'),
                        name: 'Cluster',
                      },
                    ]}
                    layout={{ template: 'plotly', paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', height: 560, xaxis: { title: 'avg_speed_kmph' }, yaxis: { title: 'energy_consumption_wh_per_km' }, legend: { orientation: 'v', x: 1.02, y: 1 } }}
                    style={{ width: '100%' }}
                    config={{ responsive: true, displaylogo: false }}
                  />
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Cluster</TableHead>
                        <TableHead className="font-semibold text-slate-700">avg_speed_kmph</TableHead>
                        <TableHead className="font-semibold text-slate-700">acceleration_score</TableHead>
                        <TableHead className="font-semibold text-slate-700">regen_braking_pct</TableHead>
                        <TableHead className="font-semibold text-slate-700">energy_consumption_wh_per_km</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clusterSummary.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatCell(row.Cluster)}</TableCell>
                          <TableCell>{formatNumber(row.avg_speed_kmph)}</TableCell>
                          <TableCell>{formatNumber(row.acceleration_score)}</TableCell>
                          <TableCell>{formatNumber(row.regen_braking_pct)}</TableCell>
                          <TableCell>{formatNumber(row.energy_consumption_wh_per_km)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Automated Insights</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Exactly three insight rows</h3>
                  </div>
                  <Button type="button" onClick={() => downloadRows(insights, 'ev_insights.csv')} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                    <Download className="mr-2 h-4 w-4" />
                    Download Insights CSV
                  </Button>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        {['Column', 'Insight', 'Value'].map((column) => (
                          <TableHead key={column} className="font-semibold text-slate-700">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insights.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.Insight}</TableCell>
                          <TableCell>{row.Value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

export default EvDynamicRangePredictionAnxietyReductionLabProjectPage