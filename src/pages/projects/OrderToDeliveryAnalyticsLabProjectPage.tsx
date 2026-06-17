import { useEffect, useMemo, useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import Plot from 'react-plotly.js'
import { Slider } from '@/app/components/ui/slider'

const API_BASE_URL =
  import.meta.env.VITE_ORDER_TO_DELIVERY_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8021'

const REQUIRED_FIELDS = [
  'Order_ID',
  'Order_Date',
  'Product_Type',
  'Machine_Type',
  'Scheduling_Delay_Hrs',
  'Production_Time_Hrs',
  'Machine_Delay_Hrs',
  'Dispatch_Delay_Hrs',
  'Total_Lead_Time_Hrs',
  'Estimated_Delivery_Date',
  'Predicted_Lead_Time_Hrs',
  'Customer_Satisfaction_Score',
]

const QUERY_PARAM_MAP: Record<string, string> = {
  Order_ID: 'order_id',
  Order_Date: 'order_date',
  Product_Type: 'product_type',
  Machine_Type: 'machine_type',
  Scheduling_Delay_Hrs: 'scheduling_delay_hrs',
  Production_Time_Hrs: 'production_time_hrs',
  Machine_Delay_Hrs: 'machine_delay_hrs',
  Dispatch_Delay_Hrs: 'dispatch_delay_hrs',
  Total_Lead_Time_Hrs: 'total_lead_time_hrs',
  Estimated_Delivery_Date: 'estimated_delivery_date',
  Predicted_Lead_Time_Hrs: 'predicted_lead_time_hrs',
  Customer_Satisfaction_Score: 'customer_satisfaction_score',
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
  return value.toFixed(2)
}

function getLineChartData(records: any[]) {
  const groups = new Map<string, Array<{ x: string; y: number }>>()

  for (const record of records) {
    const product = String(record.Product_Type ?? 'Unknown')
    const x = String(record.Order_Date ?? '')
    const y = Number(record.Total_Lead_Time_Hrs ?? 0)

    if (!groups.has(product)) {
      groups.set(product, [])
    }

    groups.get(product)?.push({ x, y })
  }

  return Array.from(groups.entries()).map(([name, values]) => ({
    type: 'scatter',
    mode: 'lines+markers',
    name,
    x: values.map((item) => item.x),
    y: values.map((item) => item.y),
  }))
}

function getBoxChartData(records: any[]) {
  const groups = new Map<string, number[]>()

  for (const record of records) {
    const machine = String(record.Machine_Type ?? 'Unknown')
    const value = Number(record.Total_Lead_Time_Hrs ?? 0)

    if (!groups.has(machine)) {
      groups.set(machine, [])
    }

    groups.get(machine)?.push(value)
  }

  return Array.from(groups.entries()).map(([name, values]) => ({
    type: 'box',
    name,
    y: values,
    boxpoints: false,
  }))
}

export function OrderToDeliveryAnalyticsLabProjectPage() {
  const [mode, setMode] = useState<'default' | 'upload' | 'mapping'>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])
  const [machineTypes, setMachineTypes] = useState<string[]>([])
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([])
  const [selectedMachineTypes, setSelectedMachineTypes] = useState<string[]>([])

  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>({})
  const [mlResult, setMlResult] = useState<any>(null)
  const [simulator, setSimulator] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [simulatorParams, setSimulatorParams] = useState<Record<string, number>>({
    schedPct: 0,
    prodPct: 0,
    machPct: 0,
    dispPct: 0,
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

  useEffect(() => {
    void loadDefault()
  }, [])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data)
  }, [data, selectedProductTypes, selectedMachineTypes])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    setSelectedProductTypes([])
    setSelectedMachineTypes([])

    try {
      const res = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setProductTypes((res.product_types ?? []).map(String))
      setMachineTypes((res.machine_types ?? []).map(String))
      setStatusMessage('Default dataset loaded from GitHub.')
      await analyzeRows(res.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function updateSimulator(rows: any[], params: Record<string, number> = simulatorParams) {
    if (!rows.length) {
      setSimulator(null)
      return
    }

    try {
      const simRes = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          sched_pct: params.schedPct ?? 0,
          prod_pct: params.prodPct ?? 0,
          mach_pct: params.machPct ?? 0,
          disp_pct: params.dispPct ?? 0,
        }),
      }).then(handleResponse)
      setSimulator(simRes)
    } catch (err) {
      console.error(err)
      setSimulator(null)
    }
  }

  async function analyzeRows(rows: any[], productTypesToUse = selectedProductTypes, machineTypesToUse = selectedMachineTypes, paramsToUse = simulatorParams) {
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
          product_types: productTypesToUse.length ? productTypesToUse : undefined,
          machine_types: machineTypesToUse.length ? machineTypesToUse : undefined,
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

    await updateSimulator(rows, paramsToUse)

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
      await analyzeRows(data, selectedProductTypes, selectedMachineTypes)
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
      setProductTypes((uploadRes.product_types ?? []).map(String))
      setMachineTypes((uploadRes.machine_types ?? []).map(String))
      setSelectedProductTypes([])
      setSelectedMachineTypes([])
      setMode('upload')
      setStatusMessage('CSV uploaded successfully. Review the preview and apply mapping if needed.')
      await analyzeRows(uploadRes.data ?? [])
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
    setMapping(Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, ''])))
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
      setStatusMessage('Mapping applied successfully.')
      await analyzeRows(res.data ?? [])
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="text-4xl font-bold text-[#0F172A]">Order-to-Delivery Analytics Lab</div>
          <p className="mt-3 max-w-3xl text-slate-600">Analyze the full order lifecycle from order creation to delivery, isolate lead-time bottlenecks, and predict delivery outcomes with AutoML.</p>
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
                <p className="mt-4 text-slate-600">This lab provides full visibility into customer orders, production flow, machine delays, and dispatch performance so teams can identify where lead time is being lost.</p>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <article className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Capabilities</h3>
                  <ul className="mt-4 space-y-2 text-slate-600">
                    <li>End-to-end order-to-dispatch analytics</li>
                    <li>Lead-time breakdown and bottleneck diagnosis</li>
                    <li>ML & AutoML for delivery-time prediction</li>
                    <li>Scenario-based scheduling simulator</li>
                  </ul>
                </article>
                <article className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Business Impact</h3>
                  <ul className="mt-4 space-y-2 text-slate-600">
                    <li>Faster and predictable delivery</li>
                    <li>Reduced production and dispatch delays</li>
                    <li>Better machine capacity planning</li>
                    <li>Improved customer satisfaction</li>
                  </ul>
                </article>
              </div>

              <div className="grid gap-6 md:grid-cols-5">
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{kpis?.orders ?? '—'}</p>
                  <p className="mt-2 text-slate-500">Orders Tracked</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_lead_time)}</p>
                  <p className="mt-2 text-slate-500">Avg Lead Time</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_production)}</p>
                  <p className="mt-2 text-slate-500">Avg Production Time</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_machine_delay)}</p>
                  <p className="mt-2 text-slate-500">Avg Machine Delay</p>
                </article>
                <article className="aa-card p-6 text-center">
                  <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_dispatch_delay)}</p>
                  <p className="mt-2 text-slate-500">Avg Dispatch Delay</p>
                </article>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Required Columns</h2>
                <p className="mt-3 text-slate-600">The workflow depends on the core order, delay, lead-time, and delivery fields below.</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {REQUIRED_FIELDS.map((field) => (
                    <div key={field} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">{field}</div>
                  ))}
                </div>
              </section>

              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Model Variables</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {['Scheduling_Delay_Hrs', 'Production_Time_Hrs', 'Machine_Delay_Hrs', 'Dispatch_Delay_Hrs'].map((item) => (
                    <span key={item} className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#065F46]">{item}</span>
                  ))}
                </div>
              </section>

              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Dependent Variable</h2>
                <span className="mt-4 inline-flex rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]">Total_Lead_Time_Hrs</span>
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
                      <p className="mt-2 text-sm text-slate-500">{option === 'default' ? 'Load the order-to-delivery dataset directly from GitHub.' : 'Use your own CSV and map columns when needed.'}</p>
                    </button>
                  ))}
                </div>
              </section>

              {mode === 'default' && (
                <section className="aa-card p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">Default dataset</h3>
                      <p className="text-slate-500">The backend loads the hosted CSV automatically.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => void loadDefault()} className="aa-button aa-button-primary">Reload Default Data</button>
                      <button type="button" onClick={() => void downloadRows(data, 'default_dataset.csv')} className="aa-button aa-button-secondary">Download sample data</button>
                    </div>
                  </div>
                  {statusMessage && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{statusMessage}</p>}
                  <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
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
              )}

              {(mode === 'upload' || mode === 'mapping') && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Upload CSV</h3>
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
                  {mode === 'mapping' && fileColumns.length > 0 && (
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
                  )}
                </section>
              )}

              <section className="aa-card p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">Filters & Preview</h3>
                    <p className="text-slate-500">Filter by product type and machine type to update the KPI cards and downstream analytics.</p>
                  </div>
                  <button type="button" onClick={() => void applyFilters()} className="aa-button aa-button-primary">Apply Filters</button>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Product Type</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {productTypes.map((product) => {
                        const enabled = selectedProductTypes.includes(product)
                        return (
                          <button
                            key={product}
                            type="button"
                            onClick={() => setSelectedProductTypes((current) => (enabled ? current.filter((item) => item !== product) : [...current, product]))}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${enabled ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                          >
                            {product}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Machine Type</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {machineTypes.map((machine) => {
                        const enabled = selectedMachineTypes.includes(machine)
                        return (
                          <button
                            key={machine}
                            type="button"
                            onClick={() => setSelectedMachineTypes((current) => (enabled ? current.filter((item) => item !== machine) : [...current, machine]))}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${enabled ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                          >
                            {machine}
                          </button>
                        )
                      })}
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
                  <h3 className="text-xl font-semibold text-slate-900">Filtered Preview (first 10 rows)</h3>
                  <button type="button" onClick={() => void downloadRows(filtered.length ? filtered : data, 'filtered_preview.csv')} className="aa-button aa-button-secondary">Download filtered preview (first 500 rows)</button>
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
                <h3 className="text-xl font-semibold text-slate-900">Key Metrics</h3>
                <div className="mt-6 grid gap-6 md:grid-cols-5">
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-3xl font-bold text-[#0F766E]">{kpis?.orders ?? '—'}</p>
                    <p className="mt-2 text-slate-500">Orders</p>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_lead_time)}</p>
                    <p className="mt-2 text-slate-500">Avg Lead Time (hrs)</p>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_production)}</p>
                    <p className="mt-2 text-slate-500">Avg Production Time (hrs)</p>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_machine_delay)}</p>
                    <p className="mt-2 text-slate-500">Avg Machine Delay (hrs)</p>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_dispatch_delay)}</p>
                    <p className="mt-2 text-slate-500">Avg Dispatch Delay (hrs)</p>
                  </article>
                </div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold text-slate-900">Charts</h3>
                <div className="mt-6 flex flex-col gap-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-lg font-semibold">Lead Time Trend by Product Type</h4>
                    <div className="mt-4 h-[440px]">
                      <Plot
                        data={getLineChartData(charts.lead_time_trend ?? [])}
                        layout={{
                          margin: { l: 40, r: 10, t: 10, b: 40 },
                          paper_bgcolor: 'transparent',
                          plot_bgcolor: 'transparent',
                          xaxis: { title: 'Order Date' },
                          yaxis: { title: 'Total Lead Time (hrs)' },
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-lg font-semibold">Lead Time Distribution by Machine Type</h4>
                    <div className="mt-4 h-[440px]">
                      <Plot
                        data={getBoxChartData(charts.lead_time_by_machine ?? [])}
                        layout={{
                          margin: { l: 40, r: 10, t: 10, b: 40 },
                          paper_bgcolor: 'transparent',
                          plot_bgcolor: 'transparent',
                          yaxis: { title: 'Total Lead Time (hrs)' },
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold text-slate-900">AutoML: Lead Time Prediction</h3>
                <p className="mt-2 text-slate-500">The backend compares RandomForest, GradientBoosting, and LinearRegression and reports the best model.</p>
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Model</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">RMSE</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">R2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mlResult?.model_comparison ?? []).map((row: any, index: number) => (
                        <tr key={`${row.Model}-${index}`} className={`border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50 ${row.Model === mlResult?.best_model ? 'bg-emerald-50' : ''}`}>
                          <td className="px-3 py-3 font-semibold">{row.Model}</td>
                          <td className="px-3 py-3">{formatMetric(row.RMSE)}</td>
                          <td className="px-3 py-3">{formatMetric(row.R2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mlResult?.best_model && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Selected Best Model: {mlResult.best_model} (highest R²)</p>}
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => void downloadRows(mlResult?.predictions ?? [], 'automl_predictions.csv')} className="aa-button aa-button-secondary">Download AutoML prediction sample</button>
                </div>
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Actual Lead Time</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Predicted Lead Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mlResult?.predictions ?? []).map((row: any, index: number) => (
                        <tr key={`${row.Actual_Lead_Time_Hrs}-${index}`} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">
                          <td className="px-3 py-3">{formatMetric(row.Actual_Lead_Time_Hrs)}</td>
                          <td className="px-3 py-3">{formatMetric(row.Predicted_Lead_Time_Hrs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold text-slate-900">Scheduling Simulator</h3>
                <p className="mt-2 text-slate-500">Adjust the delay and time percentages to see the simulated lead-time impact instantly.</p>
                <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Change in Scheduling Delay (%)', 'schedPct', -80, 80],
                    ['Change in Production Time (%)', 'prodPct', -80, 80],
                    ['Change in Machine Delay (%)', 'machPct', -80, 80],
                    ['Change in Dispatch Delay (%)', 'dispPct', -80, 80],
                  ].map(([label, key, min, max]) => {
                    const value = simulatorParams[key as keyof typeof simulatorParams] ?? 0
                    return (
                      <label key={key as string} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-700">{label}</span>
                          <span className="text-sm font-bold text-[#0F766E]">{value}%</span>
                        </div>
                        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                          <Slider
                            value={[value]}
                            min={Number(min)}
                            max={Number(max)}
                            step={1}
                            onValueChange={(sliderValue) => {
                              const nextParams = {
                                ...simulatorParams,
                                [key as string]: sliderValue[0],
                              }
                              setSimulatorParams(nextParams)
                              void updateSimulator(filtered.length ? filtered : data, nextParams)
                            }}
                            className="h-4"
                          />
                        </div>
                      </label>
                    )
                  })}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Baseline Avg Lead Time</p>
                    <p className="mt-2 text-3xl font-bold text-[#0F172A]">{formatMetric(simulator?.baseline_avg_hrs)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Simulated Avg Lead Time</p>
                    <p className="mt-2 text-3xl font-bold text-[#0F172A]">{formatMetric(simulator?.simulated_avg_hrs)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Improvement</p>
                    <p className="mt-2 text-3xl font-bold text-[#0F172A]">{formatMetric(simulator?.improvement_hrs)} hrs</p>
                    <p className="text-sm text-slate-500">{formatMetric(simulator?.improvement_pct)}%</p>
                  </div>
                </div>
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Order ID</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Product Type</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Machine Type</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Total Lead Time</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Sim Total Lead Time</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Reduction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(simulator?.top10_orders ?? []).map((row: any, index: number) => (
                        <tr key={`${row.Order_ID}-${index}`} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">
                          <td className="px-3 py-3">{formatCell(row.Order_ID)}</td>
                          <td className="px-3 py-3">{formatCell(row.Product_Type)}</td>
                          <td className="px-3 py-3">{formatCell(row.Machine_Type)}</td>
                          <td className="px-3 py-3">{formatMetric(row.Total_Lead_Time_Hrs)}</td>
                          <td className="px-3 py-3">{formatMetric(row.Sim_Total_Lead_Time_Hrs)}</td>
                          <td className="px-3 py-3">{formatMetric(row.LeadTime_Reduction_Hrs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5">
                  <button type="button" onClick={() => void downloadRows(simulator?.top10_orders ?? [], 'simulator_results.csv')} className="aa-button aa-button-secondary">Download simulator result</button>
                </div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold text-slate-900">Automated Insights</h3>
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Insight</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Detail</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.map((row, index) => (
                        <tr key={`${row.Insight}-${index}`} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">
                          <td className="px-3 py-3 font-semibold">{row.Insight}</td>
                          <td className="px-3 py-3">{row.Detail}</td>
                          <td className="px-3 py-3">{row.Action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5">
                  <button type="button" onClick={() => void downloadRows(filtered.length ? filtered : data, 'insights.csv')} className="aa-button aa-button-secondary">Download insights</button>
                </div>
              </section>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}
