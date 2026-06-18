import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Download, Loader2, UploadCloud } from 'lucide-react'
import Plot from 'react-plotly.js'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'

const API_BASE_URL =
  import.meta.env.VITE_MARKETING_ANALYTICS_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8025'

const REQUIRED_FIELDS = ['Campaign', 'Channel', 'Date', 'Impressions', 'Clicks', 'Leads', 'Conversions', 'Spend']

const CHANNEL_COLORS: Record<string, string> = {
  Facebook: '#0F766E',
  Instagram: '#2563EB',
  'Google Ads': '#F59E0B',
  LinkedIn: '#8B5CF6',
  YouTube: '#EC4899',
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Request failed'
    throw new Error(message)
  }
  return response.json()
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '₹0'
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.00%'
  return `${value.toFixed(2)}%`
}

function toggleSelection(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function MarketingCampaignPerformanceAnalyzerProjectPage() {
  const [mode, setMode] = useState<'default' | 'upload' | 'mapping'>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [channels, setChannels] = useState<string[]>([])
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [kpis, setKpis] = useState<any>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [charts, setCharts] = useState<any>({})
  const [insights, setInsights] = useState<any[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const preview = useMemo(() => previewRows.slice(0, 8), [previewRows])

  useEffect(() => {
    void loadDefault()
  }, [])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    try {
      const res = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setCampaigns((res.campaigns ?? []).map(String))
      setChannels((res.channels ?? []).map(String))
      setKpis(res.kpis ?? null)
      await analyzeRows(res.data ?? [])
      setStatusMessage('Default dataset loaded successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load the default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function analyzeRows(rows: any[]) {
    if (!rows.length) {
      setCharts({})
      setInsights([])
      return
    }

    try {
      const chartRes = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setCharts(chartRes)
    } catch {
      setCharts({})
    }

    try {
      const insightsRes = await fetch(`${API_BASE_URL}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      }).then(handleResponse)
      setInsights(insightsRes.insights ?? [])
    } catch {
      setInsights([])
    }
  }

  async function applyFilters() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, campaigns: selectedCampaigns, channels: selectedChannels }),
      }).then(handleResponse)
      const filteredRows = res.data ?? []
      setFiltered(filteredRows)
      setPreviewRows(res.preview ?? filteredRows.slice(0, 8))
      setKpis(res.kpis ?? null)
      await analyzeRows(filteredRows)
      setStatusMessage('Filters applied successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to apply filters.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setMode('upload')
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE_URL}/upload-csv`, { method: 'POST', body: formData }).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setCampaigns((res.campaigns ?? []).map(String))
      setChannels((res.channels ?? []).map(String))
      setKpis(res.kpis ?? null)
      await analyzeRows(res.data ?? [])
      setStatusMessage('File uploaded successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to upload the CSV file.')
    } finally {
      setLoading(false)
    }
  }

  async function inspectColumns(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setMode('mapping')
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE_URL}/get-columns`, { method: 'POST', body: formData }).then(handleResponse)
      setFileColumns(res.columns ?? [])
      setMapping(Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, ''])))
      setStatusMessage('Choose the matching columns for the required fields.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to inspect uploaded columns.')
    } finally {
      setLoading(false)
    }
  }

  async function applyMapping() {
    if (!uploadFile) {
      setError('Please upload a CSV before applying mapping.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      Object.entries(mapping).forEach(([field, value]) => formData.append(field.toLowerCase(), value))
      const res = await fetch(`${API_BASE_URL}/apply-mapping`, { method: 'POST', body: formData }).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setCampaigns((res.campaigns ?? []).map(String))
      setChannels((res.channels ?? []).map(String))
      setKpis(res.kpis ?? null)
      await analyzeRows(res.data ?? [])
      setStatusMessage('Column mapping applied successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to apply the mapping.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadFilteredCsv() {
    try {
      const res = await fetch(`${API_BASE_URL}/download-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: filtered.length ? filtered : data }),
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'marketing_filtered.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to download the filtered dataset.')
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6 text-[#0F172A]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[28px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">Marketing Analytics</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0F172A] md:text-4xl">Marketing Campaign Performance Analyzer</h1>
          <p className="mt-3 max-w-3xl text-[15px] text-[#475569]">Analyze ROI, conversion efficiency, and campaign reach with a data-first dashboard that supports default data, CSV upload, and column mapping.</p>
        </section>

        <Tabs defaultIndex={0} className="space-y-6">
          <TabList className="flex flex-wrap gap-3 rounded-[24px] border border-[#E2E8F0] bg-white p-2 shadow-sm">
            <Tab className="cursor-pointer rounded-2xl px-4 py-2 text-sm font-semibold text-[#334155] data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Overview</Tab>
            <Tab className="cursor-pointer rounded-2xl px-4 py-2 text-sm font-semibold text-[#334155] data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Important Attributes</Tab>
            <Tab className="cursor-pointer rounded-2xl px-4 py-2 text-sm font-semibold text-[#334155] data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Application</Tab>
          </TabList>

          <TabPanel>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F172A]">Purpose</h2>
                <p className="mt-3 text-[15px] text-[#475569]">This analyzer consolidates impressions, clicks, leads, conversions, and spend into one dashboard to simplify ROI decisions and highlight high-performing campaigns.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {['Full-funnel analytics', 'Creative performance analysis', 'Geo performance analysis', 'Budget allocation guidance'].map((item) => (
                    <div key={item} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#334155]">{item}</div>
                  ))}
                </div>
              </article>
              <article className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F172A]">Business Impact</h2>
                <ul className="mt-4 space-y-3 text-[15px] text-[#475569]">
                  <li>• Reduce wasted ad spend and improve campaign ROI.</li>
                  <li>• Benchmark creative and channel performance in one view.</li>
                  <li>• Identify anomalies and optimize budget allocation faster.</li>
                </ul>
              </article>
            </div>
          </TabPanel>

          <TabPanel>
            <article className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0F172A]">Required Columns</h2>
              <p className="mt-2 text-sm text-[#475569]">These fields drive filtering, KPI calculation, and performance insights across the dashboard.</p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#E2E8F0]">
                <table className="min-w-full divide-y divide-[#E2E8F0] text-sm">
                  <thead className="bg-[#F8FAFC] text-left text-[#475569]">
                    <tr><th className="px-4 py-3">Attribute</th><th className="px-4 py-3">Description</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {REQUIRED_FIELDS.map((field) => <tr key={field}><td className="px-4 py-3 font-semibold text-[#0F172A]">{field}</td><td className="px-4 py-3 text-[#475569]">Marketing metric used for campaign ROI and performance analysis.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </article>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F172A]">Dataset Modes</h2>
                <p className="mt-2 text-sm text-[#475569]">Choose how to load the marketing dataset for analysis.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    ['default', 'Default dataset', 'Load the hosted marketing dataset automatically from the backend.'],
                    ['upload', 'Upload CSV', 'Upload a CSV file and analyze it directly.'],
                    ['mapping', 'Upload CSV + Column Mapping', 'Upload a CSV and map custom column names before analysis.'],
                  ].map(([value, title, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value as 'default' | 'upload' | 'mapping')}
                      className={`rounded-[24px] border p-5 text-left ${mode === value ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}
                    >
                      <p className="text-lg font-semibold text-[#0F172A]">{title}</p>
                      <p className="mt-2 text-sm text-[#475569]">{description}</p>
                    </button>
                  ))}
                </div>
              </section>

              {(mode === 'upload' || mode === 'mapping') && (
                <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F172A]">Step 1: Upload Area</h3>
                      <p className="mt-1 text-sm text-[#475569]">Drag and drop a CSV file or browse from your device. Accepted format: CSV. Max size: 200 MB.</p>
                    </div>
                    <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#065F46]">CSV Upload</span>
                  </div>
                  <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-[#0F766E] bg-[#F0FDFA] p-8 text-center transition hover:bg-[#ECFEFF]">
                    <UploadCloud className="h-8 w-8 text-[#0F766E]" />
                    <span className="text-base font-semibold text-[#0F172A]">Drop your CSV here or browse files</span>
                    <span className="text-sm text-[#475569]">Accepted format: CSV • Max size: 200 MB</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={mode === 'mapping' ? inspectColumns : handleUpload}
                    />
                    <span className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A]">Browse Files</span>
                  </label>
                  {uploadFile ? <p className="mt-4 text-sm text-[#475569]">Selected file: {uploadFile.name}</p> : null}
                </section>
              )}

              {mode === 'mapping' && fileColumns.length > 0 ? (
                <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F172A]">Step 2: Column Mapping</h3>
                      <p className="mt-1 text-sm text-[#475569]">Map the uploaded CSV columns to the required marketing fields before the dashboard analyzes your file.</p>
                    </div>
                    <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#065F46]">Mapping</span>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {REQUIRED_FIELDS.map((field) => (
                      <label key={field} className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
                        <span className="mb-2 block font-semibold text-[#0F172A]">Map → {field}</span>
                        <select
                          value={mapping[field] ?? ''}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}
                          className="w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A]"
                        >
                          <option value="">-- Skip --</option>
                          {fileColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={applyMapping} className="mt-5 rounded-2xl bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white">Apply Mapping</button>
                </section>
              ) : null}

              {mode === 'default' ? (
                <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F172A]">Default Dataset</h3>
                      <p className="mt-1 text-sm text-[#475569]">Reload the hosted marketing dataset from the backend whenever you want to reset the dashboard.</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadDefault}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59]"
                    >
                      Load Default Data
                    </button>
                  </div>
                </section>
              ) : null}

              <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0F172A]">STEP 2 — FILTERS & PREVIEW</h3>
                    <p className="mt-1 text-sm text-[#475569]">Use the filters below to narrow the campaign dataset and preview the results before you analyze the KPI cards and insights.</p>
                  </div>
                  <button type="button" onClick={applyFilters} className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59]">Apply filters</button>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] uppercase tracking-[0.18em] text-[#0F766E]">Campaign filter</p>
                      <span className="text-xs text-[#475569]">Multi-select</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {campaigns.map((item) => {
                        const active = selectedCampaigns.includes(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSelectedCampaigns((prev) => toggleSelection(prev, item))}
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${active ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#ECFDF5]'}`}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] uppercase tracking-[0.18em] text-[#0F766E]">Channel filter</p>
                      <span className="text-xs text-[#475569]">Multi-select</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {channels.map((item) => {
                        const active = selectedChannels.includes(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSelectedChannels((prev) => toggleSelection(prev, item))}
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${active ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#ECFDF5]'}`}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-[#475569]">{statusMessage ?? 'Select filters and apply them to update the dashboard.'}</div>
                  <button type="button" onClick={downloadFilteredCsv} className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]">Download Filtered Dataset</button>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <h4 className="text-lg font-semibold text-[#0F172A]">Filtered Data Preview (first 8 rows)</h4>
                </div>

                {preview.length ? <div className="mt-4 overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white"><table className="min-w-full divide-y divide-[#E2E8F0] text-sm"><thead className="bg-[#F8FAFC] text-left text-[#475569]"><tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">Leads</th><th className="px-4 py-3">Spend</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{preview.map((row, idx) => <tr key={idx} className="align-top text-[#475569] hover:bg-[#F8FAFC]"><td className="px-4 py-3 text-[#0F172A]">{String(row.Campaign ?? '')}</td><td className="px-4 py-3">{String(row.Channel ?? '')}</td><td className="px-4 py-3">{String(row.Date ?? '')}</td><td className="px-4 py-3">{String(row.Clicks ?? '')}</td><td className="px-4 py-3">{String(row.Leads ?? '')}</td><td className="px-4 py-3">{String(row.Spend ?? '')}</td></tr>)}</tbody></table></div> : <div className="mt-4 rounded-[24px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#475569]">No preview rows are available yet. Apply filters or upload a CSV to populate the table.</div>}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <article className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[#0F172A]">KPI Snapshot</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {[
                      ['Total Impressions', kpis?.total_impressions ?? 0],
                      ['Total Clicks', kpis?.total_clicks ?? 0],
                      ['Total Leads', kpis?.total_leads ?? 0],
                      ['Total Spend', formatCurrency(kpis?.total_spend ?? 0)],
                    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-xs uppercase tracking-[0.18em] text-[#0F766E]">{label}</p><p className="mt-1 text-2xl font-semibold text-[#0F172A]">{String(value)}</p></div>)}
                  </div>
                </article>
                <article className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[#0F172A]">Insights</h2>
                  <div className="mt-4 space-y-3 text-sm text-[#475569]">{insights.length ? insights.map((item, idx) => <div key={idx} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">{item.Insight}: {item.Value}</div>) : <p>No insights available yet.</p>}</div>
                </article>
              </section>

              <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0F172A]">Charts</h2>
                    <p className="mt-1 text-sm text-[#475569]">Plotly visualizations for campaign engagement, lead mix, and spend efficiency.</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-6">
                  <article className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                    <h3 className="text-lg font-semibold text-[#0F172A]">Campaign-wise Clicks</h3>
                    {charts.campaign_clicks?.length ? (
                      <div className="mt-4 h-[440px] rounded-[20px] bg-white p-2">
                        <Plot
                          data={[
                            {
                              type: 'bar',
                              x: charts.campaign_clicks.map((item: any) => item.Campaign),
                              y: charts.campaign_clicks.map((item: any) => item.Clicks),
                              text: charts.campaign_clicks.map((item: any) => item.Clicks),
                              textposition: 'outside',
                              marker: { color: '#1976d2' },
                            },
                          ]}
                          layout={{ title: '', xaxis: { title: 'Campaign' }, yaxis: { title: 'Clicks' }, autosize: true }}
                          style={{ width: '100%', height: '100%' }}
                          useResizeHandler
                        />
                      </div>
                    ) : <p className="mt-4 text-sm text-[#475569]">Campaign click chart will appear once the filtered dataset is analyzed.</p>}
                  </article>

                  <article className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                    <h3 className="text-lg font-semibold text-[#0F172A]">Channel-wise Leads</h3>
                    {charts.channel_leads?.length ? (
                      <div className="mt-4 h-[420px] rounded-[20px] bg-white p-2">
                        <Plot
                          data={[{ labels: charts.channel_leads.map((item: any) => item.Channel), values: charts.channel_leads.map((item: any) => item.Leads), type: 'pie', hole: 0.35, marker: { colors: ['#0F766E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'] } }]}
                          layout={{ margin: { t: 18, l: 10, r: 10, b: 10 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }}
                          useResizeHandler
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    ) : <p className="mt-4 text-sm text-[#475569]">Channel lead chart will appear once the filtered dataset is analyzed.</p>}
                  </article>

                  <article className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                    <h3 className="text-lg font-semibold text-[#0F172A]">Spend vs Conversions</h3>
                    {charts.spend_vs_conversions?.length ? (
                      <div className="mt-4 h-[480px] rounded-[20px] bg-white p-2">
                        <Plot
                          data={[
                            {
                              type: 'scatter',
                              mode: 'markers',
                              x: charts.spend_vs_conversions.map((item: any) => item.Spend),
                              y: charts.spend_vs_conversions.map((item: any) => item.Conversions),
                              marker: {
                                size: charts.spend_vs_conversions.map((item: any) => item.Impressions / 5000),
                                sizemode: 'area',
                              },
                              text: charts.spend_vs_conversions.map((item: any) => `Campaign: ${item.Campaign}<br>Channel: ${item.Channel}`),
                              hoverinfo: 'text+x+y',
                            },
                          ]}
                          layout={{ xaxis: { title: 'Spend' }, yaxis: { title: 'Conversions' }, autosize: true }}
                          style={{ width: '100%', height: '100%' }}
                          useResizeHandler
                        />
                      </div>
                    ) : <p className="mt-4 text-sm text-[#475569]">Spend vs conversion chart will appear once the filtered dataset is analyzed.</p>}
                  </article>
                </div>
              </section>

              {error ? <p className="rounded-[24px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">{error}</p> : null}
            </div>
          </TabPanel>
        </Tabs>

        {loading ? <div className="flex items-center gap-2 text-sm text-[#0F766E]"><Loader2 className="h-4 w-4 animate-spin" />Loading analytics data…</div> : null}
      </div>
    </main>
  )
}
