import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import Plot from 'react-plotly.js'
import { Download, FileText, UploadCloud, X } from 'lucide-react'
import { Slider } from '@/app/components/ui/slider'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'

const API_BASE_URL =
  import.meta.env.VITE_ORDER_FULFILLMENT_SLA_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8012'

const REQUIRED_FIELDS = [
  'Order_ID',
  'Customer_ID',
  'Order_Date',
  'Warehouse',
  'Region',
  'Product_Type',
  'Channel',
  'Processing_Delay_Hrs',
  'Picking_Delay_Hrs',
  'Packing_Delay_Hrs',
  'Dispatch_Delay_Hrs',
  'Transport_Delay_Hrs',
  'Total_Fulfillment_Hours',
  'SLA_Hours',
  'SLA_Breach_Flag',
  'Order_Qty',
  'Fulfilled_Qty',
  'Qty_Accuracy',
  'Short_Ship_Flag',
  'Root_Cause',
  'Priority',
  'Fulfillment_Completed_At',
  'Shipping_Cost',
  'Delay_Cost',
]

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

function formatMetric(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="mb-3 text-lg font-semibold text-slate-900">{title}</h4>
      {children}
    </article>
  )
}

function FilterChipGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string
  options: string[]
  values: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">{label}</p>
      <div className="mb-4 mt-3 min-h-[56px] rounded-[16px] border border-slate-200 bg-white px-4 py-3">
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {values.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange(values.filter((value) => value !== option))}
                className="rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]"
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
            onClick={() => onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option])}
            className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${values.includes(option) ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrderFulfillmentSlaAnalyticsProjectPage() {
  const [mode, setMode] = useState<'default' | 'upload' | 'mapping'>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [defaultPreviewRows, setDefaultPreviewRows] = useState<any[]>([])
  const [filteredPreviewRows, setFilteredPreviewRows] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<string[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])
  const [priorities, setPriorities] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([])
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [dateStart, setDateStart] = useState('2023-01-01')
  const [dateEnd, setDateEnd] = useState('2023-12-31')

  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>({})
  const [clusterCount, setClusterCount] = useState(4)
  const [mlClassifier, setMlClassifier] = useState<any>(null)
  const [mlRegressor, setMlRegressor] = useState<any>(null)
  const [clustering, setClustering] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [playbooks, setPlaybooks] = useState<any>({})

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const defaultPreview = useMemo(() => defaultPreviewRows.slice(0, 10), [defaultPreviewRows])
  const filteredPreview = useMemo(() => filteredPreviewRows.slice(0, 10), [filteredPreviewRows])
  const uploadedPreview = useMemo(() => defaultPreviewRows.slice(0, 5), [defaultPreviewRows])

  const defaultTableColumns = useMemo(() => {
    const sample = defaultPreview[0] ?? data[0] ?? {}
    return Object.keys(sample)
  }, [defaultPreview, data])

  const filteredTableColumns = useMemo(() => {
    const sample = filteredPreview[0] ?? filtered[0] ?? data[0] ?? {}
    return Object.keys(sample)
  }, [filteredPreview, filtered, data])

  useEffect(() => {
    void loadDefault()
  }, [])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data)
  }, [data])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data)
  }, [selectedWarehouses, selectedProductTypes, selectedPriorities, selectedRegions, dateStart, dateEnd])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data)
  }, [clusterCount])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    try {
      const res = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setDefaultPreviewRows(res.preview ?? [])
      setFilteredPreviewRows(res.preview ?? [])
      setWarehouses((res.warehouses ?? []).map(String))
      setProductTypes((res.product_types ?? []).map(String))
      setPriorities((res.priorities ?? []).map(String))
      setRegions((res.regions ?? []).map(String))
      setStatusMessage('Default dataset loaded successfully from GitHub RAW URL.')
      await analyzeRows(res.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function analyzeRows(rows: any[]) {
    if (!rows.length) {
      setFiltered([])
      setFilteredPreviewRows([])
      setKpis(null)
      setCharts({})
      setMlClassifier(null)
      setMlRegressor(null)
      setClustering(null)
      setAnomalies(null)
      setInsights([])
      setPlaybooks({})
      return
    }

    try {
      const filterRes = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          warehouses: selectedWarehouses.length ? selectedWarehouses : undefined,
          product_types: selectedProductTypes.length ? selectedProductTypes : undefined,
          priorities: selectedPriorities.length ? selectedPriorities : undefined,
          regions: selectedRegions.length ? selectedRegions : undefined,
          date_start: dateStart || undefined,
          date_end: dateEnd || undefined,
        }),
      }).then(handleResponse)

      const filteredRows = filterRes.data ?? rows
      setFiltered(filteredRows)
      setFilteredPreviewRows(filterRes.preview ?? filteredRows.slice(0, 10))
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
      const classifierRes = await fetch(`${API_BASE_URL}/ml/sla-classifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setMlClassifier(classifierRes)
    } catch (err) {
      console.error(err)
      setMlClassifier(null)
    }

    try {
      const regressorRes = await fetch(`${API_BASE_URL}/ml/fulfillment-regressor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setMlRegressor(regressorRes)
    } catch (err) {
      console.error(err)
      setMlRegressor(null)
    }

    try {
      const clusteringRes = await fetch(`${API_BASE_URL}/ml/clustering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows, n_clusters: clusterCount }),
      }).then(handleResponse)
      setClustering(clusteringRes)
    } catch (err) {
      console.error(err)
      setClustering(null)
    }

    try {
      const anomalyRes = await fetch(`${API_BASE_URL}/ml/anomaly-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setAnomalies(anomalyRes)
    } catch (err) {
      console.error(err)
      setAnomalies(null)
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

    try {
      const playbookRes = await fetch(`${API_BASE_URL}/playbooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setPlaybooks(playbookRes)
    } catch (err) {
      console.error(err)
      setPlaybooks({})
    }
  }

  async function applyFilters() {
    setError(null)
    setLoading(true)
    try {
      await analyzeRows(data)
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
      setDefaultPreviewRows(uploadRes.preview ?? [])
      setFilteredPreviewRows(uploadRes.preview ?? [])
      setWarehouses((uploadRes.warehouses ?? []).map(String))
      setProductTypes((uploadRes.product_types ?? []).map(String))
      setPriorities((uploadRes.priorities ?? []).map(String))
      setRegions((uploadRes.regions ?? []).map(String))
      setMode('upload')
      setStatusMessage('CSV uploaded successfully. Preview is ready and ML analyses can be re-run.')
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
        params.set(field.toLowerCase(), mapping[field] ?? '')
      }
      const res = await fetch(`${API_BASE_URL}/apply-mapping?${params.toString()}`, { method: 'POST', body: formData }).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setDefaultPreviewRows(res.preview ?? [])
      setFilteredPreviewRows(res.preview ?? [])
      setStatusMessage('Mapping applied successfully. The dataset is ready for analysis.')
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
          <div className="text-4xl font-bold text-[#0F172A]">Order Fulfillment & SLA Analytics</div>
          <p className="mt-3 max-w-3xl text-slate-600">Monitor fulfillment performance, isolate SLA risk, and generate action-ready insights from the backend order fulfillment dataset.</p>
        </div>

        <Tabs>
          <TabList className="mb-8 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Overview</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Data Dictionary</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Application</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Automated Insights & Playbooks</Tab>
          </TabList>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8">
                <h2 className="text-3xl font-bold text-slate-900">Overview</h2>
                <p className="mt-4 text-slate-600">Provide end-to-end order fulfillment visibility, predict SLA breaches, and optimize operations to meet delivery commitments.</p>
              </section>
              <div className="grid gap-6 md:grid-cols-2">
                <article className="aa-card p-8"><h3 className="text-xl font-semibold">Capabilities</h3><ul className="mt-4 space-y-2 text-slate-600"><li>SLA breach prediction and root-cause attribution</li><li>Order-level and warehouse-level EDA & time-series trends</li><li>Fulfillment accuracy and short-ship detection</li><li>Clustering of order archetypes and exportable playbooks</li></ul></article>
                <article className="aa-card p-8"><h3 className="text-xl font-semibold">Business Impact</h3><ul className="mt-4 space-y-2 text-slate-600"><li>Improved on-time delivery and SLA compliance</li><li>Reduced rush logistics and penalty costs</li><li>Higher customer satisfaction and lower churn</li><li>Better capacity planning and inventory alignment</li></ul></article>
              </div>
              <div className="grid gap-6 md:grid-cols-5">
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.orders_count ?? '—'}</p><p className="mt-2 text-slate-500">Orders Tracked</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.sla_breach_rate)}</p><p className="mt-2 text-slate-500">SLA Breach Rate</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_fulfillment_hours)}</p><p className="mt-2 text-slate-500">Avg Fulfillment Hrs</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.qty_accuracy)}</p><p className="mt-2 text-slate-500">Qty Accuracy</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.short_ship_rate)}</p><p className="mt-2 text-slate-500">Short-Ship Rate</p></article>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="grid gap-6 md:grid-cols-2">
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Independent Variables</h2><div className="mt-4 flex flex-wrap gap-2">{['Processing_Delay_Hrs','Picking_Delay_Hrs','Packing_Delay_Hrs','Dispatch_Delay_Hrs','Transport_Delay_Hrs','Order_Qty','Fulfilled_Qty','Qty_Accuracy','Shipping_Cost','Delay_Cost','Warehouse','Product_Type','Priority','Region','Channel'].map((item)=><span key={item} className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-sm text-[#1D4ED8]">{item}</span>)}</div></section>
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Dependent Variables</h2><div className="mt-4 flex flex-wrap gap-2">{['SLA_Breach_Flag','Total_Fulfillment_Hours','Short_Ship_Flag'].map((item)=><span key={item} className="rounded-full bg-[#ECFDF5] px-3 py-1.5 text-sm text-[#065F46]">{item}</span>)}</div></section>
              <section className="aa-card p-8 md:col-span-2"><h2 className="text-2xl font-bold">Required Schema Snapshot</h2><div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500"><th className="pb-3">Column</th><th className="pb-3">Required</th></tr></thead><tbody>{REQUIRED_FIELDS.map((field)=><tr key={field} className="border-t border-slate-100"><td className="py-3 font-semibold text-slate-700">{field}</td><td className="py-3 text-slate-500">Yes</td></tr>)}</tbody></table></div></section>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Dataset Modes</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{['default','upload','mapping'].map((option)=><button key={option} type="button" onClick={()=>setMode(option as any)} className={`rounded-3xl border p-5 text-left ${mode===option?'border-[#0F766E] bg-[#ECFDF5]':'border-slate-200 bg-white'}`}><p className="text-lg font-semibold capitalize">{option==='default'?'Default dataset':option==='upload'?'Upload CSV':'Upload CSV + Column Mapping'}</p><p className="mt-2 text-sm text-slate-500">{option==='default'?'Load directly from GitHub RAW URL.':option==='upload'?'Upload a CSV file and analyze it directly.':'Upload a CSV file and map the required columns before analysis.'}</p></button>)}</div></section>
              {mode==='default' && <section className="aa-card p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-xl font-semibold">Default dataset</h3><p className="text-slate-500">Backend loads the hosted CSV automatically.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={()=>void loadDefault()} className="aa-button aa-button-primary">Reload default data</button><button type="button" onClick={()=>void downloadRows(data,'order_fulfillment_default.csv')} className="aa-button aa-button-secondary">Download default data</button></div></div>{statusMessage&&<p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{statusMessage}</p>}<div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{defaultTableColumns.map((key)=><th key={key} className="border-b border-slate-200 px-3 py-3 font-semibold">{key}</th>)}</tr></thead><tbody>{defaultPreview.map((row,index)=><tr key={index} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">{defaultTableColumns.map((key)=><td key={`${index}-${key}`} className="max-w-[180px] whitespace-normal px-3 py-3">{formatCell(row[key])}</td>)}</tr>)}</tbody></table></div></section>}
              {(mode==='upload' || mode==='mapping') && (
                <section className="aa-card p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">Step 1: Upload Area</h3>
                      <p className="mt-1 text-sm text-slate-500">Drag and drop a CSV file or browse from your device. Accepted format: CSV. Max size: 200 MB.</p>
                    </div>
                    <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#065F46]">CSV Upload</span>
                  </div>
                  <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#0F766E] bg-[#F0FDFA] p-8 text-center transition hover:bg-[#ECFEFF]">
                    <UploadCloud className="h-8 w-8 text-[#0F766E]" />
                    <span className="text-base font-semibold text-slate-900">Drop your CSV here or browse files</span>
                    <span className="text-sm text-slate-500">Accepted format: CSV • Max size: 200 MB</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (mode === 'mapping') {
                          void handleUpload(file).then(() => void handleGetColumns(file))
                          return
                        }
                        void handleUpload(file)
                      }}
                    />
                    <Button type="button" variant="outline">Browse Files</Button>
                  </label>
                  {fileColumns.length > 0 && <p className="mt-4 text-sm text-slate-500">Detected columns: {fileColumns.join(', ')}</p>}
                </section>
              )}
              {mode==='mapping' && uploadFile && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Step 2: Uploaded File Information</h3>
                  <div className="mt-5 flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#0F766E]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{uploadFile.name}</p>
                        <p className="text-xs text-slate-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setUploadFile(null); setFileColumns([]); setMapping({}); setMode('mapping'); setStatusMessage(null); }} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100" aria-label="Remove uploaded file">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}
              {mode==='mapping' && uploadedPreview.length > 0 && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Step 3: Preview Table</h3>
                  <p className="mt-1 text-sm text-slate-500">Preview (first 5 rows)</p>
                  <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(uploadedPreview[0]).map((key) => <TableHead key={key} className="whitespace-nowrap px-4 py-3">{key}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadedPreview.map((row, index) => (
                          <TableRow key={index}>
                            {Object.keys(row).map((key) => <TableCell key={`${index}-${key}`} className="px-4 py-3">{formatCell(row[key])}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}
              {mode==='mapping' && fileColumns.length > 0 && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Step 4: Column Mapping Section</h3>
                  <p className="mt-1 text-sm text-slate-500">Map your columns to the expected backend names. Use -- Skip -- for columns you do not want to map.</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {REQUIRED_FIELDS.map((field) => (
                      <label key={field} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <span className="mb-2 block font-semibold text-slate-700">Map → {field}</span>
                        <Select value={mapping[field] ?? ''} onValueChange={(value) => setMapping((prev) => ({ ...prev, [field]: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Skip --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="-- Skip --">-- Skip --</SelectItem>
                            {fileColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={() => void applyMapping()} variant="default">Apply Mapping</Button>
                    <p className="text-sm text-slate-500">This creates the mapping object and sends it to the backend for validation.</p>
                  </div>
                </section>
              )}
              <section className="aa-card p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">STEP 2 — FILTERS & PREVIEW</h3>
                    <p className="mt-1 text-sm text-slate-500">Use the filters below to narrow the order fulfillment dataset and preview the results.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void applyFilters()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59]"
                  >
                    Apply filters
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  <FilterChipGroup label="Warehouse" options={warehouses} values={selectedWarehouses} onChange={setSelectedWarehouses} />
                  <FilterChipGroup label="Product Type" options={productTypes} values={selectedProductTypes} onChange={setSelectedProductTypes} />
                  <FilterChipGroup label="Priority" options={priorities} values={selectedPriorities} onChange={setSelectedPriorities} />
                  <FilterChipGroup label="Region" options={regions} values={selectedRegions} onChange={setSelectedRegions} />
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 xl:col-span-2">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Date Range</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
                      <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-900">Filtered Data Preview (first 10 rows)</h3>
                  <button
                    type="button"
                    onClick={() => void downloadRows(filtered.length ? filtered : data, 'filtered_preview_order_fulfillment.csv')}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download filtered preview
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>{filteredTableColumns.map((key) => <th key={key} className="border-b border-slate-200 px-3 py-3 font-semibold">{key}</th>)}</tr>
                    </thead>
                    <tbody>{filteredPreview.map((row, index) => <tr key={index} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50">{filteredTableColumns.map((key) => <td key={`${index}-${key}`} className="max-w-[180px] whitespace-normal px-3 py-3">{formatCell(row[key])}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold">Dynamic KPIs</h3>
                <div className="mt-5 grid gap-6 md:grid-cols-5">
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.orders_count ?? '—'}</p><p className="mt-2 text-slate-500">Orders Tracked</p></article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.sla_breach_rate)}</p><p className="mt-2 text-slate-500">SLA Breach Rate</p></article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatMetric(kpis?.avg_fulfillment_hours)}</p><p className="mt-2 text-slate-500">Avg Fulfillment Hrs</p></article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.qty_accuracy)}</p><p className="mt-2 text-slate-500">Qty Accuracy</p></article>
                  <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{formatPercent(kpis?.short_ship_rate)}</p><p className="mt-2 text-slate-500">Short-Ship Rate</p></article>
                </div>
              </section>
              <section className="aa-card p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">EDA</h3>
                    <p className="mt-1 text-sm text-slate-500">Plotly charts for warehouse mix, SLA trends, fulfillment behavior, and anomaly signals.</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-6 grid-cols-1">
                  {charts.orders_by_warehouse?.length ? (
                    <ChartCard title="Orders by Warehouse">
                      <Plot
                        data={[{ x: (charts.orders_by_warehouse ?? []).map((item: any) => item.Warehouse), y: (charts.orders_by_warehouse ?? []).map((item: any) => item.Count), type: 'bar', marker: { color: '#0F766E' } }]}
                        layout={{ title: 'Orders by Warehouse', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No warehouse chart data yet.</div>}
                  {charts.daily_sla_trend?.length ? (
                    <ChartCard title="Daily Orders & SLA Breach Rate">
                      <Plot
                        data={[
                          { x: (charts.daily_sla_trend ?? []).map((item: any) => item.Order_Date), y: (charts.daily_sla_trend ?? []).map((item: any) => item.Order_Count ?? 0), type: 'bar', name: 'Orders' },
                          { x: (charts.daily_sla_trend ?? []).map((item: any) => item.Order_Date), y: (charts.daily_sla_trend ?? []).map((item: any) => item.SLA_Breach_Flag ?? 0), type: 'scatter', mode: 'lines', name: 'SLA Breach Rate', yaxis: 'y2' },
                        ]}
                        layout={{ title: 'Daily Orders & SLA Breach Rate', yaxis: { title: 'Orders' }, yaxis2: { title: 'SLA Breach Rate', overlaying: 'y', side: 'right' }, margin: { t: 40, r: 40, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.fulfillment_hours_histogram?.length ? (
                    <ChartCard title="Distribution of Fulfillment Hours">
                      <Plot
                        data={[{ x: (charts.fulfillment_hours_histogram ?? []).map((item: any) => (item.bin_start + item.bin_end) / 2), y: (charts.fulfillment_hours_histogram ?? []).map((item: any) => item.count), type: 'bar', marker: { color: '#2563EB' } }]}
                        layout={{ title: 'Distribution of Fulfillment Hours', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.fulfillment_by_product_type?.length ? (
                    <ChartCard title="Fulfillment Time by Product Type">
                      <Plot
                        data={[{ y: (charts.fulfillment_by_product_type ?? []).map((item: any) => item.Total_Fulfillment_Hours), x: (charts.fulfillment_by_product_type ?? []).map((item: any) => item.Product_Type), type: 'box', boxpoints: false }]}
                        layout={{ title: 'Fulfillment Time by Product Type', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.shipping_vs_delay_cost?.length ? (
                    <ChartCard title="Shipping Cost vs Delay Cost">
                      <Plot
                        data={[{ x: (charts.shipping_vs_delay_cost ?? []).map((item: any) => item.Shipping_Cost), y: (charts.shipping_vs_delay_cost ?? []).map((item: any) => item.Delay_Cost), mode: 'markers', type: 'scatter', text: (charts.shipping_vs_delay_cost ?? []).map((item: any) => item.Priority ?? ''), marker: { color: (charts.shipping_vs_delay_cost ?? []).map((item: any) => item.Priority === 'High' ? '#DC2626' : item.Priority === 'Medium' ? '#F59E0B' : '#0F766E') } }]}
                        layout={{ title: 'Shipping Cost vs Delay Cost', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.warehouse_product_heatmap?.warehouses?.length ? (
                    <ChartCard title="Avg Fulfillment Hours: Warehouse vs Product Type">
                      <Plot
                        data={[{ z: charts.warehouse_product_heatmap.values, x: charts.warehouse_product_heatmap.product_types, y: charts.warehouse_product_heatmap.warehouses, type: 'heatmap', colorscale: 'Viridis' }]}
                        layout={{ title: 'Avg Fulfillment Hours: Warehouse vs Product Type', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.root_cause_frequency?.length ? (
                    <ChartCard title="Root Cause Frequency">
                      <Plot
                        data={[{ x: (charts.root_cause_frequency ?? []).map((item: any) => item.Root_Cause), y: (charts.root_cause_frequency ?? []).map((item: any) => item.Count), type: 'bar', marker: { color: '#F59E0B' } }]}
                        layout={{ title: 'Root Cause Frequency', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.priority_mix?.length ? (
                    <ChartCard title="Order Priority Mix">
                      <Plot
                        data={[{ labels: (charts.priority_mix ?? []).map((item: any) => item.Priority), values: (charts.priority_mix ?? []).map((item: any) => item.Count), type: 'pie', hole: 0.35, marker: { colors: ['#0F766E', '#F59E0B', '#2563EB', '#DC2626'] } }]}
                        layout={{ title: 'Order Priority Mix', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.fulfillment_cdf?.length ? (
                    <ChartCard title="Cumulative Fulfillment Time (CDF)">
                      <Plot
                        data={[{ x: (charts.fulfillment_cdf ?? []).map((item: any) => item.hours), y: (charts.fulfillment_cdf ?? []).map((item: any) => item.cdf), type: 'scatter', mode: 'lines', line: { color: '#2563EB', width: 3 } }]}
                        layout={{ title: 'Cumulative Fulfillment Time (CDF)', xaxis: { title: 'Total_Fulfillment_Hours' }, yaxis: { title: 'CDF' }, margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.qty_accuracy_vs_fulfillment?.length ? (
                    <ChartCard title="Qty Accuracy vs Fulfillment Time">
                      <Plot
                        data={[{ x: (charts.qty_accuracy_vs_fulfillment ?? []).map((item: any) => item.Total_Fulfillment_Hours), y: (charts.qty_accuracy_vs_fulfillment ?? []).map((item: any) => item.Qty_Accuracy), mode: 'markers', type: 'scatter', marker: { color: (charts.qty_accuracy_vs_fulfillment ?? []).map((item: any) => item.Short_Ship_Flag ? '#DC2626' : '#0F766E') } }]}
                        layout={{ title: 'Qty Accuracy vs Fulfillment Time', xaxis: { title: 'Total_Fulfillment_Hours' }, yaxis: { title: 'Qty_Accuracy' }, margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.delay_type_distributions?.length ? (
                    <ChartCard title="Delay Type Distribution (Small Multiples)">
                      <Plot
                        data={((charts.delay_type_distributions ?? []) as any[]).reduce((acc: any[], row: any) => {
                          acc.push({ x: [row.bin_start, row.bin_end], y: [row.count, row.count], type: 'bar', name: row.delay_type, marker: { color: '#38BDF8' } })
                          return acc
                        }, [])}
                        layout={{ title: 'Delay Type Distribution', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.avg_fulfillment_by_region?.length ? (
                    <ChartCard title="Avg Fulfillment by Region">
                      <Plot
                        data={[{ x: (charts.avg_fulfillment_by_region ?? []).map((item: any) => item.Region), y: (charts.avg_fulfillment_by_region ?? []).map((item: any) => item.Total_Fulfillment_Hours), type: 'bar', marker: { color: '#2563EB' } }]}
                        layout={{ title: 'Avg Fulfillment by Region', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                  {charts.top10_delay_cost?.length ? (
                    <ChartCard title="Top 10 Orders by Delay Cost">
                      <Plot
                        data={[{ x: (charts.top10_delay_cost ?? []).map((item: any) => item.Order_ID), y: (charts.top10_delay_cost ?? []).map((item: any) => item.Delay_Cost), type: 'bar', marker: { color: '#7C3AED' } }]}
                        layout={{ title: 'Top 10 Orders by Delay Cost', margin: { t: 40, r: 20, b: 40, l: 40 } }}
                        useResizeHandler
                        style={{ width: '100%', height: '420px' }}
                      />
                    </ChartCard>
                  ) : null}
                </div>
              </section>

              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Machine Learning & Predictions</h2>
                <div className="mt-5 grid gap-6 grid-cols-1">
                  {mlClassifier ? (
                    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">1) Classification — Predict SLA Breach</h3>
                          <p className="mt-1 text-sm text-slate-500">RandomForestClassifier with StandardScaler + OneHotEncoder.</p>
                        </div>
                        <button type="button" onClick={() => void downloadRows(mlClassifier.predictions ?? [], 'sla_breach_predictions.csv')} className="aa-button aa-button-secondary">Download classification results</button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                        <span className="rounded-full bg-white px-3 py-1.5">Accuracy: {formatMetric(mlClassifier.accuracy, 3)}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">ROC AUC: {formatMetric(mlClassifier.roc_auc, 3)}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">Test rows: {mlClassifier.test_size ?? '—'}</span>
                      </div>
                      <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3 font-semibold text-left">Processing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Picking_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Packing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Dispatch_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Transport_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Order_Qty</th><th className="px-3 py-3 font-semibold text-left">Fulfilled_Qty</th><th className="px-3 py-3 font-semibold text-left">Shipping_Cost</th><th className="px-3 py-3 font-semibold text-left">Delay_Cost</th><th className="px-3 py-3 font-semibold text-left">Warehouse</th><th className="px-3 py-3 font-semibold text-left">Product_Type</th><th className="px-3 py-3 font-semibold text-left">Priority</th><th className="px-3 py-3 font-semibold text-left">Region</th><th className="px-3 py-3 font-semibold text-left">Channel</th><th className="px-3 py-3 font-semibold text-left">Actual_SLA_Breach</th><th className="px-3 py-3 font-semibold text-left">Predicted_Prob</th><th className="px-3 py-3 font-semibold text-left">Predicted_Label</th></tr></thead><tbody>{(mlClassifier.predictions ?? []).slice(0, 8).map((row: any, index: number) => <tr key={index} className="border-t border-slate-100 align-top text-slate-700 hover:bg-slate-50"><td className="px-3 py-3">{formatMetric(row.Processing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Picking_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Packing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Dispatch_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Transport_Delay_Hrs, 2)}</td><td className="px-3 py-3">{row.Order_Qty ?? '—'}</td><td className="px-3 py-3">{row.Fulfilled_Qty ?? '—'}</td><td className="px-3 py-3">{formatMetric(row.Shipping_Cost, 2)}</td><td className="px-3 py-3">{formatMetric(row.Delay_Cost, 2)}</td><td className="px-3 py-3">{row.Warehouse ?? '—'}</td><td className="px-3 py-3">{row.Product_Type ?? '—'}</td><td className="px-3 py-3">{row.Priority ?? '—'}</td><td className="px-3 py-3">{row.Region ?? '—'}</td><td className="px-3 py-3">{row.Channel ?? '—'}</td><td className="px-3 py-3">{row.Actual_SLA_Breach ?? '—'}</td><td className="px-3 py-3">{formatMetric(row.Predicted_Prob, 4)}</td><td className="px-3 py-3">{row.Predicted_Label ?? '—'}</td></tr>)}</tbody></table>
                      </div>
                    </article>
                  ) : (
                    <article className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Classification results will appear once the filtered dataset is analyzed.</article>
                  )}
                  {mlRegressor ? (
                    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">2) Regression — Predict Total Fulfillment Hours</h3>
                          <p className="mt-1 text-sm text-slate-500">RandomForestRegressor with RMSE and R² metrics.</p>
                        </div>
                        <button type="button" onClick={() => void downloadRows(mlRegressor.predictions ?? [], 'fulfillment_regression_predictions.csv')} className="aa-button aa-button-secondary">Download regression results</button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                        <span className="rounded-full bg-white px-3 py-1.5">RMSE: {formatMetric(mlRegressor.rmse, 3)}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">R²: {formatMetric(mlRegressor.r2, 3)}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">Test rows: {mlRegressor.test_size ?? '—'}</span>
                      </div>
                      <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3 font-semibold text-left">Processing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Picking_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Packing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Dispatch_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Transport_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Order_Qty</th><th className="px-3 py-3 font-semibold text-left">Fulfilled_Qty</th><th className="px-3 py-3 font-semibold text-left">Shipping_Cost</th><th className="px-3 py-3 font-semibold text-left">Delay_Cost</th><th className="px-3 py-3 font-semibold text-left">Warehouse</th><th className="px-3 py-3 font-semibold text-left">Product_Type</th><th className="px-3 py-3 font-semibold text-left">Priority</th><th className="px-3 py-3 font-semibold text-left">Region</th><th className="px-3 py-3 font-semibold text-left">Channel</th><th className="px-3 py-3 font-semibold text-left">Actual_Fulfillment_Hrs</th><th className="px-3 py-3 font-semibold text-left">Pred_Fulfillment_Hrs</th></tr></thead><tbody>{(mlRegressor.predictions ?? []).slice(0, 8).map((row: any, index: number) => <tr key={index} className="border-t border-slate-100 align-top text-slate-700 hover:bg-slate-50"><td className="px-3 py-3">{formatMetric(row.Processing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Picking_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Packing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Dispatch_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Transport_Delay_Hrs, 2)}</td><td className="px-3 py-3">{row.Order_Qty ?? '—'}</td><td className="px-3 py-3">{row.Fulfilled_Qty ?? '—'}</td><td className="px-3 py-3">{formatMetric(row.Shipping_Cost, 2)}</td><td className="px-3 py-3">{formatMetric(row.Delay_Cost, 2)}</td><td className="px-3 py-3">{row.Warehouse ?? '—'}</td><td className="px-3 py-3">{row.Product_Type ?? '—'}</td><td className="px-3 py-3">{row.Priority ?? '—'}</td><td className="px-3 py-3">{row.Region ?? '—'}</td><td className="px-3 py-3">{row.Channel ?? '—'}</td><td className="px-3 py-3">{formatMetric(row.Actual_Fulfillment_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Pred_Fulfillment_Hrs, 2)}</td></tr>)}</tbody></table>
                      </div>
                    </article>
                  ) : (
                    <article className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Regression results will appear once the filtered dataset is analyzed.</article>
                  )}
                  {clustering ? (
                    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">3) Clustering — Order Archetypes</h3>
                          <p className="mt-1 text-sm text-slate-500">Use the slider to refresh KMeans results on the current filtered data.</p>
                        </div>
                        <button type="button" onClick={() => void downloadRows((clustering.cluster_counts ?? []).concat(clustering.cluster_centers ?? []), 'clustering_results.csv')} className="aa-button aa-button-secondary">Download clustering results</button>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white p-4">
                        <div className="flex items-center gap-4">
                          <label className="text-sm font-semibold text-slate-700">K clusters</label>
                          <Slider min={2} max={8} step={1} value={[clusterCount]} onValueChange={(value) => setClusterCount(value[0])} className="h-4" />
                          <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-semibold text-[#065F46]">{clusterCount}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 grid-cols-1">
                        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4">
                          <h4 className="text-sm font-semibold text-slate-700">Cluster counts</h4>
                          <table className="mt-3 min-w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3 font-semibold text-left">cluster</th><th className="px-3 py-3 font-semibold text-left">count</th></tr></thead><tbody>{(clustering.cluster_counts ?? []).map((row: any, index: number) => <tr key={index} className="border-t border-slate-100 align-top text-slate-700 hover:bg-slate-50"><td className="px-3 py-3">{row.cluster}</td><td className="px-3 py-3">{row.count}</td></tr>)}</tbody></table>
                        </div>
                        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4">
                          <h4 className="text-sm font-semibold text-slate-700">Cluster centers</h4>
                          <table className="mt-3 min-w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3 font-semibold text-left">cluster</th><th className="px-3 py-3 font-semibold text-left">Processing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Picking_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Packing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Dispatch_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Transport_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Total_Fulfillment_Hours</th><th className="px-3 py-3 font-semibold text-left">Order_Qty</th><th className="px-3 py-3 font-semibold text-left">Delay_Cost</th></tr></thead><tbody>{(clustering.cluster_centers ?? []).map((row: any, index: number) => <tr key={index} className="border-t border-slate-100 align-top text-slate-700 hover:bg-slate-50"><td className="px-3 py-3">{row.cluster}</td><td className="px-3 py-3">{formatMetric(row.Processing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Picking_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Packing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Dispatch_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Transport_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Total_Fulfillment_Hours, 2)}</td><td className="px-3 py-3">{row.Order_Qty ?? '—'}</td><td className="px-3 py-3">{formatMetric(row.Delay_Cost, 2)}</td></tr>)}</tbody></table>
                        </div>
                      </div>
                      {clustering.scatter_data?.length ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-3 text-xl font-semibold text-slate-900">Clusters : fulfillment vs delay cost</h4>
                          <Plot data={[{ x: (clustering.scatter_data ?? []).map((item: any) => item.Total_Fulfillment_Hours), y: (clustering.scatter_data ?? []).map((item: any) => item.Delay_Cost), mode: 'markers', type: 'scatter', text: (clustering.scatter_data ?? []).map((item: any) => `Cluster ${item._cluster ?? item.cluster}`), marker: { color: (clustering.scatter_data ?? []).map((item: any) => item._cluster ?? item.cluster), colorscale: 'Viridis', size: 12 } }]}
                            layout={{ title: '', xaxis: { title: 'Total_Fulfillment_Hours' }, yaxis: { title: 'Delay_Cost' }, margin: { t: 20, r: 20, b: 40, l: 40 } }}
                            useResizeHandler
                            style={{ width: '100%', height: '520px' }} />
                        </div>
                      ) : null}
                    </article>
                  ) : (
                    <article className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Clustering results will appear once the filtered dataset is analyzed.</article>
                  )}
                  {anomalies ? (
                    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">4) Anomaly Detection — IsolationForest</h3>
                          <p className="mt-1 text-sm text-slate-500">IsolationForest flags approximately 2% of orders as anomalies.</p>
                        </div>
                        <button type="button" onClick={() => void downloadRows(anomalies.anomalies ?? [], 'anomaly_orders.csv')} className="aa-button aa-button-secondary">Download anomaly results</button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                        <span className="rounded-full bg-white px-3 py-1.5">Detected anomalies: {anomalies.num_anomalies ?? 0}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">Anomaly rate: {formatMetric(anomalies.anomaly_rate, 2)}%</span>
                      </div>
                      <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3 font-semibold text-left">Order_ID</th><th className="px-3 py-3 font-semibold text-left">Processing_Delay_Hrs</th><th className="px-3 py-3 font-semibold text-left">Delay_Cost</th><th className="px-3 py-3 font-semibold text-left">_is_anomaly</th></tr></thead><tbody>{(anomalies.anomalies ?? []).slice(0, 8).map((row: any, index: number) => <tr key={index} className="border-t border-slate-100 align-top text-slate-700 hover:bg-slate-50"><td className="px-3 py-3">{row.Order_ID ?? '—'}</td><td className="px-3 py-3">{formatMetric(row.Processing_Delay_Hrs, 2)}</td><td className="px-3 py-3">{formatMetric(row.Delay_Cost, 2)}</td><td className="px-3 py-3">{row._is_anomaly ?? '—'}</td></tr>)}</tbody></table>
                      </div>
                    </article>
                  ) : (
                    <article className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Anomaly detection results will appear once the filtered dataset is analyzed.</article>
                  )}
                </div>
              </section>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
<section className="aa-card p-8"><h2 className="text-2xl font-bold">Automated Insights</h2>{insights.length ? <div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500"><th className="pb-3">Insight</th><th className="pb-3">Entity</th><th className="pb-3">Metric</th><th className="pb-3">Action</th></tr></thead><tbody>{insights.map((row,index)=><tr key={index} className="border-t border-slate-100"><td className="py-3 font-semibold text-slate-700">{row.Insight_Type}</td><td className="py-3 text-slate-600">{row.Entity}</td><td className="py-3 text-slate-600">{String(row.Value ?? '')}</td><td className="py-3 text-slate-600">{row.Action}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-slate-500">Insights will appear once the filtered dataset is analyzed.</p>}</section>
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Playbooks</h2>{Object.keys(playbooks).length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(playbooks).map(([key, list]) => <article key={key} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-semibold capitalize">{key.replace(/_/g,' ')}</h3><p className="mt-2 text-sm text-slate-500">{Array.isArray(list) ? `${list.length} items` : `${Object.keys(list as any).length} summary fields`}</p></article>)}</div> : <p className="mt-4 text-slate-500">Playbooks will be populated from the backend response.</p>}</section>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

