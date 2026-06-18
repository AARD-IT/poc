import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import Plot from 'react-plotly.js'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Download, FileUp, Loader2, Sparkles, Thermometer, Gauge, Activity, ShieldAlert, SunMedium } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Slider } from '@/app/components/ui/slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'

const API_BASE_URL =
  import.meta.env.VITE_PV_PANEL_DEGRADATION_INTELLIGENCE_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8016'

const REQUIRED_FIELDS = [
  'panel_id',
  'string_id',
  'timestamp',
  'irradiation_wm2',
  'temperature_c',
  'panel_voltage_v',
  'panel_current_a',
  'panel_efficiency_pct',
  'baseline_efficiency_pct',
  'degradation_pct',
  'performance_ratio',
  'soiling_factor_pct',
  'shading_loss_pct',
  'module_age_years',
  'installation_angle_deg',
  'panel_serial_number',
  'manufacturer',
  'underperformance_flag',
  'hotspot_detected_flag',
  'last_cleaned_date',
  'region',
]

const FIELD_LABELS: Record<string, string> = {
  panel_id: 'Panel identifier',
  string_id: 'String identifier',
  timestamp: 'Telemetry timestamp',
  irradiation_wm2: 'Irradiation',
  temperature_c: 'Panel temperature',
  panel_voltage_v: 'Panel voltage',
  panel_current_a: 'Panel current',
  panel_efficiency_pct: 'Panel efficiency',
  baseline_efficiency_pct: 'Baseline efficiency',
  degradation_pct: 'Degradation percentage',
  performance_ratio: 'Performance ratio',
  soiling_factor_pct: 'Soiling factor',
  shading_loss_pct: 'Shading loss',
  module_age_years: 'Module age',
  installation_angle_deg: 'Installation angle',
  panel_serial_number: 'Panel serial number',
  manufacturer: 'Manufacturer',
  underperformance_flag: 'Underperformance flag',
  hotspot_detected_flag: 'Hotspot flag',
  last_cleaned_date: 'Last cleaned date',
  region: 'Region',
}

const DEFAULT_DATASET_COLUMNS = REQUIRED_FIELDS
const INSIGHT_COLUMNS = ['Insight', 'Entity', 'Metric', 'Action']

const INITIAL_MIN_AGE = 0
const INITIAL_MAX_AGE = 14

const SAMPLE_ROWS = [
  {
    panel_id: 'PV_001',
    string_id: 'STR_01',
    timestamp: '2026-06-01 08:00:00',
    irradiation_wm2: 820,
    temperature_c: 31.5,
    panel_voltage_v: 38.2,
    panel_current_a: 10.4,
    panel_efficiency_pct: 18.2,
    baseline_efficiency_pct: 19.1,
    degradation_pct: 0.92,
    performance_ratio: 0.81,
    soiling_factor_pct: 3.2,
    shading_loss_pct: 1.1,
    module_age_years: 4,
    installation_angle_deg: 27,
    panel_serial_number: 'SN-PV-001',
    manufacturer: 'SolarEdge',
    underperformance_flag: 0,
    hotspot_detected_flag: 0,
    last_cleaned_date: '2026-05-15',
    region: 'North',
  },
  {
    panel_id: 'PV_087',
    string_id: 'STR_14',
    timestamp: '2026-06-01 08:15:00',
    irradiation_wm2: 780,
    temperature_c: 39.8,
    panel_voltage_v: 36.9,
    panel_current_a: 9.8,
    panel_efficiency_pct: 16.7,
    baseline_efficiency_pct: 18.8,
    degradation_pct: 2.11,
    performance_ratio: 0.73,
    soiling_factor_pct: 8.4,
    shading_loss_pct: 3.9,
    module_age_years: 9,
    installation_angle_deg: 29,
    panel_serial_number: 'SN-PV-087',
    manufacturer: 'SunPower',
    underperformance_flag: 1,
    hotspot_detected_flag: 1,
    last_cleaned_date: '2026-04-22',
    region: 'West',
  },
]

type DatasetMode = 'default' | 'upload' | 'mapping'
type Row = Record<string, unknown>
type InsightRow = { Insight: string; Entity: string; Metric: string; Action: string }

type Kpis = {
  total_rows: number
  avg_degradation_pct: number | null
  avg_performance_ratio: number | null
  underperforming_share_pct: number | null
  hotspot_share_pct: number | null
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

function downloadRows(rows: Record<string, unknown>[], filename: string) {
  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
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
        <div className="flex flex-wrap gap-2">
          {selected.length ? (
            selected.map((item) => (
              <span key={item} className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-semibold text-[#0F766E]">
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">Choose an option</span>
          )}
        </div>
      </div>
      <div className="max-h-48 overflow-auto space-y-2 pr-1">
        {options.length ? (
          options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${selected.includes(option) ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              {option}
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-400">No options yet</div>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
      <h4 className="mb-3 text-lg font-semibold text-[#0F172A]">{title}</h4>
      {children}
    </div>
  )
}

function MappingRow({ field, columns, value, onChange }: { field: string; columns: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[220px_1fr] md:items-center">
      <div>
        <p className="text-sm font-semibold text-slate-800">{field}</p>
        <p className="mt-1 text-xs text-slate-500">{FIELD_LABELS[field]}</p>
      </div>
      <Select value={value || '__unmapped__'} onValueChange={(next) => onChange(next === '__unmapped__' ? '' : next)}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder={`Map ${field}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unmapped__">-- Select --</SelectItem>
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

export function PVPanelDegradationIntelligenceLabProjectPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<DatasetMode>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [mlMessage, setMlMessage] = useState<string | null>(null)
  const [data, setData] = useState<Row[]>([])
  const [filteredData, setFilteredData] = useState<Row[]>([])
  const [defaultPreviewRows, setDefaultPreviewRows] = useState<Row[]>([])
  const [filteredPreviewRows, setFilteredPreviewRows] = useState<Row[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([])
  const [ageRange, setAgeRange] = useState<[number, number]>([INITIAL_MIN_AGE, INITIAL_MAX_AGE])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [charts, setCharts] = useState<any>({})
  const [mlResult, setMlResult] = useState<any>(null)
  const [insights, setInsights] = useState<InsightRow[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const filteredCountText = `${filteredData.length} of ${data.length || filteredData.length}`

  const degradationRows = (charts.degradation_histogram ?? []) as Row[]
  const regionRows = (charts.region_avg_degradation ?? []) as Row[]
  const efficiencyRows = (charts.efficiency_scatter ?? []) as Row[]
  const ageRows = (charts.age_vs_degradation ?? []) as Row[]

  useEffect(() => {
    void loadDefault()
  }, [])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    setUploadFile(null)
    setStatusMessage(null)
    setMlMessage(null)
    setSelectedRegions([])
    setSelectedManufacturers([])
    setAgeRange([INITIAL_MIN_AGE, INITIAL_MAX_AGE])

    try {
      const res = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      const rows = res.data ?? []
      setData(rows)
      setFilteredData(rows)
      setDefaultPreviewRows(res.preview ?? rows.slice(0, 10))
      setFilteredPreviewRows(res.preview ?? rows.slice(0, 20))
      setRegions((res.regions ?? []).map(String))
      setManufacturers((res.manufacturers ?? []).map(String))
      setAgeRange([Number(res.age_min ?? INITIAL_MIN_AGE), Number(res.age_max ?? INITIAL_MAX_AGE)])
      setStatusMessage(res.warning ? String(res.warning) : 'Default PV degradation dataset loaded from GitHub.')
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
      setMlMessage(null)
      setInsights([])
      return
    }

    try {
      const filterResponse = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          regions: selectedRegions.length ? selectedRegions : undefined,
          manufacturers: selectedManufacturers.length ? selectedManufacturers : undefined,
          age_min: ageRange[0],
          age_max: ageRange[1],
        }),
      }).then(handleResponse)

      const filteredRows = filterResponse.data ?? rows
      setFilteredData(filteredRows)
      setFilteredPreviewRows(filterResponse.preview ?? filteredRows.slice(0, 20))
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

    if (rows.length < 80 || rows.filter((row) => row.degradation_pct !== undefined && row.degradation_pct !== null).length < 80) {
      setMlResult(null)
      setMlMessage('Not enough rows or features')
    } else {
      try {
        const mlResponse = await fetch(`${API_BASE_URL}/ml/predict-degradation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: rows }),
        }).then(handleResponse)
        setMlResult(mlResponse)
        setMlMessage(null)
      } catch (err: any) {
        console.error(err)
        setMlResult(null)
        setMlMessage(err?.message ?? 'ML training failed.')
      }
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

  async function handleUpload(file: File) {
    setUploadFile(file)
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadResponse = await fetch(`${API_BASE_URL}/upload-csv`, { method: 'POST', body: formData }).then(handleResponse)
      const rows = uploadResponse.data ?? []
      setData(rows)
      setFilteredData(rows)
      setDefaultPreviewRows(uploadResponse.preview ?? rows.slice(0, 10))
      setFilteredPreviewRows(uploadResponse.preview ?? rows.slice(0, 20))
      setRegions((uploadResponse.regions ?? []).map(String))
      setManufacturers((uploadResponse.manufacturers ?? []).map(String))
      setSelectedRegions([])
      setSelectedManufacturers([])

      if (mode === 'upload') {
        setStatusMessage(uploadResponse.warning ? String(uploadResponse.warning) : 'CSV uploaded successfully.')
        await analyzeRows(rows)
      } else {
        try {
          const columnsResponse = await fetch(`${API_BASE_URL}/get-columns`, {
            method: 'POST',
            body: formData,
          }).then(handleResponse)
          setFileColumns((columnsResponse.columns ?? []).map(String))
        } catch (columnsError) {
          console.error(columnsError)
          setFileColumns((uploadResponse.columns ?? []).map(String))
        }
        setStatusMessage(uploadResponse.warning ? String(uploadResponse.warning) : 'CSV uploaded. Map columns to continue.')
        setKpis(null)
        setCharts({})
        setMlResult(null)
        setMlMessage(null)
        setInsights([])
      }
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
      setFilteredPreviewRows(response.preview ?? rows.slice(0, 20))
      setRegions((response.regions ?? []).map(String))
      setManufacturers((response.manufacturers ?? []).map(String))
      setSelectedRegions([])
      setSelectedManufacturers([])
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

  const dataForTopTable = filteredPreviewRows.length ? filteredPreviewRows : defaultPreviewRows.length ? defaultPreviewRows : data.slice(0, 20)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
            <span>Solar Power</span>
            <span className="text-slate-300">•</span>
            <span>PV Panel Degradation Intelligence Lab</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0F172A] md:text-5xl">PV Panel Degradation Intelligence Lab</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
            Track degradation, efficiency loss, soiling and shading impact, and hotspot risk across PV panels with a filterable dashboard and predictive analytics workflow.
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Why This Lab Exists</p>
                    <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Panel degradation intelligence for utility and rooftop PV fleets</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      Utility-scale and rooftop PV plants gradually lose efficiency due to degradation, soiling, hotspots, shading, and temperature stress. This lab provides a panel-level cockpit to identify aging strings, underperforming regions, cleaning effectiveness, irradiation impact, and thermal stress patterns.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[#CCFBF1] bg-[#ECFDF5] px-5 py-4 text-[#0F766E] shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Who should use this</p>
                    <p className="mt-2 text-sm leading-6">Solar O&M teams, reliability engineers, asset managers, and performance analysts.</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={<SunMedium className="h-5 w-5 text-[#0F766E]" />} label="Avg degradation_pct" value="Display only" accent="bg-[#ECFDF5]" />
                <MetricCard icon={<Gauge className="h-5 w-5 text-[#0369A1]" />} label="Share of underperforming panels" value="Display only" accent="bg-[#EFF6FF]" />
                <MetricCard icon={<ShieldAlert className="h-5 w-5 text-[#DC2626]" />} label="Hotspot-affected share" value="Display only" accent="bg-[#FEF2F2]" />
                <MetricCard icon={<Activity className="h-5 w-5 text-[#7C3AED]" />} label="Region-wise performance_ratio spread" value="Display only" accent="bg-[#F5F3FF]" />
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-3xl font-bold text-[#0F172A]">Required Column Data Dictionary</h2>
                <p className="mt-3 max-w-3xl text-slate-600">Uploaded files are validated against the 21 required PV degradation columns before analytics runs.</p>
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
                  <p className="mt-2 text-sm text-slate-500">Features used by the degradation regressor.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['irradiation_wm2', 'temperature_c', 'panel_voltage_v', 'panel_current_a', 'performance_ratio', 'soiling_factor_pct', 'shading_loss_pct', 'module_age_years', 'installation_angle_deg', 'region', 'manufacturer', 'timestamp', 'last_cleaned_date'].map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <h3 className="text-2xl font-bold text-[#0F172A]">Dependent Variables</h3>
                  <p className="mt-2 text-sm text-slate-500">Targets and labels used for degradation monitoring and screening.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['degradation_pct', 'panel_efficiency_pct', 'performance_ratio', 'underperformance_flag', 'hotspot_detected_flag'].map((item) => (
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
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    { value: 'default', title: 'Default Dataset', description: 'Automatically load the GitHub PV degradation dataset.' },
                    { value: 'upload', title: 'Upload CSV', description: 'Upload your own CSV and analyze it immediately.' },
                    { value: 'mapping', title: 'Upload CSV + Column Mapping', description: 'Upload a file and manually map the 21 required columns.' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value as DatasetMode)}
                      className={`rounded-3xl border p-5 text-left transition ${mode === option.value ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <p className="text-lg font-semibold text-[#0F172A]">{option.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">{error}</div>}
              {statusMessage && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">{statusMessage}</div>}

              <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Step 1</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">{mode === 'mapping' ? 'Upload CSV to map' : mode === 'upload' ? 'Upload CSV file' : 'Load Default Dataset'}</h3>
                    <p className="mt-2 text-slate-600">{mode === 'default' ? 'Dataset loads automatically from GitHub RAW.' : 'Drag and drop file here or use the browse button. Limit 200MB per file • CSV'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant={mode === 'default' ? 'default' : 'outline'} onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="h-4 w-4" />
                      Browse CSV
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => void loadDefault()}>
                      Reload Default Data
                    </Button>
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileInputChange} />

                {mode === 'upload' && !uploadFile && (
                  <div className="mt-6 space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Sample Structure</p>
                        <h4 className="mt-2 text-xl font-bold text-[#0F172A]">Required PV degradation schema</h4>
                        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="font-semibold text-slate-700">Column</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {REQUIRED_FIELDS.map((field) => (
                                  <TableRow key={field}>
                                    <TableCell className="font-semibold text-[#0F172A]">{field}</TableCell>
                                    <TableCell className="text-slate-600">{field === 'panel_id' || field === 'string_id' || field === 'timestamp' || field === 'manufacturer' || field === 'region' || field === 'last_cleaned_date' ? 'Text' : 'Numeric / Flag'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Sample Dataset</p>
                        <h4 className="mt-2 text-xl font-bold text-[#0F172A]">Preview rows you can download</h4>
                        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                          <div className="overflow-x-auto">
                            <DataTable rows={SAMPLE_ROWS} maxRows={2} />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button type="button" variant="outline" onClick={() => downloadRows(SAMPLE_ROWS, 'pv_degradation_sample.csv')}>
                            <Download className="h-4 w-4" />
                            Download Sample CSV
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-[#0F766E] hover:bg-[#F8FBFF]"
                    >
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="rounded-full bg-[#ECFDF5] p-4 text-[#0F766E]">
                          <FileUp className="h-8 w-8" />
                        </div>
                        <h4 className="mt-4 text-xl font-bold text-[#0F172A]">Drag and drop file here</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Limit 200MB per file • CSV</p>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'mapping' && !uploadFile && (
                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-10 text-center">
                    <h4 className="text-xl font-bold text-[#0F172A]">Upload CSV to map</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Drop your file here or browse from your device to start column mapping.</p>
                    <div className="mt-5 flex justify-center gap-3">
                      <Button type="button" onClick={() => fileInputRef.current?.click()}>
                        <FileUp className="h-4 w-4" />
                        Browse CSV
                      </Button>
                    </div>
                  </div>
                )}

                {mode === 'default' && !loading && data.length > 0 && (
                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Default dataset loaded from GitHub</p>
                        <p className="text-sm text-slate-500">Columns: {DEFAULT_DATASET_COLUMNS.join(' • ')}</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => downloadRows(data, 'pv_degradation_default_dataset.csv')}>
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

                {(mode === 'upload' || mode === 'mapping') && uploadFile && (
                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Uploaded file</p>
                        <p className="text-sm text-slate-500">{uploadFile.name}</p>
                      </div>
                      {mode === 'upload' ? (
                        <Button type="button" variant="outline" onClick={() => downloadRows(data, 'pv_uploaded_preview.csv')}>
                          <Download className="h-4 w-4" />
                          Download Preview
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <DataTable rows={dataForTopTable} />
                      </div>
                    </div>
                  </div>
                )}

                {loading && <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Processing data...</div>}
              </section>

              {mode === 'mapping' && uploadFile && (
                <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Step 2</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Preview and map columns</h3>
                  <p className="mt-2 text-slate-600">Map the uploaded CSV headers to the required PV degradation fields.</p>

                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="overflow-x-auto">
                      <DataTable rows={defaultPreviewRows} maxRows={5} />
                    </div>
                  </div>

                  {fileColumns.length > 0 ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                      {REQUIRED_FIELDS.map((field) => (
                        <MappingRow key={field} field={field} columns={fileColumns} value={mapping[field] ?? ''} onChange={(value) => setMapping((prev) => ({ ...prev, [field]: value }))} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      Reading uploaded columns for mapping...
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={() => void applyMapping()} variant="default">
                      Apply Mapping
                    </Button>
                    <p className="text-sm text-slate-500">This validates the uploaded file against the required PV schema.</p>
                  </div>
                </section>
              )}

              {data.length > 0 && (
                <>
                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">STEP 2 — FILTERS & PREVIEW</h3>
                        <p className="mt-1 text-sm text-slate-500">Use the filters below to narrow the PV dataset and preview the result.</p>
                      </div>
                      <Button type="button" variant="default" onClick={() => void analyzeRows(data)}>
                        Apply filters
                      </Button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
                      <FilterSelector label="Region" options={regions} selected={selectedRegions} onToggle={(value) => setSelectedRegions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} />
                      <FilterSelector label="Manufacturer" options={manufacturers} selected={selectedManufacturers} onToggle={(value) => setSelectedManufacturers((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} />
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Module Age</p>
                        <div className="mt-3 rounded-[16px] border border-slate-200 bg-white px-4 py-5">
                          <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                            <span>{ageRange[0]} years</span>
                            <span>{ageRange[1]} years</span>
                          </div>
                          <Slider min={0} max={14} step={1} value={ageRange} onValueChange={(value) => setAgeRange([value[0], value[1]])} />
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Scope</p>
                        <div className="mt-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                          <p className="text-sm font-semibold text-slate-700">Filtered Rows: {filteredCountText}</p>
                          <p className="mt-1 text-sm text-slate-500">Preview of the filtered result set, limited to the first 20 rows.</p>
                        </div>
                        <div className="mt-3 flex gap-3">
                          <Button type="button" variant="outline" onClick={() => downloadRows(filteredData.slice(0, 200), 'pv_degradation_filtered_sample.csv')}>
                            <Download className="h-4 w-4" />
                            Download filtered sample
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <DataTable rows={filteredPreviewRows} maxRows={20} />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <h3 className="text-xl font-semibold text-slate-900">Degradation KPIs</h3>
                    <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                      <MetricCard icon={<Sparkles className="h-5 w-5 text-[#0F766E]" />} label="Avg degradation_pct" value={kpis ? formatPercent(kpis.avg_degradation_pct) : '—'} accent="bg-[#ECFDF5]" />
                      <MetricCard icon={<Gauge className="h-5 w-5 text-[#0369A1]" />} label="Avg performance_ratio" value={kpis ? formatMetric(kpis.avg_performance_ratio, 3) : '—'} accent="bg-[#EFF6FF]" />
                      <MetricCard icon={<Activity className="h-5 w-5 text-[#DC2626]" />} label="Underperforming Share" value={kpis ? formatPercent(kpis.underperforming_share_pct) : '—'} accent="bg-[#FEF2F2]" />
                      <MetricCard icon={<ShieldAlert className="h-5 w-5 text-[#7C3AED]" />} label="Hotspot-affected Share" value={kpis ? formatPercent(kpis.hotspot_share_pct) : '—'} accent="bg-[#F5F3FF]" />
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E]">Charts & Diagnostics</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#0F172A]">Plotly charts for PV degradation</h3>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6">
                      <ChartCard title="Distribution of degradation_pct">
                        <Plot
                          data={[
                            {
                              x: degradationRows.map((row) => Number(row.bin_start ?? 0)),
                              y: degradationRows.map((row) => Number(row.count ?? 0)),
                              type: 'bar',
                              name: 'Count',
                              marker: { color: '#0F766E' },
                            },
                          ]}
                          layout={{
                            title: 'Distribution of degradation_pct',
                            autosize: true,
                            height: 520,
                            margin: { l: 60, r: 24, t: 50, b: 80 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'degradation_pct', gridcolor: '#E2E8F0' },
                            yaxis: { title: 'count', gridcolor: '#E2E8F0' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </ChartCard>

                      <ChartCard title="Average degradation_pct by Region">
                        <Plot
                          data={[
                            {
                              x: regionRows.map((row) => String(row.region ?? '')),
                              y: regionRows.map((row) => Number(row.degradation_pct ?? 0)),
                              type: 'bar',
                              name: 'Avg degradation_pct',
                              text: regionRows.map((row) => formatMetric(Number(row.degradation_pct ?? 0), 2)),
                              textposition: 'auto',
                              marker: { color: '#0369A1' },
                            },
                          ]}
                          layout={{
                            title: 'Average degradation_pct by Region',
                            autosize: true,
                            height: 520,
                            margin: { l: 60, r: 24, t: 50, b: 100 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'region', tickangle: -25, gridcolor: '#E2E8F0' },
                            yaxis: { title: 'degradation_pct', gridcolor: '#E2E8F0' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </ChartCard>

                      <ChartCard title="Actual vs Baseline Efficiency">
                        <Plot
                          data={[
                            {
                              x: efficiencyRows.map((row) => Number(row.baseline_efficiency_pct ?? 0)),
                              y: efficiencyRows.map((row) => Number(row.panel_efficiency_pct ?? 0)),
                              type: 'scatter',
                              mode: 'markers',
                              name: 'Panels',
                              marker: { color: '#0F766E', size: 9 },
                            },
                          ]}
                          layout={{
                            title: 'Actual vs Baseline Efficiency',
                            autosize: true,
                            height: 520,
                            margin: { l: 60, r: 24, t: 50, b: 50 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'baseline_efficiency_pct', gridcolor: '#E2E8F0' },
                            yaxis: { title: 'panel_efficiency_pct', gridcolor: '#E2E8F0' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </ChartCard>

                      <ChartCard title="degradation_pct vs module_age_years by region">
                        <Plot
                          data={Array.from(new Set(ageRows.map((row) => String(row.region ?? 'Unknown')))).map((region) => {
                            const regionData = ageRows.filter((row) => String(row.region ?? 'Unknown') === region)
                            return {
                              x: regionData.map((row) => Number(row.module_age_years ?? 0)),
                              y: regionData.map((row) => Number(row.degradation_pct ?? 0)),
                              type: 'scatter',
                              mode: 'markers',
                              name: region,
                              marker: { size: 8 },
                            }
                          })}
                          layout={{
                            title: 'degradation_pct vs module_age_years by region',
                            autosize: true,
                            height: 520,
                            margin: { l: 60, r: 24, t: 50, b: 60 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            xaxis: { title: 'module_age_years', gridcolor: '#E2E8F0' },
                            yaxis: { title: 'degradation_pct', gridcolor: '#E2E8F0' },
                            legend: { orientation: 'h' },
                          }}
                          style={{ width: '100%' }}
                          config={{ displayModeBar: false, responsive: true }}
                        />
                      </ChartCard>
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
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Degradation model diagnostics</p>
                          <p className="mt-1 text-base text-slate-600">The backend trains a RandomForestRegressor to predict degradation_pct and reports RMSE and R².</p>
                        </div>
                      </div>

                      {mlMessage && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm">{mlMessage}</div>}

                      <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Rows</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.train_size && mlResult?.test_size ? mlResult.train_size + mlResult.test_size : filteredData.length}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">RMSE</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.rmse ?? '—'}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">R²</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.r2 ?? '—'}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Test Size</p><p className="mt-2 text-xl font-bold text-[#0F172A]">{mlResult?.test_size ?? '—'}</p></div>
                      </div>

                      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="bg-slate-50">Actual_degradation_pct</TableHead>
                                <TableHead className="bg-slate-50">Predicted_degradation_pct</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(mlResult?.predictions ?? []).length ? (
                                mlResult.predictions.map((row: Row, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{formatCell(row.Actual_degradation_pct)}</TableCell>
                                    <TableCell>{formatCell(row.Predicted_degradation_pct)}</TableCell>
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
                        <Button type="button" variant="outline" onClick={() => downloadRows(mlResult?.predictions ?? [], 'pv_degradation_predictions.csv')}>
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
                      <Button type="button" variant="outline" onClick={() => downloadRows(insights, 'pv_degradation_insights.csv')}>
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
                                <TableCell className="whitespace-normal text-slate-700">{row.Insight}</TableCell>
                                <TableCell className="whitespace-normal text-slate-700">{row.Entity}</TableCell>
                                <TableCell className="whitespace-normal text-slate-700">{row.Metric}</TableCell>
                                <TableCell className="whitespace-normal text-slate-700">{row.Action}</TableCell>
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
