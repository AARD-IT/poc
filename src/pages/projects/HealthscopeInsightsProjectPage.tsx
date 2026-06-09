import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import Plot from 'react-plotly.js'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { ProjectDetailCardSkeleton } from '@/components/projects/ProjectDetailCard'
import API from '@/services/api'

const API_BASE_URL =
  import.meta.env.VITE_HEALTHSCOPE_INSIGHTS_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8017'

const MAPPING_FIELDS = [
  { label: 'Date', param: 'date' },
  { label: 'Hospital', param: 'hospital' },
  { label: 'Department', param: 'department' },
  { label: 'Doctor', param: 'doctor' },
  { label: 'Patient', param: 'patient' },
  { label: 'AgeGroup', param: 'age_group' },
  { label: 'Gender', param: 'gender' },
  { label: 'Visits', param: 'visits' },
  { label: 'TreatmentCost', param: 'treatment_cost' },
  { label: 'Revenue', param: 'revenue' },
  { label: 'RecoveryRate', param: 'recovery_rate' },
  { label: 'SatisfactionScore', param: 'satisfaction_score' },
]

const getDefaultMapping = (columns: string[]) => {
  return MAPPING_FIELDS.reduce((acc, field) => {
    acc[field.label] = columns.includes(field.label) ? field.label : ''
    return acc
  }, {} as Record<string, string>)
}

type Kpis = {
  total_visits: number
  total_revenue: number
  avg_recovery_rate: number
  avg_satisfaction: number
}

type MlMetrics = {
  rmse: number
  r2_score: number
}

type InsightItem = {
  Insight: string
  Value: string
}

type HospitalPerformanceItem = {
  Hospital: string
  Visits: number
  Revenue: number
}

type VisitTrendItem = {
  Date: string
  Visits: number
}

type DatasetMode = 'default' | 'upload' | 'mapping'

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || errorData?.message || response.statusText || 'Request failed'
    throw new Error(message)
  }
  return response.json()
}

export function HealthscopeInsightsProjectPage() {
  const BLUE = '#064b86'

  const [mode, setMode] = useState<DatasetMode>('default')
  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [dateStart, setDateStart] = useState<string>('')
  const [dateEnd, setDateEnd] = useState<string>('')
  const [kpis, setKpis] = useState<Kpis | null>(null)

  const toggleHospital = (hospital: string) => {
    setSelectedHospitals((current) =>
      current.includes(hospital) ? current.filter((value) => value !== hospital) : [...current, hospital]
    )
  }

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((current) =>
      current.includes(department) ? current.filter((value) => value !== department) : [...current, department]
    )
  }
  const [hospitalPerformance, setHospitalPerformance] = useState<HospitalPerformanceItem[]>([])
  const [visitTrend, setVisitTrend] = useState<VisitTrendItem[]>([])
  const [mlMetrics, setMlMetrics] = useState<MlMetrics | null>(null)
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>(getDefaultMapping([]))

  const dataPreview = useMemo(() => {
    if (filtered.length) return filtered.slice(0, 8)
    if (previewRows.length) return previewRows.slice(0, 8)
    return data.slice(0, 8)
  }, [filtered, previewRows, data])

  useEffect(() => {
    loadDefault()
  }, [])

  async function loadDefault() {
    setError(null)
    setLoading(true)
    setMode('default')
    setSelectedHospitals([])
    setSelectedDepartments([])
    setDateStart('')
    setDateEnd('')

    try {
      const res = await API.get('/load-default')
      const rows = res.data.data ?? []
      setData(rows)
      setFiltered(rows)
      setPreviewRows(res.data.preview ?? [])
      setHospitals(res.data.hospitals ?? [])
      setDepartments(res.data.departments ?? [])
      await analyzeData(rows)
      setKpis(res.data.kpis ?? null)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Unable to load default dataset. Please check the backend.')
      setData([])
      setFiltered([])
      setPreviewRows([])
      setHospitals([])
      setDepartments([])
      setKpis(null)
      setHospitalPerformance([])
      setVisitTrend([])
      setMlMetrics(null)
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalytics(rows: any[]) {
    if (!rows.length) {
      setKpis(null)
      setFiltered([])
      setHospitalPerformance([])
      setVisitTrend([])
      setMlMetrics(null)
      setInsights([])
      return
    }

    try {
      const res = await API.post('/filter', {
        data: rows,
        hospitals: selectedHospitals,
        departments: selectedDepartments,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
      })
      const filteredRows = res.data.data ?? rows
      setFiltered(filteredRows)
      setKpis(res.data.kpis ?? null)
      await analyzeData(filteredRows)
    } catch (err: any) {
      console.error('Filter error', err)
      setError(err?.message ?? 'Unable to apply filters.')
      setFiltered(rows)
      await analyzeData(rows)
    }
  }

  async function analyzeData(rows: any[]) {
    if (!rows.length) {
      setHospitalPerformance([])
      setVisitTrend([])
      setMlMetrics(null)
      setInsights([])
      return
    }

    try {
      const chartRes = await API.post('/charts', { data: rows })
      setHospitalPerformance(chartRes.data.hospital_performance ?? [])
      setVisitTrend(chartRes.data.visits_over_time ?? [])
    } catch (err) {
      console.error('Chart analysis failed', err)
      setHospitalPerformance([])
      setVisitTrend([])
    }

    try {
      const mlRes = await API.post('/ml/predict-revenue', { data: rows })
      setMlMetrics({ rmse: mlRes.data.rmse, r2_score: mlRes.data.r2 })
    } catch (err) {
      console.error('ML prediction failed', err)
      setMlMetrics(null)
    }

    try {
      const insightsRes = await API.post('/insights', { data: rows })
      setInsights(insightsRes.data.insights ?? [])
    } catch (err) {
      console.error('Insights analysis failed', err)
      setInsights([])
    }
  }

  async function applyFilters() {
    setError(null)
    setLoading(true)

    try {
      const res = await API.post('/filter', {
        data,
        hospitals: selectedHospitals,
        departments: selectedDepartments,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
      })

      const filteredRows = res.data.data ?? []
      setFiltered(filteredRows)
      setKpis(res.data.kpis ?? null)
      await analyzeData(filteredRows)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Filter request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadFile(file)
    setError(null)
    setLoading(true)
    setPreviewRows([])
    setFileColumns([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch(`${API_BASE_URL}/upload-csv`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = uploadRes.data ?? []
      setData(rows)
      setPreviewRows(uploadRes.preview ?? [])
      setHospitals(uploadRes.hospitals ?? [])
      setDepartments(uploadRes.departments ?? [])
      setSelectedHospitals([])
      setSelectedDepartments([])
      setDateStart('')
      setDateEnd('')
      await analyzeData(rows)
      setKpis(uploadRes.kpis ?? null)

      if (mode === 'mapping') {
        const columnsRes = await fetch(`${API_BASE_URL}/get-columns`, {
          method: 'POST',
          body: formData,
        }).then(handleResponse)
        setFileColumns(columnsRes.columns ?? [])
        setMapping(getDefaultMapping(columnsRes.columns ?? []))
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Upload failed. Please try again.')
      setData([])
      setFiltered([])
      setPreviewRows([])
      setFileColumns([])
      setKpis(null)
      setHospitalPerformance([])
      setVisitTrend([])
      setMlMetrics(null)
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  async function applyMapping() {
    if (!uploadFile) {
      setError('Please upload a CSV file first.')
      return
    }

    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('file', uploadFile)

    const params = new URLSearchParams(
      MAPPING_FIELDS.map((field) => [field.param, mapping[field.label] ?? ''])
    )

    try {
      const res = await fetch(`${API_BASE_URL}/apply-mapping?${params.toString()}`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse)

      const rows = res.data ?? []
      setData(rows)
      setPreviewRows(res.preview ?? [])
      setHospitals(res.hospitals ?? [])
      setDepartments(res.departments ?? [])
      setSelectedHospitals([])
      setSelectedDepartments([])
      setDateStart('')
      setDateEnd('')
      await analyzeData(rows)
      setKpis(res.kpis ?? null)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Mapping failed. Please check your selections.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadCsv() {
    try {
      const response = await fetch(`${API_BASE_URL}/download-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: filtered.length ? filtered : data }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const message = errorData?.detail || errorData?.message || response.statusText || 'Download failed'
        throw new Error(message)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'healthscope_data.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Download failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="text-4xl font-bold text-[#0F172A]">Healthscope Insights</div>
          <p className="mt-3 text-slate-600 max-w-3xl">Enterprise healthcare analytics: patient trends, hospital performance, cost, and automated ML insights.</p>
        </div>

        <Tabs>
          <TabList className="mb-8 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Overview</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Important Attributes</Tab>
            <Tab className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white">Application</Tab>
          </TabList>

          <TabPanel>
            <div className="space-y-6">
              <div className="aa-card p-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Overview</h2>
                <p className="text-slate-600 leading-relaxed">Healthscope Insights provides a unified analytics experience for healthcare leaders, combining patient visit trends, hospital performance, departmental revenue, and ML-powered predictions for business-critical decisions.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="aa-card p-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Purpose</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li>Patient & visit analytics</li>
                    <li>Revenue & cost tracking</li>
                    <li>Department performance insights</li>
                    <li>Recovery rate benchmarking</li>
                    <li>Early indicators for hospital risk</li>
                  </ul>
                </div>
                <div className="aa-card p-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">KPIs</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-6 text-center shadow-sm">
                      <p className="text-3xl font-bold text-[#064b86]">{kpis?.total_visits ?? '—'}</p>
                      <p className="mt-2 text-slate-500">Total Visits</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-6 text-center shadow-sm">
                      <p className="text-3xl font-bold text-[#064b86]">₹ {kpis ? Math.round(kpis.total_revenue) : '—'}</p>
                      <p className="mt-2 text-slate-500">Total Revenue</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-6 text-center shadow-sm">
                      <p className="text-3xl font-bold text-[#064b86]">{kpis?.avg_recovery_rate ?? '—'}%</p>
                      <p className="mt-2 text-slate-500">Avg Recovery Rate</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-6 text-center shadow-sm">
                      <p className="text-3xl font-bold text-[#064b86]">{kpis?.avg_satisfaction ?? '—'}</p>
                      <p className="mt-2 text-slate-500">Avg Satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-6">
              <div className="aa-card p-8 overflow-hidden">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Data Dictionary</h2>
                <div className="overflow-auto">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Column Name</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Data Type</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-200">
                        <td className="px-4 py-3">Date</td>
                        <td className="px-4 py-3">Date</td>
                        <td className="px-4 py-3">Appointment / visit date</td>
                      </tr>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td className="px-4 py-3">Hospital</td>
                        <td className="px-4 py-3">String</td>
                        <td className="px-4 py-3">Hospital name</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="px-4 py-3">Department</td>
                        <td className="px-4 py-3">String</td>
                        <td className="px-4 py-3">Department of treatment</td>
                      </tr>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td className="px-4 py-3">Revenue</td>
                        <td className="px-4 py-3">Float</td>
                        <td className="px-4 py-3">Revenue generated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="aa-card p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-5">Independent Variables</h3>
                  <div className="space-y-3 text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">Hospital</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">Department</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">Doctor</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">AgeGroup</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">Gender</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">Visits</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">TreatmentCost</div>
                  </div>
                </div>
                <div className="aa-card p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-5">Dependent Variables</h3>
                  <div className="space-y-3 text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">Revenue</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">RecoveryRate</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">SatisfactionScore</div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-8">
              {error && (
                <div className="rounded-3xl bg-rose-50 border border-rose-200 p-5 text-rose-700">{error}</div>
              )}

              <div className="aa-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Choose Option:</span>
                  <button
                    type="button"
                    onClick={() => loadDefault()}
                    className={`aa-button ${mode === 'default' ? 'aa-button-primary' : 'aa-button-secondary'}`}
                  >
                    Default Dataset
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`aa-button ${mode === 'upload' ? 'aa-button-primary' : 'aa-button-secondary'}`}
                  >
                    Upload CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('mapping')}
                    className={`aa-button ${mode === 'mapping' ? 'aa-button-primary' : 'aa-button-secondary'}`}
                  >
                    Upload CSV + Mapping
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-4">Step 1 — Load Dataset</h2>
                {mode === 'default' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Using the default sample dataset provided by the backend.</p>
                    <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
                      <div className="text-sm font-medium text-slate-700">Dataset preview</div>
                      {dataPreview.length ? (
                        <div className="overflow-auto mt-4 rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100">
                              <tr>
                                {Object.keys(dataPreview[0] || {}).map((column) => (
                                  <th key={column} className="px-3 py-2 font-semibold">{column}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dataPreview.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 truncate max-w-[180px]">{String(value)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Default dataset preview will appear here after loading.</p>
                      )}
                    </div>
                  </div>
                )}

                {(mode === 'upload' || mode === 'mapping') && (
                  <div className="space-y-6">
                    <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
                      <label className="flex cursor-pointer flex-col gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 hover:border-slate-400">
                        <span className="text-lg font-semibold">Upload your dataset</span>
                        <span className="text-sm text-slate-500">Drag and drop file here</span>
                        <span className="text-xs text-slate-400">Limit 200MB per file • CSV</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>

                    {uploadFile && (
                      <div className="rounded-3xl bg-white p-6 border border-slate-200">
                        <div className="text-sm text-slate-700 font-semibold mb-3">Uploaded file</div>
                        <div className="text-sm text-slate-500">{uploadFile.name}</div>
                      </div>
                    )}

                    {mode === 'mapping' && fileColumns.length > 0 && (
                      <div className="aa-card p-6">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4">Map columns</h3>
                        <div className="grid gap-4">
                          {MAPPING_FIELDS.map((field) => (
                            <div key={field.label}>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Map → {field.label}</label>
                              <select
                                value={mapping[field.label]}
                                onChange={(event) =>
                                  setMapping((current) => ({ ...current, [field.label]: event.target.value }))
                                }
                                className="aa-field w-full px-4 py-3 text-slate-700"
                              >
                                <option value="">-- Select --</option>
                                {fileColumns.map((column) => (
                                  <option key={column} value={column}>{column}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={applyMapping}
                          className="aa-button aa-button-primary mt-6"
                        >
                          Apply Mapping
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="aa-card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Step 2 — Filters</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700">Hospital</label>
                      <button
                        type="button"
                        onClick={() => setSelectedHospitals([])}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="rounded-3xl border border-slate-300 bg-white p-4 min-h-[160px]">
                      <div className="mb-3 min-h-[46px] overflow-x-auto">
                        {selectedHospitals.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedHospitals.map((hospital) => (
                              <button
                                key={hospital}
                                type="button"
                                onClick={() => setSelectedHospitals((current) => current.filter((value) => value !== hospital))}
                                className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]"
                              >
                                {hospital}
                                <span aria-hidden="true">×</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">Choose hospitals one by one</div>
                        )}
                      </div>
                      <div className="grid gap-2 max-h-[120px] overflow-y-auto">
                        {hospitals.map((hospital) => (
                          <button
                            key={hospital}
                            type="button"
                            onClick={() => toggleHospital(hospital)}
                            className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${selectedHospitals.includes(hospital) ? 'bg-[#064b86] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                          >
                            {hospital}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700">Department</label>
                      <button
                        type="button"
                        onClick={() => setSelectedDepartments([])}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="rounded-3xl border border-slate-300 bg-white p-4 min-h-[160px]">
                      <div className="mb-3 min-h-[46px] overflow-x-auto">
                        {selectedDepartments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedDepartments.map((department) => (
                              <button
                                key={department}
                                type="button"
                                onClick={() => setSelectedDepartments((current) => current.filter((value) => value !== department))}
                                className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]"
                              >
                                {department}
                                <span aria-hidden="true">×</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">Choose departments one by one</div>
                        )}
                      </div>
                      <div className="grid gap-2 max-h-[120px] overflow-y-auto">
                        {departments.map((department) => (
                          <button
                            key={department}
                            type="button"
                            onClick={() => toggleDepartment(department)}
                            className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${selectedDepartments.includes(department) ? 'bg-[#064b86] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                          >
                            {department}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
                    <div className="grid gap-4">
                      <input
                        type="date"
                        value={dateStart}
                        onChange={(event) => setDateStart(event.target.value)}
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-700"
                      />
                      <input
                        type="date"
                        value={dateEnd}
                        onChange={(event) => setDateEnd(event.target.value)}
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyFilters}
                  className="aa-button aa-button-primary mt-6"
                >
                  Apply Filters
                </button>
              </div>

              {loading && <ProjectDetailCardSkeleton />}

              {filtered.length > 0 && (
                <div className="aa-card p-8 overflow-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-5">Filter Applied Table</h2>
                  <table className="min-w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-100">
                      <tr>
                        {Object.keys(filtered[0] || {}).map((column) => (
                          <th key={column} className="px-3 py-2 font-semibold">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 8).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 truncate max-w-[180px]">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="aa-card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Key Metrics</h2>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="text-3xl font-bold text-[#064b86]">{kpis?.total_visits ?? '—'}</div>
                    <div className="mt-2 text-slate-600">Total Visits</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="text-3xl font-bold text-[#064b86]">₹ {kpis ? Math.round(kpis.total_revenue) : '—'}</div>
                    <div className="mt-2 text-slate-600">Total Revenue</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="text-3xl font-bold text-[#064b86]">{kpis?.avg_recovery_rate ?? '—'}%</div>
                    <div className="mt-2 text-slate-600">Avg Recovery Rate</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="text-3xl font-bold text-[#064b86]">{kpis?.avg_satisfaction ?? '—'}</div>
                    <div className="mt-2 text-slate-600">Avg Satisfaction</div>
                  </div>
                </div>
              </div>

              <div className="aa-card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Hospital Performance</h2>
                <Plot
                  data={[
                    {
                      x: hospitalPerformance.map((item) => item.Hospital),
                      y: hospitalPerformance.map((item) => item.Visits),
                      type: 'bar',
                      name: 'Visits',
                    },
                    {
                      x: hospitalPerformance.map((item) => item.Hospital),
                      y: hospitalPerformance.map((item) => item.Revenue),
                      type: 'bar',
                      name: 'Revenue',
                    },
                  ]}
                  layout={{ barmode: 'group', autosize: true, height: 420, margin: { t: 30, l: 40, r: 20, b: 40 } }}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="aa-card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Visits Over Time</h2>
                <Plot
                  data={[
                    {
                      x: visitTrend.map((item) => item.Date),
                      y: visitTrend.map((item) => item.Visits),
                      type: 'scatter',
                      mode: 'lines+markers',
                      marker: { color: BLUE },
                    },
                  ]}
                  layout={{ autosize: true, height: 420, margin: { t: 30, l: 40, r: 20, b: 40 } }}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="aa-card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">ML: Revenue Prediction</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="text-3xl font-bold text-[#064b86]">{mlMetrics?.rmse ?? '—'}</div>
                    <div className="mt-2 text-slate-600">RMSE</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="text-3xl font-bold text-[#064b86]">{mlMetrics?.r2_score ?? '—'}</div>
                    <div className="mt-2 text-slate-600">R² Score</div>
                  </div>
                </div>
              </div>

              <div className="aa-card p-8 overflow-hidden">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Automated Insights</h2>
                <div className="overflow-auto">
                  <table className="min-w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Insight</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3 text-slate-700">{item.Insight}</td>
                          <td className="px-4 py-3 text-slate-700">{item.Value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="aa-button aa-button-primary"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}
