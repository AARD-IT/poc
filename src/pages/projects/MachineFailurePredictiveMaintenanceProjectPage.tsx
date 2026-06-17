import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import Plot from 'react-plotly.js'
import { ProjectDetailCardSkeleton } from '@/components/projects/ProjectDetailCard'

const API_BASE_URL =
  import.meta.env.VITE_MACHINE_FAILURE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8020'

const REQUIRED_FIELDS = [
  'Timestamp',
  'Machine_ID',
  'Machine_Type',
  'Temperature',
  'Vibration',
  'RPM',
  'Load',
  'Run_Hours',
  'Temp_Anomaly',
  'Vib_Anomaly',
  'Load_Anomaly',
  'RPM_Anomaly',
  'Failure_Flag',
]

const QUERY_PARAM_MAP: Record<string, string> = {
  Timestamp: 'timestamp',
  Machine_ID: 'machine_id',
  Machine_Type: 'machine_type',
  Temperature: 'temperature',
  Vibration: 'vibration',
  RPM: 'rpm',
  Load: 'load',
  Run_Hours: 'run_hours',
  Temp_Anomaly: 'temp_anomaly',
  Vib_Anomaly: 'vib_anomaly',
  Load_Anomaly: 'load_anomaly',
  RPM_Anomaly: 'rpm_anomaly',
  Failure_Flag: 'failure_flag',
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Request failed'
    throw new Error(message)
  }
  return response.json()
}

export function MachineFailurePredictiveMaintenanceProjectPage() {
  const [mode, setMode] = useState<'default' | 'upload' | 'mapping'>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [machineIds, setMachineIds] = useState<string[]>([])
  const [machineTypes, setMachineTypes] = useState<string[]>([])
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([])
  const [selectedMachineTypes, setSelectedMachineTypes] = useState<string[]>([])

  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>({})
  const [mlResult, setMlResult] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const dataPreview = useMemo(() => {
    if (filtered.length) return filtered.slice(0, 10)
    if (previewRows.length) return previewRows.slice(0, 10)
    return data.slice(0, 10)
  }, [filtered, previewRows, data])

  const tableColumns = useMemo(() => {
    const sample = dataPreview[0] ?? previewRows[0] ?? data[0] ?? {}
    return Object.keys(sample)
  }, [dataPreview, previewRows, data])

  const formatCell = (value: unknown) => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(4)
    return String(value)
  }

  useEffect(() => {
    void loadDefault()
  }, [])

  useEffect(() => {
    if (!data.length) return
    void analyzeRows(data, selectedMachineIds, selectedMachineTypes)
  }, [data, selectedMachineIds, selectedMachineTypes])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    setSelectedMachineIds([])
    setSelectedMachineTypes([])

    try {
      const res = await fetch(`${API_BASE_URL}/load-default`).then(handleResponse)
      setData(res.data ?? [])
      setFiltered(res.data ?? [])
      setPreviewRows(res.preview ?? [])
      setMachineIds((res.machine_ids ?? []).map(String))
      setMachineTypes((res.machine_types ?? []).map(String))
      await analyzeRows(res.data ?? [])
      setKpis({ machines_tracked: res.total_rows, avg_temperature: null, avg_vibration: null, failure_events: 0 })
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function analyzeRows(
    rows: any[],
    machineIdsToUse = selectedMachineIds,
    machineTypesToUse = selectedMachineTypes,
  ) {
    if (!rows.length) {
      setKpis(null)
      setCharts({})
      setMlResult(null)
      setInsights([])
      return
    }

    try {
      const filterRes = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
          machine_ids: machineIdsToUse.length ? machineIdsToUse : undefined,
          machine_types: machineTypesToUse.length ? machineTypesToUse : undefined,
        }),
      }).then(handleResponse)
      const filteredRows = filterRes.data ?? rows
      setFiltered(filteredRows)
      setKpis(filterRes.kpis ?? null)
      setPreviewRows(filterRes.preview ?? [])
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
      const mlRes = await fetch(`${API_BASE_URL}/ml/predict-failure`, {
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
      await analyzeRows(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

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
      setMachineIds((uploadRes.machine_ids ?? []).map(String))
      setMachineTypes((uploadRes.machine_types ?? []).map(String))
      setSelectedMachineIds([])
      setSelectedMachineTypes([])
      setMode('upload')
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
      setMode('mapping')
      await analyzeRows(res.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Mapping failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="text-4xl font-bold text-[#0F172A]">Machine Failure & Predictive Maintenance Lab</div>
          <p className="mt-3 max-w-3xl text-slate-600">Track machine telemetry, predict breakdown risk, and surface maintenance actions from the manufacturing analytics backend.</p>
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
                <p className="mt-4 text-slate-600">This lab combines machine sensor telemetry and maintenance events to identify early failure signals, quantify breakdown risk, and support predictive maintenance decisions.</p>
              </section>
              <div className="grid gap-6 md:grid-cols-2">
                <article className="aa-card p-8"><h3 className="text-xl font-semibold">Purpose</h3><ul className="mt-4 space-y-2 text-slate-600"><li>Track temperature, vibration, RPM, load, and anomaly signals</li><li>Calculate failure incidence across machines</li><li>Train ML models to predict failure risk</li><li>Identify high-risk assets</li></ul></article>
                <article className="aa-card p-8"><h3 className="text-xl font-semibold">Business Impact</h3><ul className="mt-4 space-y-2 text-slate-600"><li>Reduced downtime</li><li>Extended machine lifespan</li><li>Lower maintenance costs</li><li>Improved OEE monitoring</li></ul></article>
              </div>
              <div className="grid gap-6 md:grid-cols-4">
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.machines_tracked ?? '—'}</p><p className="mt-2 text-slate-500">Machines Tracked</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.avg_temperature ?? '—'}</p><p className="mt-2 text-slate-500">Average Temperature</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.avg_vibration ?? '—'}</p><p className="mt-2 text-slate-500">Average Vibration</p></article>
                <article className="aa-card p-6 text-center"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.failure_events ?? '—'}</p><p className="mt-2 text-slate-500">Failure Events</p></article>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Required Columns</h2><p className="mt-3 text-slate-600">Core data dictionary used by the predictive maintenance workflow.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{REQUIRED_FIELDS.map((field) => <div key={field} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">{field}</div>)}</div></section>
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Independent Variables</h2><div className="mt-4 flex flex-wrap gap-3">{['Machine_ID','Machine_Type','Temperature','Vibration','RPM','Load','Run_Hours','Temp_Anomaly','Vib_Anomaly','Load_Anomaly','RPM_Anomaly'].map((item) => <span key={item} className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#065F46]">{item}</span>)}</div></section>
              <section className="aa-card p-8"><h2 className="text-2xl font-bold">Dependent Variable</h2><span className="mt-4 inline-flex rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]">Failure_Flag</span></section>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <section className="aa-card p-8">
                <h2 className="text-2xl font-bold">Dataset Source</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {['default','upload','mapping'].map((option) => (
                    <button key={option} type="button" onClick={() => setMode(option as any)} className={`rounded-3xl border p-5 text-left ${mode === option ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-slate-200 bg-white'}`}>
                      <p className="text-lg font-semibold capitalize">{option === 'default' ? 'Default dataset (GitHub)' : option === 'upload' ? 'Upload CSV' : 'Upload CSV + Manual Mapping'}</p>
                      <p className="mt-2 text-sm text-slate-500">{option === 'default' ? 'Load the manufacturing dataset directly from GitHub.' : 'Use your own CSV and map columns when needed.'}</p>
                    </button>
                  ))}
                </div>
              </section>

              {mode === 'default' && (
                <section className="aa-card p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">Default Dataset</h3>
                      <p className="text-slate-500">Load the default machine failure dataset from GitHub.</p>
                    </div>
                    <button type="button" onClick={() => void loadDefault()} className="aa-button aa-button-primary">Reload Default Data</button>
                  </div>
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
                  {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}
                </section>
              )}

              {(mode === 'upload' || mode === 'mapping') && (
                <section className="aa-card p-8">
                  <h3 className="text-xl font-semibold">Upload CSV</h3>
                  <label className="mt-4 block rounded-3xl border border-dashed border-[#CBD5E1] bg-slate-50 p-6 text-center text-slate-600">
                    <input type="file" accept=".csv" className="hidden" onChange={(event) => { void handleUpload(event); void handleGetColumns(event.target.files?.[0] as File) }} />
                    <span className="text-sm font-semibold text-[#0F766E]">Choose a CSV file or drag it here</span>
                  </label>
                  {mode === 'mapping' && fileColumns.length > 0 && (
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {REQUIRED_FIELDS.map((field) => (
                        <label key={field} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                          <span className="mb-2 block font-semibold text-slate-700">{field}</span>
                          <select className="w-full rounded-xl border border-slate-200 p-2" value={mapping[field] ?? ''} onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}>
                            <option value="">-- Select --</option>
                            {fileColumns.map((column) => <option key={column} value={column}>{column}</option>)}
                          </select>
                        </label>
                      ))}
                      <div className="md:col-span-2 xl:col-span-3"><button type="button" onClick={() => void applyMapping()} className="aa-button aa-button-primary">Apply Mapping</button></div>
                    </div>
                  )}
                </section>
              )}

              <section className="aa-card p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">Filters & Preview</h3>
                    <p className="text-slate-500">Use the machine filters below to update the live preview and KPI results from the loaded dataset.</p>
                  </div>
                  <button type="button" onClick={() => void applyFilters()} className="aa-button aa-button-primary">Apply Filters</button>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1fr]">
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Machine ID</p>
                        <div className="mt-3 flex flex-wrap gap-2">{machineIds.map((id) => {
                          const value = String(id)
                          return <button key={value} type="button" onClick={() => setSelectedMachineIds((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className={`rounded-full px-3 py-2 text-sm font-semibold ${selectedMachineIds.includes(value) ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{value}</button>
                        })}</div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Machine Type</p>
                        <div className="mt-3 flex flex-wrap gap-2">{machineTypes.map((type) => {
                          const value = String(type)
                          return <button key={value} type="button" onClick={() => setSelectedMachineTypes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className={`rounded-full px-3 py-2 text-sm font-semibold ${selectedMachineTypes.includes(value) ? 'bg-[#0F766E] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{value}</button>
                        })}</div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#475569]">Live Filter Summary</p>
                      <p className="mt-1 text-2xl font-bold text-[#0F172A]">{filtered.length} of {data.length} rows shown</p>
                    </div>
                  </div>

                </div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold text-slate-900">Live Preview ({Math.min(filtered.length || dataPreview.length, 10)} rows)</h3>
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
                <h3 className="text-xl font-semibold text-slate-900">KPIs (Dynamic)</h3>
                <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{['machines_tracked','avg_temperature','avg_vibration','failure_events'].map((key) => <article key={key} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm"><p className="text-3xl font-bold text-[#0F766E]">{kpis?.[key] ?? '—'}</p><p className="mt-2 text-slate-500">{key.replace(/_/g,' ')}</p></article>)}</div>
              </section>

              <section className="aa-card p-8">
                <h3 className="text-xl font-semibold text-slate-900">Charts & Diagnostics</h3>
                <div className="mt-6 space-y-6">
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h4 className="text-xl font-semibold">Temperature Trend</h4><Plot data={[(charts.temperature_trend ?? []).length ? { x: (charts.temperature_trend ?? []).map((row: any) => row.Timestamp), y: (charts.temperature_trend ?? []).map((row: any) => row.Temperature), type: 'scatter', mode: 'lines', name: 'Temperature' } : { x: [], y: [], type: 'scatter', mode: 'lines' }]} layout={{ margin: { t: 24, l: 40, r: 20, b: 32 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }} style={{ width: '100%', height: 320 }} /></article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h4 className="text-xl font-semibold">Vibration by Machine Type</h4><Plot data={[(charts.vibration_by_type ?? []).length ? { x: (charts.vibration_by_type ?? []).map((row: any) => row.Machine_Type), y: (charts.vibration_by_type ?? []).map((row: any) => row.Vibration), type: 'box', name: 'Vibration' } : { x: [], y: [], type: 'box' }]} layout={{ margin: { t: 24, l: 40, r: 20, b: 32 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }} style={{ width: '100%', height: 320 }} /></article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h4 className="text-xl font-semibold">Temperature vs Load</h4><Plot data={[(charts.temp_vs_load ?? []).length ? { x: (charts.temp_vs_load ?? []).map((row: any) => row.Load), y: (charts.temp_vs_load ?? []).map((row: any) => row.Temperature), mode: 'markers', type: 'scatter', marker: { color: (charts.temp_vs_load ?? []).map((row: any) => row.Failure_Flag ?? 0) } } : { x: [], y: [], mode: 'markers', type: 'scatter' }]} layout={{ margin: { t: 24, l: 40, r: 20, b: 32 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }} style={{ width: '100%', height: 360 }} /></article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h4 className="text-xl font-semibold">ML – Failure Prediction (RandomForest)</h4>{mlResult ? <div className="mt-4 space-y-3 text-slate-600"><p><strong>Model:</strong> {mlResult.model}</p><p><strong>Accuracy:</strong> {mlResult.accuracy_pct}%</p><p><strong>Target:</strong> {mlResult.target}</p><p><strong>Test size:</strong> {mlResult.test_size}</p></div> : <p className="mt-4 text-slate-500">ML results will appear once data is loaded.</p>} {mlResult?.predictions?.length ? <div className="mt-6 overflow-x-auto"><table className="min-w-full border-collapse text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{Object.keys(mlResult.predictions[0]).map((key) => <th key={key} className="border-b border-slate-200 px-3 py-3 font-semibold">{key}</th>)}</tr></thead><tbody>{mlResult.predictions.map((row: any, index: number) => <tr key={index} className="border-b border-slate-100"><td className="px-3 py-3">{formatCell(row.Actual_Failure)}</td><td className="px-3 py-3">{formatCell(row.Predicted_Prob)}</td><td className="px-3 py-3">{formatCell(row.Predicted_Class)}</td></tr>)}</tbody></table></div> : null}</article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h4 className="text-xl font-semibold">ML Prediction</h4>{mlResult?.feature_importance?.length ? <div className="mt-6"><Plot data={[{ x: mlResult.feature_importance.map((item: any) => item.Feature), y: mlResult.feature_importance.map((item: any) => item.Importance), type: 'bar' }]} layout={{ margin: { t: 24, l: 40, r: 20, b: 32 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }} style={{ width: '100%', height: 300 }} /></div> : <p className="mt-4 text-slate-500">Feature importance chart will appear after analysis.</p>}</article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h4 className="text-xl font-semibold">Automated Insights</h4>{insights.length ? <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full border-collapse text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="border-b border-slate-200 px-3 py-3 font-semibold">Insight</th><th className="border-b border-slate-200 px-3 py-3 font-semibold">Entity</th><th className="border-b border-slate-200 px-3 py-3 font-semibold">Metric</th><th className="border-b border-slate-200 px-3 py-3 font-semibold">Action</th></tr></thead><tbody>{insights.map((item, index) => <tr key={index} className="border-b border-slate-100 align-top text-slate-700 hover:bg-slate-50"><td className="px-3 py-3 font-medium text-slate-800">{item.Insight}</td><td className="px-3 py-3">{item.Entity}</td><td className="px-3 py-3">{item.Metric}</td><td className="px-3 py-3">{item.Action}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-slate-500">Insights will appear after analysis.</p>}</article>
                </div>
              </section>
            </div>
          </TabPanel>
        </Tabs>

        {loading && <div className="mt-8"><ProjectDetailCardSkeleton /></div>}
      </div>
    </div>
  )
}
