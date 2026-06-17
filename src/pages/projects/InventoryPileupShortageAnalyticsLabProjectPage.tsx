import { useEffect, useMemo, useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import Plot from 'react-plotly.js'

const API_BASE_URL =
  import.meta.env.VITE_INVENTORY_PILEUP_SHORTAGE_API_URL ||
  import.meta.env.VITE_INVENTORY_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8022'

const REQUIRED_FIELDS = [
  'SKU',
  'Date',
  'Daily_Demand',
  'Predicted_Demand',
  'Forecast_Error',
  'Production_Qty',
  'Production_Delay_Hrs',
  'Procurement_Qty',
  'Procurement_Delay_Hrs',
  'Inventory_Level',
  'Safety_Stock',
  'Stock_Turnover',
  'Lead_Time_Days',
  'Backorder_Qty',
  'Wastage_Qty',
  'Shortage_Flag',
  'Pileup_Flag',
]

const QUERY_PARAM_MAP: Record<string, string> = {
  SKU: 'sku',
  Date: 'date',
  Daily_Demand: 'daily_demand',
  Predicted_Demand: 'predicted_demand',
  Forecast_Error: 'forecast_error',
  Production_Qty: 'production_qty',
  Production_Delay_Hrs: 'production_delay_hrs',
  Procurement_Qty: 'procurement_qty',
  Procurement_Delay_Hrs: 'procurement_delay_hrs',
  Inventory_Level: 'inventory_level',
  Safety_Stock: 'safety_stock',
  Stock_Turnover: 'stock_turnover',
  Lead_Time_Days: 'lead_time_days',
  Backorder_Qty: 'backorder_qty',
  Wastage_Qty: 'wastage_qty',
  Shortage_Flag: 'shortage_flag',
  Pileup_Flag: 'pileup_flag',
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
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(4)
  return String(value)
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}`
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

export function InventoryPileupShortageAnalyticsLabProjectPage() {
  const [mode, setMode] = useState<'default' | 'upload' | 'mapping'>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [datasetPreviewRows, setDatasetPreviewRows] = useState<any[]>([])
  const [skus, setSkus] = useState<string[]>([])
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [dateStart, setDateStart] = useState<string>('')
  const [dateEnd, setDateEnd] = useState<string>('')

  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>({})
  const [mlResult, setMlResult] = useState<any>(null)
  const [simulator, setSimulator] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [simulatorParams, setSimulatorParams] = useState<Record<string, number>>({
    demPct: 0,
    prodPct: 0,
    procPct: 0,
    ssPct: 0,
    ltPct: 0,
  })

  const dataPreview = useMemo(() => {
    if (filtered.length) return filtered.slice(0, 10)
    if (previewRows.length) return previewRows.slice(0, 10)
    return data.slice(0, 10)
  }, [filtered, previewRows, data])

  const tableColumns = useMemo(() => {
    const sample = dataPreview[0] ?? previewRows[0] ?? data[0] ?? {}
    return Object.keys(sample)
  }, [dataPreview, previewRows, data])

  const datasetPreviewColumns = useMemo(() => {
    const sample = datasetPreviewRows[0] ?? data[0] ?? {}
    return Object.keys(sample)
  }, [datasetPreviewRows, data])

  const predictionRows = useMemo(() => {
    const sourceRows = mlResult?.predictions ?? []
    const baseRows = filtered.length ? filtered : data

    return sourceRows.slice(0, 15).map((row: any, index: number) => {
      const source = baseRows[index] ?? {}

      return {
        sku: source.SKU ?? source.sku ?? '',
        date: source.Date ?? source.date ?? '',
        lead_time_days: row.Actual_Lead_Time_Days ?? row.lead_time_days ?? row.Lead_Time_Days ?? row.actual_lead_time_days ?? null,
        predicted_lead_time_days: row.Predicted_Lead_Time_Days ?? row.predicted_lead_time_days ?? row.predicted_lead_time ?? null,
      }
    })
  }, [mlResult, filtered, data])

  useEffect(() => {
    void loadDefault()
  }, [])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data, selectedSkus, dateStart, dateEnd)
  }, [data, selectedSkus, dateStart, dateEnd])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    setSelectedSkus([])
    setDateStart('')
    setDateEnd('')

    try {
      const res = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setDatasetPreviewRows(res.preview ?? [])
      setSkus((res.skus ?? []).map(String))
      setStatusMessage('Default dataset loaded successfully from GitHub URL.')
      await analyzeRows(res.data ?? [], [], '', '')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function analyzeRows(rows: any[], skusToUse = selectedSkus, start = dateStart, end = dateEnd) {
    if (!rows.length) {
      setFiltered([])
      setPreviewRows([])
      setKpis(null)
      setCharts({})
      setMlResult(null)
      setSimulator(null)
      setInsights([])
      return
    }

    try {
      const filterRes = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          skus: skusToUse.length ? skusToUse : undefined,
          date_start: start || undefined,
          date_end: end || undefined,
        }),
      }).then(handleResponse)

      const filteredRows = filterRes.data ?? rows
      setFiltered(filteredRows)
      setPreviewRows(filterRes.preview ?? [])
      setKpis(filterRes.kpis ?? null)
      rows = filteredRows
    } catch (err) {
      console.error(err)
    }

    try {
      const chartRes = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setCharts(chartRes)
    } catch (err) {
      console.error(err)
      setCharts({})
    }

    try {
      const mlRes = await fetch(`${API_BASE_URL}/ml/automl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setMlResult(mlRes)
    } catch (err) {
      console.error(err)
      setMlResult(null)
    }

    try {
      const simRes = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          dem_pct: simulatorParams.demPct,
          prod_pct: simulatorParams.prodPct,
          proc_pct: simulatorParams.procPct,
          ss_pct: simulatorParams.ssPct,
          lt_pct: simulatorParams.ltPct,
        }),
      }).then(handleResponse)
      setSimulator(simRes)
    } catch (err) {
      console.error(err)
      setSimulator(null)
    }

    try {
      const insightRes = await fetch(`${API_BASE_URL}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setInsights(insightRes.insights ?? [])
    } catch (err) {
      console.error(err)
      setInsights([])
    }
  }

  async function applyFilters() {
    setError(null)
    setLoading(true)
    try {
      await analyzeRows(data, selectedSkus, dateStart, dateEnd)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File) {
    setUploadFile(file)
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch(`${API_BASE_URL}/upload-csv`, { method: 'POST', body: formData }).then(handleResponse)
      setData(uploadRes.data ?? [])
      setFiltered(uploadRes.data ?? [])
      setPreviewRows(uploadRes.preview ?? [])
      setDatasetPreviewRows(uploadRes.preview ?? [])
      setSkus((uploadRes.skus ?? []).map(String))
      setSelectedSkus([])
      setDateStart('')
      setDateEnd('')
      setMode('upload')
      setStatusMessage('CSV uploaded successfully. Review the preview and map columns if needed.')
      await analyzeRows(uploadRes.data ?? [], [], '', '')
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGetColumns(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE_URL}/get-columns`, { method: 'POST', body: formData }).then(handleResponse)
    setFileColumns(res.columns ?? [])
    setMapping(Object.fromEntries((res.required_cols ?? REQUIRED_FIELDS).map((field: string) => [field, ''])))
    setMode('mapping')
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
        params.set(QUERY_PARAM_MAP[field] ?? field.toLowerCase(), mapping[field] ?? '')
      }
      const res = await fetch(`${API_BASE_URL}/apply-mapping?${params.toString()}`, { method: 'POST', body: formData }).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setDatasetPreviewRows(res.preview ?? [])
      setStatusMessage('Mapping applied successfully. Review the transformed dataset below.')
      await analyzeRows(res.data ?? [], [], '', '')
    } catch (err: any) {
      setError(err?.message ?? 'Mapping failed.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadRows(rows: any[], filename: string) {
    const res = await fetch(`${API_BASE_URL}/download-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: rows }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      throw new Error(errorData?.detail || 'Download failed')
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  function renderChartPanel() {
    return (
      <div className="grid gap-6 grid-cols-1">
        <section className="aa-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Inventory Level over Time</h3>
          <div className="mt-4 h-[430px] rounded-2xl bg-slate-50 p-2">
            {charts.inventory_over_time?.length ? (
              <Plot
                data={(() => {
                  const records = charts.inventory_over_time ?? []
                  const grouped = new Map<string, Array<{ x: string; y: number }>>()
                  for (const record of records) {
                    const sku = String(record.SKU ?? 'Unknown')
                    const entry = { x: String(record.Date ?? ''), y: Number(record.Inventory_Level ?? 0) }
                    const existing = grouped.get(sku) ?? []
                    existing.push(entry)
                    grouped.set(sku, existing)
                  }
                  return Array.from(grouped.entries()).map(([name, values], index) => ({
                    x: values.map((item) => item.x),
                    y: values.map((item) => item.y),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name,
                    line: { color: ['#0F766E', '#2563EB', '#F59E0B', '#DC2626', '#7C3AED'][index % 5] },
                  }))
                })()}
                layout={{ margin: { t: 20, r: 20, b: 40, l: 40 }, xaxis: { title: 'Date' }, yaxis: { title: 'Inventory Level' } }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No inventory trend data yet.</div>
            )}
          </div>
        </section>

        <section className="aa-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Demand vs Production</h3>
          <div className="mt-4 h-[430px] rounded-2xl bg-slate-50 p-2">
            {charts.demand_vs_production?.length ? (
              <Plot
                data={[
                  {
                    x: (charts.demand_vs_production ?? []).map((item: any) => item.Date),
                    y: (charts.demand_vs_production ?? []).map((item: any) => item.Total_Demand ?? 0),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Total Demand',
                    line: { color: '#0F766E' },
                  },
                  {
                    x: (charts.demand_vs_production ?? []).map((item: any) => item.Date),
                    y: (charts.demand_vs_production ?? []).map((item: any) => item.Total_Production ?? 0),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Total Production',
                    line: { color: '#2563EB' },
                  },
                ]}
                layout={{ margin: { t: 20, r: 20, b: 40, l: 40 }, xaxis: { title: 'Date' }, yaxis: { title: 'Quantity' } }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No demand and production trend data yet.</div>
            )}
          </div>
        </section>

        <section className="aa-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Safety Stock Breach Heatmap</h3>
          <div className="mt-4 h-[430px] rounded-2xl bg-slate-50 p-2">
            {charts.safety_stock_breach?.length ? (() => {
              const records = charts.safety_stock_breach ?? []
              const skus = Array.from(new Set(records.map((item: any) => String(item.SKU ?? 'Unknown'))))
              const dates = Array.from(new Set(records.map((item: any) => String(item.Date_only ?? ''))))
              const z = skus.map((sku) => dates.map((date) => {
                const match = records.find((item: any) => String(item.SKU ?? 'Unknown') === sku && String(item.Date_only ?? '') === date)
                return match ? Number(match.Breach ?? 0) : 0
              }))
              return (
                <Plot
                  data={[
                    {
                      z,
                      x: dates,
                      y: skus,
                      type: 'heatmap',
                      colorscale: [[0, '#FDE68A'], [1, '#DC2626']],
                      hovertemplate: 'SKU: %{y}<br>Date: %{x}<br>Breach: %{z}<extra></extra>',
                    },
                  ]}
                  layout={{ margin: { t: 20, r: 20, b: 40, l: 80 }, xaxis: { title: 'Date' }, yaxis: { title: 'SKU' } }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              )
            })() : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No breach data available yet.</div>
            )}
          </div>
        </section>

        <section className="aa-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Shortage vs Pileup Events</h3>
          <div className="mt-4 h-[430px] rounded-2xl bg-slate-50 p-2">
            {charts.shortage_vs_pileup?.length ? (
              <Plot
                data={[
                  {
                    x: (charts.shortage_vs_pileup ?? []).map((item: any) => item.Type),
                    y: (charts.shortage_vs_pileup ?? []).map((item: any) => item.Events),
                    type: 'bar',
                    marker: { color: ['#F59E0B', '#0F766E'] },
                  },
                ]}
                layout={{ margin: { t: 20, r: 20, b: 40, l: 40 }, xaxis: { title: 'Event' }, yaxis: { title: 'Count' } }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No event summary data yet.</div>
            )}
          </div>
        </section>

        <section className="aa-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Lead Time Distribution</h3>
          <div className="mt-4 h-[430px] rounded-2xl bg-slate-50 p-2">
            {charts.lead_time_distribution?.length ? (
              <Plot
                data={[
                  {
                    x: (charts.lead_time_distribution ?? []).map((item: any) => (Number(item.bin_start) + Number(item.bin_end)) / 2),
                    y: (charts.lead_time_distribution ?? []).map((item: any) => item.count),
                    type: 'bar',
                    marker: { color: '#2563EB' },
                  },
                ]}
                layout={{ margin: { t: 20, r: 20, b: 40, l: 40 }, xaxis: { title: 'Lead Time' }, yaxis: { title: 'Frequency' } }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No lead-time distribution data yet.</div>
            )}
          </div>
        </section>

        <section className="aa-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Inventory Forecast</h3>
          <div className="mt-4 h-[430px] rounded-2xl bg-slate-50 p-2">
            {charts.inventory_forecast?.length ? (
              <Plot
                data={[
                  {
                    x: (charts.inventory_forecast ?? []).map((item: any) => item.Date),
                    y: (charts.inventory_forecast ?? []).map((item: any) => item.Inventory_Level ?? null),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Actual',
                    line: { color: '#0F766E' },
                  },
                  {
                    x: (charts.inventory_forecast ?? []).map((item: any) => item.Date),
                    y: (charts.inventory_forecast ?? []).map((item: any) => item.MA_7 ?? null),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: '7-day MA',
                    line: { color: '#2563EB' },
                  },
                  {
                    x: (charts.inventory_forecast ?? []).map((item: any) => item.Date),
                    y: (charts.inventory_forecast ?? []).map((item: any) => item.MA_30 ?? null),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: '30-day MA',
                    line: { color: '#F59E0B' },
                  },
                  {
                    x: (charts.inventory_forecast ?? []).map((item: any) => item.Date),
                    y: (charts.inventory_forecast ?? []).map((item: any) => item.Naive_Forecast ?? null),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Naive Forecast',
                    line: { color: '#DC2626' },
                  },
                ]}
                layout={{ margin: { t: 20, r: 20, b: 40, l: 40 }, xaxis: { title: 'Date' }, yaxis: { title: 'Inventory Level' } }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No inventory forecast data yet.</div>
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="text-4xl font-bold text-[#0F172A]">Inventory Pileup & Shortage Analytics Lab</div>
          <p className="mt-3 max-w-3xl text-slate-600">Track demand vs supply, predict stock risks, and simulate inventory strategies to balance working capital with service levels.</p>
        </div>

        <Tabs>
          <TabList className="mb-8 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Overview</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Important Attributes</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Application</Tab>
          </TabList>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8">
                <h2 className="text-3xl font-bold text-slate-900">Overview</h2>
                <p className="mt-4 text-slate-600">This lab monitors SKU-level demand, production, procurement, and inventory to prevent stockouts and excess pileups using a single decision workspace.</p>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <article className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Capabilities</h3>
                  <ul className="mt-4 space-y-2 text-slate-600">
                    <li>Track daily demand vs production vs procurement</li>
                    <li>Monitor inventory vs safety stock and breach patterns</li>
                    <li>Analyze forecast error, lead time, stock turnover</li>
                    <li>Run AutoML on lead-time drivers</li>
                    <li>Simulate inventory strategies via parameter adjustments</li>
                  </ul>
                </article>
                <article className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Business Impact</h3>
                  <ul className="mt-4 space-y-2 text-slate-600">
                    <li>Reduce cash locked in slow-moving inventory</li>
                    <li>Avoid production stoppages due to shortages</li>
                    <li>Improve service levels and OTIF</li>
                    <li>Support S&OP, safety stock and reorder planning</li>
                  </ul>
                </article>
              </div>

              <div className="grid gap-6 md:grid-cols-5">
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{kpis?.active_skus ?? '—'}</p>
                  <p className="mt-2 text-slate-500">Active SKUs</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_inventory)}</p>
                  <p className="mt-2 text-slate-500">Avg Inventory Level</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{kpis?.shortage_events ?? '—'}</p>
                  <p className="mt-2 text-slate-500">Shortage Incidents</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{kpis?.pileup_events ?? '—'}</p>
                  <p className="mt-2 text-slate-500">Pileup Incidents</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.service_level_pct)}</p>
                  <p className="mt-2 text-slate-500">Service Level</p>
                </article>
              </div>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold">Who Should Use This</h3>
                <p className="mt-3 text-slate-600">Supply chain managers, production planners, inventory controllers, plant heads, and finance teams needing SKU-level inventory visibility.</p>
              </section>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Required Columns</h2>
                <p className="mt-3 text-slate-600">These columns are validated against the backend required columns list and are required for the full workflow.</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {REQUIRED_FIELDS.map((field) => (
                    <div key={field} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">{field}</div>
                  ))}
                </div>
              </section>

              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Model Variables</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Independent Variables</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {['Daily_Demand', 'Predicted_Demand', 'Forecast_Error', 'Production_Qty', 'Production_Delay_Hrs', 'Procurement_Qty', 'Procurement_Delay_Hrs', 'Inventory_Level', 'Safety_Stock', 'Stock_Turnover', 'Backorder_Qty', 'Wastage_Qty'].map((item) => (
                        <span key={item} className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#065F46]">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Dependent Variables</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {['Lead_Time_Days', 'Shortage_Flag', 'Pileup_Flag'].map((item) => (
                        <span key={item} className="rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Dataset Options</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {['default', 'upload', 'mapping'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option as 'default' | 'upload' | 'mapping')}
                      className={`rounded-3xl border p-5 text-left ${mode === option ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-slate-200 bg-white'}`}
                    >
                      <p className="text-lg font-semibold capitalize">{option === 'default' ? 'Default dataset' : option === 'upload' ? 'Upload CSV' : 'Upload CSV + Manual Mapping'}</p>
                      <p className="mt-2 text-sm text-slate-500">{option === 'default' ? 'Load the inventory dataset directly from GitHub.' : 'Use your own CSV and map columns when needed.'}</p>
                    </button>
                  ))}
                </div>
              </section>

              {(mode === 'upload' || mode === 'mapping') && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Upload CSV</h3>
                  <p className="mt-2 text-sm text-slate-500">Use your own CSV and map columns when needed.</p>
                  <label className="mt-4 block rounded-3xl border border-dashed border-[#CBD5E1] bg-slate-50 p-6 text-center text-slate-600">
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          void handleUpload(file)
                          void handleGetColumns(file)
                        }
                      }}
                    />
                    <span className="text-sm font-semibold text-[#0F766E]">Choose a CSV file or drag it here</span>
                  </label>
                </section>
              )}

              {mode === 'mapping' && fileColumns.length > 0 && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Column Mapping</h3>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {REQUIRED_FIELDS.map((field) => (
                      <label key={field} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                        <span className="mb-2 block font-semibold text-slate-700">{field}</span>
                        <select className="w-full rounded-xl border border-slate-200 p-2" value={mapping[field] ?? ''} onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}>
                          <option value="">-- Select --</option>
                          {fileColumns.map((column) => (
                            <option key={column} value={column}>{column}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                    <div className="md:col-span-2 xl:col-span-3">
                      <button type="button" onClick={() => void applyMapping()} className="aa-button aa-button-primary">Apply Mapping</button>
                    </div>
                  </div>
                </section>
              )}

              {statusMessage && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{statusMessage}</p>}
              {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

              {data.length > 0 && (
                <>
                  <section className="aa-card p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">Default Dataset Preview</h3>
                        <p className="text-slate-500">Review the loaded dataset before applying filters and running analytics.</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => void loadDefault()} className="aa-button aa-button-primary">Load Default Dataset</button>
                        <button type="button" onClick={() => void downloadRows(data.length ? data : datasetPreviewRows, 'default_dataset.csv')} className="aa-button aa-button-secondary">Download sample data</button>
                      </div>
                    </div>
                    <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {datasetPreviewColumns.map((key) => (
                              <th key={key} className="border-b border-slate-200 px-3 py-3 font-semibold">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(datasetPreviewRows.length ? datasetPreviewRows : data.slice(0, 10)).map((row, index) => (
                            <tr key={index} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">
                              {datasetPreviewColumns.map((key) => (
                                <td key={`${index}-${key}`} className="max-w-[180px] whitespace-normal px-3 py-3">{formatCell(row[key])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="aa-card p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">Filters & Preview</h3>
                        <p className="text-slate-500">Filter by SKU and date range to update the KPI cards and downstream analytics.</p>
                      </div>
                      <button type="button" onClick={() => void applyFilters()} className="aa-button aa-button-primary">Apply Filters</button>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">SKU Filter</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skus.map((sku) => {
                            const enabled = selectedSkus.includes(sku)
                            return (
                              <button
                                key={sku}
                                type="button"
                                onClick={() => setSelectedSkus((current) => (enabled ? current.filter((item) => item !== sku) : [...current, sku]))}
                                className={`rounded-full px-3 py-2 text-sm font-semibold ${enabled ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                              >
                                {sku}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Date Range</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">Start Date</span>
                            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2" />
                          </label>
                          <label className="text-sm text-slate-600">
                            <span className="mb-1 block">End Date</span>
                            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#475569]">Filter Summary</p>
                      <p className="mt-1 text-2xl font-bold text-[#0F172A]">Filtered rows: {filtered.length}</p>
                    </div>
                  </section>

                  <section className="aa-card p-8">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-semibold text-slate-900">Filtered Preview</h3>
                      <button type="button" onClick={() => void downloadRows(filtered.length ? filtered : data, 'filtered_inventory_data.csv')} className="aa-button aa-button-secondary">Download filtered data</button>
                    </div>
                    <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {tableColumns.map((key) => (
                              <th key={key} className="border-b border-slate-200 px-3 py-3 font-semibold">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataPreview.map((row, index) => (
                            <tr key={index} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">
                              {tableColumns.map((key) => (
                                <td key={`${index}-${key}`} className="max-w-[180px] whitespace-normal px-3 py-3">{formatCell(row[key])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="aa-card p-8">
                    <h3 className="text-xl font-semibold">Dynamic Key Metrics</h3>
                    <div className="mt-6 grid gap-6 md:grid-cols-5">
                      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-3xl font-bold text-[#0F766E]">{kpis?.active_skus ?? '—'}</p>
                        <p className="mt-2 text-slate-500">Active SKUs</p>
                      </article>
                      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_inventory)}</p>
                        <p className="mt-2 text-slate-500">Avg Inventory</p>
                      </article>
                      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-3xl font-bold text-[#0F766E]">{kpis?.shortage_events ?? '—'}</p>
                        <p className="mt-2 text-slate-500">Shortage Events</p>
                      </article>
                      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-3xl font-bold text-[#0F766E]">{kpis?.pileup_events ?? '—'}</p>
                        <p className="mt-2 text-slate-500">Pileup Events</p>
                      </article>
                      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.service_level_pct)}</p>
                        <p className="mt-2 text-slate-500">Service Level</p>
                      </article>
                    </div>
                  </section>

                  <section className="aa-card p-8">
                    <h3 className="text-xl font-semibold">Exploratory Analysis</h3>
                    <div className="mt-6">{renderChartPanel()}</div>
                  </section>

                  <section className="aa-card p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">AutoML — Lead Time Prediction</h3>
                        <p className="mt-2 text-slate-500">The backend trains Linear Regression, RandomForest and Gradient Boosting models and compares RMSE, MAE and R2.</p>
                      </div>
                      <div className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#065F46]">{mlResult?.best_model ? `Best model: ${mlResult.best_model}` : 'Awaiting model run'}</div>
                    </div>
                    {mlResult?.model_comparison?.length ? (
                      <div className="mt-6">
                        <h4 className="mb-4 text-lg font-semibold text-slate-900">Model comparison</h4>
                        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                          <table className="min-w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">Model</th>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">RMSE</th>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">MAE</th>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">R2</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mlResult.model_comparison.map((row: any, index: number) => (
                                <tr key={`${row.Model}-${index}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50">
                                  <td className="px-3 py-3 font-semibold">{row.Model}</td>
                                  <td className="px-3 py-3">{formatMetric(row.RMSE)}</td>
                                  <td className="px-3 py-3">{formatMetric(row.MAE)}</td>
                                  <td className="px-3 py-3">{formatMetric(row.R2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-slate-500">AutoML results will appear once the backend has enough rows to train the models.</p>
                    )}
                    {predictionRows.length ? (
                      <div className="mt-8">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-lg font-semibold text-slate-900">Sample predictions on filtered dataset:</h4>
                          <button type="button" onClick={() => void downloadRows(predictionRows, 'ml_predictions.csv')} className="aa-button aa-button-secondary">Download ML predictions</button>
                        </div>
                        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                          <table className="min-w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">sku</th>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">date</th>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">lead_time_days</th>
                                <th className="border-b border-slate-200 px-3 py-3 font-semibold">predicted_lead_time_days</th>
                              </tr>
                            </thead>
                            <tbody>
                              {predictionRows.map((row: any, index: number) => (
                                <tr key={`${row.sku}-${row.date}-${index}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50">
                                  <td className="px-3 py-3">{formatCell(row.sku)}</td>
                                  <td className="px-3 py-3">{formatCell(row.date)}</td>
                                  <td className="px-3 py-3">{formatMetric(row.lead_time_days == null ? null : Number(row.lead_time_days))}</td>
                                  <td className="px-3 py-3">{formatMetric(row.predicted_lead_time_days == null ? null : Number(row.predicted_lead_time_days))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </section>

                  <section className="aa-card p-8">
                    <h3 className="text-xl font-semibold">Inventory Strategy Simulator</h3>
                    <p className="mt-2 text-slate-500">Adjust the demand, production, procurement, and safety stock assumptions and compare the simulated inventory outcomes.</p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {[
                        { key: 'demPct', label: 'Demand change %', min: -50, max: 50, step: 1 },
                        { key: 'prodPct', label: 'Production change %', min: -50, max: 50, step: 1 },
                        { key: 'procPct', label: 'Procurement change %', min: -50, max: 50, step: 1 },
                        { key: 'ssPct', label: 'Safety Stock change %', min: -50, max: 50, step: 1 },
                        { key: 'ltPct', label: 'Lead Time change % (for info)', min: -50, max: 50, step: 1 },
                      ].map((slider) => (
                        <label key={slider.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-semibold">{slider.label}</span>
                            <span className="text-[#0F766E]">{simulatorParams[slider.key as keyof typeof simulatorParams]}%</span>
                          </div>
                          <input
                            type="range"
                            min={slider.min}
                            max={slider.max}
                            step={slider.step}
                            value={simulatorParams[slider.key as keyof typeof simulatorParams]}
                            onChange={(event) => setSimulatorParams((prev) => ({ ...prev, [slider.key]: Number(event.target.value) }))}
                            className="w-full"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" onClick={() => void analyzeRows(filtered.length ? filtered : data, selectedSkus, dateStart, dateEnd)} className="aa-button aa-button-primary">Run simulation</button>
                    </div>
                    {simulator ? (
                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-500">Shortage Rate (New)</p>
                          <p className="mt-2 text-2xl font-bold text-[#0F766E]">{formatPercent(simulator.shortage_rate_new)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-500">Pileup Rate (New)</p>
                          <p className="mt-2 text-2xl font-bold text-[#0F766E]">{formatPercent(simulator.pileup_rate_new)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-500">Avg Inventory (New)</p>
                          <p className="mt-2 text-2xl font-bold text-[#0F766E]">{formatMetric(simulator.avg_inventory_new)}</p>
                        </div>
                      </div>
                    ) : null}
                    {simulator?.sku_simulation?.length ? (
                      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">SKU</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Sim Inventory</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Sim Shortage Rate</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Sim Pileup Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simulator.sku_simulation.slice(0, 15).map((row: any, index: number) => (
                              <tr key={`${row.SKU}-${index}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50">
                                <td className="px-3 py-3">{row.SKU}</td>
                                <td className="px-3 py-3">{formatMetric(row.Sim_Inventory)}</td>
                                <td className="px-3 py-3">{formatPercent(row.Sim_Shortage_Rate ? row.Sim_Shortage_Rate * 100 : null)}</td>
                                <td className="px-3 py-3">{formatPercent(row.Sim_Pileup_Rate ? row.Sim_Pileup_Rate * 100 : null)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </section>

                  <section className="aa-card p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">Automated Insights</h3>
                        <p className="mt-2 text-slate-500">The backend generates high-risk SKU insights from the current filtered dataset.</p>
                      </div>
                      {insights.length ? (
                        <button type="button" onClick={() => void downloadRows(insights, 'automated_insights.csv')} className="aa-button aa-button-secondary">Download insights</button>
                      ) : null}
                    </div>
                    {insights.length ? (
                      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Insight Type</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">SKU</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Metric</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {insights.map((row: any, index: number) => (
                              <tr key={`${row.Insight_Type}-${row.SKU}-${index}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50">
                                <td className="px-3 py-3">{row.Insight_Type}</td>
                                <td className="px-3 py-3">{row.SKU}</td>
                                <td className="px-3 py-3">{row.Metric}</td>
                                <td className="px-3 py-3">{formatCell(row.Value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-4 text-slate-500">Insights will appear after the backend processes the filtered dataset.</p>
                    )}
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
