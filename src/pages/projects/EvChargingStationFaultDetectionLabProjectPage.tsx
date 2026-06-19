import { useMemo, useRef, useState, type ReactNode } from 'react'
import Plot from 'react-plotly.js'
import { Download, FileUp, Gauge, Loader2, ShieldAlert, Thermometer, Zap } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'

const API_BASE_URL =
  import.meta.env.VITE_EV_CHARGING_STATION_FAULT_DETECTION_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8024'

const REQUIRED_COLUMNS = [
  'charger_id',
  'timestamp',
  'voltage',
  'current',
  'temperature',
  'power_kw',
  'session_active',
  'fault_flag',
  'fault_type',
]

const REQUIRED_DESCRIPTIONS: Record<string, string> = {
  charger_id: 'Unique charging station identifier',
  timestamp: 'Sensor timestamp',
  voltage: 'Measured voltage (V)',
  current: 'Measured current (A)',
  power_kw: 'Delivered power (kW)',
  temperature: 'Internal charger temperature (°C)',
  session_active: 'Charging session active flag',
  fault_flag: 'Binary fault indicator',
  fault_type: 'Fault classification label',
}

const PALETTE = ['#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', '#19D3F3']

type Row = Record<string, unknown>
type TabKey = 'overview' | 'attributes' | 'application'
type Kpis = { records: number; fault_rate_pct?: number; avg_temperature_c?: number; silent_failure_pct?: number }
type FaultPredictionRow = { Actual_Fault?: number; Predicted_Fault?: number; Fault_Prob?: number }
type AnomalyRow = { temperature?: number; power_kw?: number; anomaly?: number; charger_id?: string }
type InsightRow = { Insight?: string; Value?: string; Metric?: string; Action?: string }

type FilterResponse = {
  total_rows?: number
  total_original?: number
  kpis?: Kpis
  preview?: Row[]
  data?: Row[]
}

type LoadResponse = {
  total_rows?: number
  columns?: string[]
  charger_ids?: string[]
  fault_types?: string[]
  kpis?: Kpis
  preview?: Row[]
  data?: Row[]
  warning?: string | null
}

type ChartResponse = {
  voltage_vs_current?: Row[]
  temperature_over_time?: Row[]
}

type FaultClassifierResponse = {
  model?: string
  target?: string
  roc_auc?: number
  accuracy_pct?: number
  train_size?: number
  test_size?: number
  predictions?: FaultPredictionRow[]
}

type AnomalyResponse = {
  total_rows?: number
  num_anomalies?: number
  anomaly_rate?: number
  scatter_data?: AnomalyRow[]
}

type InsightsResponse = {
  insights?: InsightRow[]
}

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
  if (value instanceof Date) return value.toISOString()
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

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">{label}</p>
      <p className="mt-2 text-xs text-slate-500">Click options one by one to add or remove them.</p>
      {value.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(value.filter((selected) => selected !== item))}
              className="rounded-full border border-[#0F766E] bg-[#ECFDF5] px-3 py-1.5 text-sm font-semibold text-[#0F766E]"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-auto rounded-[16px] border border-slate-200 bg-white p-3">
        {options.map((option) => {
          const isSelected = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(isSelected ? value.filter((selected) => selected !== option) : [...value, option])}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-[#0F766E] hover:bg-slate-50'}`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]" />
      {label}
    </label>
  )
}

function buildCategoryTraces(
  rows: Row[],
  categoryKey: string,
  xKey: string,
  yKey: string,
  isLine = false,
) {
  const groups = new Map<string, Row[]>()
  rows.forEach((row) => {
    const category = String(row[categoryKey] ?? 'Unknown')
    const list = groups.get(category) ?? []
    list.push(row)
    groups.set(category, list)
  })

  return Array.from(groups.entries()).map(([category, groupRows], index) => ({
    type: 'scatter' as const,
    mode: isLine ? ('lines+markers' as const) : ('markers' as const),
    x: groupRows.map((row) => row[xKey]),
    y: groupRows.map((row) => row[yKey]),
    line: isLine ? { color: PALETTE[index % PALETTE.length], width: 2 } : undefined,
    marker: isLine ? { color: PALETTE[index % PALETTE.length], size: 7 } : { color: PALETTE[index % PALETTE.length], size: 9 },
    name: category,
    hovertemplate: `%{x}<br>%{y}<extra>${category}</extra>`,
  }))
}

function buildAnomalyTraces(rows: AnomalyRow[]) {
  const groups = new Map<string, AnomalyRow[]>()
  rows.forEach((row) => {
    const category = String(row.anomaly ?? 0)
    const list = groups.get(category) ?? []
    list.push(row)
    groups.set(category, list)
  })

  return Array.from(groups.entries()).map(([category, groupRows], index) => ({
    type: 'scatter' as const,
    mode: 'markers' as const,
    x: groupRows.map((row) => row.temperature),
    y: groupRows.map((row) => row.power_kw),
    marker: { color: PALETTE[index % PALETTE.length], size: 9 },
    name: category === '1' ? 'Anomaly' : 'Normal',
  }))
}

function dataDictionaryCsv() {
  return REQUIRED_COLUMNS.map((column) => ({ Column: column, Description: REQUIRED_DESCRIPTIONS[column] }))
}

export function EvChargingStationFaultDetectionLabProjectPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [tab, setTab] = useState<TabKey>('application')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [data, setData] = useState<Row[]>([])
  const [previewRows, setPreviewRows] = useState<Row[]>([])
  const [chargerOptions, setChargerOptions] = useState<string[]>([])
  const [faultTypeOptions, setFaultTypeOptions] = useState<string[]>([])
  const [selectedChargerIds, setSelectedChargerIds] = useState<string[]>([])
  const [selectedFaultTypes, setSelectedFaultTypes] = useState<string[]>([])
  const [activeOnly, setActiveOnly] = useState(false)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [voltageCurrentRows, setVoltageCurrentRows] = useState<Row[]>([])
  const [temperatureRows, setTemperatureRows] = useState<Row[]>([])
  const [faultMetrics, setFaultMetrics] = useState<FaultClassifierResponse | null>(null)
  const [faultPredictions, setFaultPredictions] = useState<FaultPredictionRow[]>([])
  const [anomalyMetrics, setAnomalyMetrics] = useState<AnomalyResponse | null>(null)
  const [anomalyRows, setAnomalyRows] = useState<AnomalyRow[]>([])
  const [insights, setInsights] = useState<InsightRow[]>([])
  const [filterReady, setFilterReady] = useState(false)

  const combinedPreviewRows = previewRows.length ? previewRows : data.slice(0, 10)
  const filteredCountText = kpis?.records !== undefined ? formatNumber(kpis.records) : formatNumber(combinedPreviewRows.length)
  const overviewCards = [
    { label: 'Charger Health', value: 'Continuous monitoring', icon: <Gauge className="h-5 w-5 text-[#0F766E]" />, accent: 'bg-[#ECFDF5]' },
    { label: 'Fault Rate', value: 'Event-driven alerts', icon: <ShieldAlert className="h-5 w-5 text-[#B45309]" />, accent: 'bg-[#FFFBEB]' },
    { label: 'Silent Failures', value: 'Session active / low power', icon: <Zap className="h-5 w-5 text-[#0369A1]" />, accent: 'bg-[#EFF6FF]' },
    { label: 'Thermal Risk', value: 'Temperature watchlist', icon: <Thermometer className="h-5 w-5 text-[#7C3AED]" />, accent: 'bg-[#F5F3FF]' },
  ]

  async function loadDefaultDataset() {
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    setFilterReady(false)
    setSelectedChargerIds([])
    setSelectedFaultTypes([])
    setActiveOnly(false)

    try {
      const response: LoadResponse = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      const rows = response.data ?? []
      const missing = REQUIRED_COLUMNS.filter((column) => !(response.columns ?? []).includes(column))
      if (missing.length) {
        throw new Error(`Missing columns: ${missing.join(', ')}`)
      }
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setKpis(response.kpis ?? null)
      setChargerOptions((response.charger_ids ?? []).map(String))
      setFaultTypeOptions((response.fault_types ?? []).map(String))
      setSelectedChargerIds((response.charger_ids ?? []).map(String))
      setSelectedFaultTypes((response.fault_types ?? []).map(String))
      setStatusMessage(response.warning ? String(response.warning) : 'Default dataset loaded.')
      setFilterReady(true)
      await runAnalysis(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load the default dataset.')
      clearAnalysis()
    } finally {
      setLoading(false)
    }
  }

  function clearAnalysis() {
    setKpis(null)
    setVoltageCurrentRows([])
    setTemperatureRows([])
    setFaultMetrics(null)
    setFaultPredictions([])
    setAnomalyMetrics(null)
    setAnomalyRows([])
    setInsights([])
  }

  async function handleUpload(file: File) {
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    setFilterReady(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response: LoadResponse = await fetch(`${API_BASE_URL}/upload-csv`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = response.data ?? []
      const missing = REQUIRED_COLUMNS.filter((column) => !(response.columns ?? []).includes(column))
      if (missing.length) {
        throw new Error(`Missing columns: ${missing.join(', ')}`)
      }

      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setKpis(response.kpis ?? null)
      setChargerOptions((response.charger_ids ?? []).map(String))
      setFaultTypeOptions((response.fault_types ?? []).map(String))
      setSelectedChargerIds((response.charger_ids ?? []).map(String))
      setSelectedFaultTypes((response.fault_types ?? []).map(String))
      setStatusMessage(response.warning ? String(response.warning) : 'CSV uploaded successfully.')
      setFilterReady(true)
      await runAnalysis(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
      clearAnalysis()
    } finally {
      setLoading(false)
    }
  }

  async function applyFilters() {
    if (!data.length) {
      setError('Load a dataset before applying filters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response: FilterResponse = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          charger_ids: selectedChargerIds,
          fault_types: selectedFaultTypes,
          active_only: activeOnly,
        }),
      }).then(handleResponse)

      const rows = response.data ?? []
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setKpis(response.kpis ?? null)
      setFilterReady(true)
      await runAnalysis(rows)
    } catch (err: any) {
      setError(err?.message ?? 'Filtering failed.')
      clearAnalysis()
    } finally {
      setLoading(false)
    }
  }

  async function runAnalysis(rows: Row[]) {
    if (!rows.length) {
      clearAnalysis()
      return
    }

    const [chartResponse, faultResponse, anomalyResponse, insightResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      })
        .then(handleResponse)
        .catch(() => null),
      fetch(`${API_BASE_URL}/ml/fault-classifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      })
        .then(handleResponse)
        .catch(() => null),
      fetch(`${API_BASE_URL}/ml/anomaly-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      })
        .then(handleResponse)
        .catch(() => null),
      fetch(`${API_BASE_URL}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      })
        .then(handleResponse)
        .catch(() => null),
    ])

    if (chartResponse) {
      const charts = chartResponse as ChartResponse
      setVoltageCurrentRows(charts.voltage_vs_current ?? [])
      setTemperatureRows(charts.temperature_over_time ?? [])
    } else {
      setVoltageCurrentRows([])
      setTemperatureRows([])
    }

    if (faultResponse) {
      const metrics = faultResponse as FaultClassifierResponse
      setFaultMetrics(metrics)
      setFaultPredictions(metrics.predictions ?? [])
    } else {
      setFaultMetrics(null)
      setFaultPredictions([])
    }

    if (anomalyResponse) {
      const metrics = anomalyResponse as AnomalyResponse
      setAnomalyMetrics(metrics)
      setAnomalyRows(metrics.scatter_data ?? [])
    } else {
      setAnomalyMetrics(null)
      setAnomalyRows([])
    }

    if (insightResponse) {
      const metrics = insightResponse as InsightsResponse
      setInsights(metrics.insights ?? [])
    } else {
      setInsights([])
    }
  }

  function downloadFilteredData() {
    downloadCsv(combinedPreviewRows.length ? combinedPreviewRows : data, 'filtered_charger_data.csv')
  }

  function downloadFaultMetrics() {
    downloadCsv(
      [
        {
          Model: faultMetrics?.model ?? 'RandomForestClassifier',
          ROC_AUC: faultMetrics?.roc_auc ?? null,
          Accuracy: faultMetrics?.accuracy_pct ?? null,
          Rows_Used: faultMetrics?.train_size && faultMetrics?.test_size ? faultMetrics.train_size + faultMetrics.test_size : faultPredictions.length,
        },
      ],
      'fault_model_metrics.csv',
    )
  }

  function downloadInsights() {
    downloadCsv(insights, 'automated_insights.csv')
  }

  function downloadDictionary() {
    downloadCsv(dataDictionaryCsv(), 'charger_data_dictionary.csv')
  }

  const faultPlotData = useMemo(() => buildCategoryTraces(voltageCurrentRows, 'fault_type', 'voltage', 'current'), [voltageCurrentRows])
  const temperaturePlotData = useMemo(() => buildCategoryTraces(temperatureRows, 'fault_flag', 'timestamp', 'temperature', true), [temperatureRows])
  const anomalyPlotData = useMemo(() => buildAnomalyTraces(anomalyRows), [anomalyRows])
  const faultMetricsTableRow = faultMetrics
    ? {
        Model: faultMetrics.model ?? 'RandomForestClassifier',
        ROC_AUC: formatNumber(faultMetrics.roc_auc),
        Accuracy: formatPercent(faultMetrics.accuracy_pct),
        Rows_Used: formatNumber(faultMetrics.train_size && faultMetrics.test_size ? faultMetrics.train_size + faultMetrics.test_size : faultPredictions.length),
      }
    : null

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
            <span>EV</span>
            <span className="text-slate-300">•</span>
            <span>EV Charging Station Fault Detection Lab</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0F172A] md:text-5xl">EV Charging Station Fault Detection Lab</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
            Detect voltage instability, overcurrent, thermal overheating, and silent charger failures with fault classification, anomaly detection, and operational insights.
          </p>
        </div>

        {error ? <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-3">
            {([
              ['overview', 'Overview'],
              ['attributes', 'Important Attributes'],
              ['application', 'Application'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${tab === value ? 'bg-[#0F766E] text-white' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' ? (
          <div className="space-y-6">
            <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Problem</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Charging stations can fail silently before operators notice a serious fault.</h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">Traditional rule-based monitoring often misses thermal drift, voltage instability, and sessions that stay active while power delivery collapses.</p>
                </div>
                <div className="rounded-3xl border border-[#CCFBF1] bg-[#ECFDF5] px-5 py-4 text-[#0F766E] shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Live analytics theme</p>
                  <p className="mt-2 text-sm leading-6">Fault detection, anomaly scoring, and maintenance prioritization for EV charging assets.</p>
                </div>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => (
                <MetricCard key={card.label} icon={card.icon} label={card.label} value={card.value} accent={card.accent} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#0F766E]" />
                  <h3 className="text-lg font-bold text-[#0F172A]">What this system detects</h3>
                </div>
                <div className="space-y-3 text-[14px] leading-7 text-slate-700">
                  {['Voltage drop and instability', 'Overcurrent conditions', 'Thermal overheating', 'Session active but zero power delivery'].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Zap className="mt-1 h-4 w-4 shrink-0 text-[#0F766E]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-[#0F766E]" />
                  <h3 className="text-lg font-bold text-[#0F172A]">Business Impact</h3>
                </div>
                <div className="space-y-3 text-[14px] leading-7 text-slate-700">
                  {['Reduced charger downtime', 'Faster root cause isolation', 'Proactive maintenance planning', 'Improved driver trust and EV adoption'].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Gauge className="mt-1 h-4 w-4 shrink-0 text-[#F59E0B]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {tab === 'attributes' ? (
          <div className="space-y-6">
            <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <h2 className="text-3xl font-bold text-[#0F172A]">Required Data Dictionary</h2>
              <p className="mt-3 max-w-3xl text-slate-600">The backend expects these exact columns and the frontend download mirrors the same dictionary.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" onClick={downloadDictionary} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                  <Download className="mr-2 h-4 w-4" />
                  Download Data Dictionary
                </Button>
              </div>
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
                    {['voltage', 'current', 'temperature', 'power_kw', 'session_active'].map((field) => (
                      <span key={field} className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155]">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Dependent Variables</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['fault_flag', 'fault_type'].map((field) => (
                      <span key={field} className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155]">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {tab === 'application' ? (
          <div className="space-y-6">
            <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 1</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Load a dataset and start the fault workflow</h2>
                  <p className="mt-3 text-slate-600">Use the GitHub dataset for a ready-made demo or upload your own CSV. The rest of the workflow appears after data is loaded.</p>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    void handleUpload(file)
                  }}
                />
              </div>

              {!filterReady ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
                  Upload charger dataset Drag & Drop CSV Browse Files
                </div>
              ) : null}
            </section>

            {filterReady ? (
              <>
                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">STEP 2 — FILTERS & PREVIEW</p>
                      <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Use the filters below to narrow the charging dataset</h3>
                      <p className="mt-1 text-sm text-slate-500">Charger ID and Fault Type support multiple selections, and the active session toggle narrows the preview further.</p>
                    </div>
                    <Button type="button" onClick={applyFilters} disabled={loading || !data.length} className="rounded-2xl bg-[#0F766E] px-5 py-3 font-semibold text-white hover:bg-[#0D5F58]">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Apply filters
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    <MultiSelect label="Charger ID" options={chargerOptions.length ? chargerOptions : Array.from(new Set(data.map((row) => String(row.charger_id ?? '')))).filter(Boolean)} value={selectedChargerIds} onChange={setSelectedChargerIds} />
                    <MultiSelect label="Fault Type" options={faultTypeOptions.length ? faultTypeOptions : Array.from(new Set(data.map((row) => String(row.fault_type ?? '')))).filter(Boolean)} value={selectedFaultTypes} onChange={setSelectedFaultTypes} />
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Only Active Sessions</p>
                      <div className="mt-3 rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                        <CheckboxField label="session_active == 1" checked={activeOnly} onChange={setActiveOnly} />
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Scope</p>
                      <div className="mt-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-slate-700">Filtered Rows: {filteredCountText}</p>
                        <p className="mt-1 text-sm text-slate-500">Preview of the filtered result set, limited to the first 10 rows.</p>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <Button type="button" variant="outline" onClick={downloadFilteredData} className="rounded-2xl px-4 py-2.5">
                          <Download className="h-4 w-4" />
                          Download filtered data
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <DataTable rows={combinedPreviewRows} maxRows={10} />
                    </div>
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 3</p>
                      <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">KPI Cards</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={downloadFilteredData} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                        <Download className="mr-2 h-4 w-4" />
                        Download Filtered Data
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {kpis
                      ? [
                          { label: 'Records', value: formatNumber(kpis.records), icon: <Gauge className="h-5 w-5 text-[#0F766E]" />, accent: 'bg-[#ECFDF5]' },
                          { label: 'Fault Rate (%)', value: formatPercent(kpis.fault_rate_pct), icon: <ShieldAlert className="h-5 w-5 text-[#B45309]" />, accent: 'bg-[#FFFBEB]' },
                          { label: 'Avg Temp (C)', value: formatNumber(kpis.avg_temperature_c), icon: <Thermometer className="h-5 w-5 text-[#0369A1]" />, accent: 'bg-[#EFF6FF]' },
                          { label: 'Silent Failure (%)', value: formatPercent(kpis.silent_failure_pct), icon: <Zap className="h-5 w-5 text-[#7C3AED]" />, accent: 'bg-[#F5F3FF]' },
                        ].map((card) => <MetricCard key={card.label} icon={card.icon} label={card.label} value={card.value} accent={card.accent} />)
                      : null}
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 4</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Diagnostics</h3>
                  <div className="mt-6 space-y-8">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Chart 1 — Voltage vs Current</p>
                      <Plot
                        data={faultPlotData}
                        layout={{ template: 'plotly', paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', height: 500, xaxis: { title: 'voltage' }, yaxis: { title: 'current' }, legend: { orientation: 'v', x: 1.02, y: 1 } }}
                        style={{ width: '100%' }}
                        config={{ responsive: true, displaylogo: false }}
                      />
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Chart 2 — Temperature Over Time</p>
                      <Plot
                        data={temperaturePlotData}
                        layout={{ template: 'plotly', paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', height: 500, xaxis: { title: 'timestamp' }, yaxis: { title: 'temperature' }, legend: { orientation: 'v', x: 1.02, y: 1 } }}
                        style={{ width: '100%' }}
                        config={{ responsive: true, displaylogo: false }}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 5</p>
                      <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">ML - Fault Classification</h3>
                    </div>
                    <Button type="button" onClick={downloadFaultMetrics} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                      <Download className="mr-2 h-4 w-4" />
                      Download Model Metrics
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">This table is generated by the RandomForest fault-classifier response after the dataset is loaded or filtered.</p>
                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Model</TableHead>
                          <TableHead className="font-semibold text-slate-700">ROC_AUC</TableHead>
                          <TableHead className="font-semibold text-slate-700">Accuracy</TableHead>
                          <TableHead className="font-semibold text-slate-700">Rows_Used</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faultMetricsTableRow ? (
                          <TableRow>
                            <TableCell>{faultMetricsTableRow.Model}</TableCell>
                            <TableCell>{faultMetricsTableRow.ROC_AUC}</TableCell>
                            <TableCell>{faultMetricsTableRow.Accuracy}</TableCell>
                            <TableCell>{faultMetricsTableRow.Rows_Used}</TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                              Load the dataset to generate fault-classification metrics.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 6</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Anomaly Detection</h3>
                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Isolation Forest - Detected Anomalies</p>
                    <Plot
                      data={anomalyPlotData}
                      layout={{ template: 'plotly', paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', height: 500, xaxis: { title: 'temperature' }, yaxis: { title: 'power_kw' }, legend: { orientation: 'v', x: 1.02, y: 1 } }}
                      style={{ width: '100%' }}
                      config={{ responsive: true, displaylogo: false }}
                    />
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Step 7</p>
                      <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Automated Insights</h3>
                    </div>
                    <Button type="button" onClick={downloadInsights} variant="outline" className="rounded-2xl px-5 py-3 font-semibold">
                      <Download className="mr-2 h-4 w-4" />
                      Download Insights
                    </Button>
                  </div>
                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          {['Insight', 'Value'].map((column) => (
                            <TableHead key={column} className="font-semibold text-slate-700">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.Insight}</TableCell>
                            <TableCell>{row.Value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default EvChargingStationFaultDetectionLabProjectPage
