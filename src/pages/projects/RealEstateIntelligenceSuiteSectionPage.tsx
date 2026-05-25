import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, CloudUpload, Download, Sparkles, ShieldCheck, Loader2, MapPin, BarChart3 } from 'lucide-react'
import {
  loadDefaultDataset,
  uploadCsv,
  getCsvColumns,
  applyColumnMapping,
  filterData,
  getChartData,
  runMlPrediction,
  getInsights,
  generateAiNarrative,
  downloadFilteredCsv,
  type RealEstateDatasetResponse,
  type FilterResponse,
  type ChartDataResponse,
  type GetColumnsResponse,
  type MlPredictResponse,
  type InsightsResponse,
  type AiNarrativeResponse,
} from '@/services/realEstateIntelligenceSuiteApi'
import { ChartContainer } from '@/app/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Legend,
} from 'recharts'
import { Slider } from '@/app/components/ui/slider'

type Tab = 'overview' | 'attributes' | 'application'

type Kpis = {
  total_properties: number
  median_price: number
  avg_price_per_sqft: number
  avg_area: number
}

const overviewFeatures = [
  'Load default dataset or upload your own real estate CSV with automatic column mapping.',
  'Filter by city, property type, and area range to narrow down the most relevant listings.',
  'Calculate key real estate KPIs including median price, average price per sqft, and total property count.',
  'Run ML-powered price prediction and compare actual vs predicted values for a quick estimate.',
  'Generate automated insights and AI market narrative based on filtered property data.',
  'Download filtered CSV results for offline analysis or next-stage reporting.',
]

const impactStatements = [
  'Make faster investment decisions using data-driven pricing and valuation signals.',
  'Reduce manual dataset preparation with automatic CSV mapping and preview validation.',
  'Surface property market trends and high-value neighborhoods instantly.',
  'Use AI-powered predictions to identify pricing outliers and valuation opportunities.',
  'Export clean, filtered datasets for collaboration with finance or operations teams.',
]

export function RealEstateIntelligenceSuiteSectionPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [dataset, setDataset] = useState<RealEstateDatasetResponse | null>(null)
  const [filtered, setFiltered] = useState<FilterResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([])
  const [areaMin, setAreaMin] = useState<number | ''>('')
  const [areaMax, setAreaMax] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [actionText, setActionText] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [prediction, setPrediction] = useState<MlPredictResponse | null>(null)
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [narrative, setNarrative] = useState<AiNarrativeResponse | null>(null)
  const [loadMode, setLoadMode] = useState<'default' | 'upload' | 'upload-mapping'>('default')
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null)
  const [csvColumns, setCsvColumns] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    City: '',
    Property_Type: '',
    Area_sqft: '',
    Price: '',
  })

  const activeData = filtered?.data ?? dataset?.data ?? []
  const previewRows = filtered?.preview ?? dataset?.preview ?? []
  const availableCities = dataset?.cities ?? []
  const availablePropertyTypes = dataset?.property_types ?? []
  const areaRange = useMemo(() => {
    return {
      min: dataset?.area_min ?? 0,
      max: dataset?.area_max ?? 0,
    }
  }, [dataset])

  const selectedAreaMin = typeof areaMin === 'number' ? areaMin : areaRange.min
  const selectedAreaMax = typeof areaMax === 'number' ? areaMax : areaRange.max

  async function loadCsvColumns(file: File) {
    setCsvColumns([])
    setColumnMapping({ City: '', Property_Type: '', Area_sqft: '', Price: '' })
    setLoading(true)
    setActionText('Reading CSV columns...')
    setErrorMessage(null)

    try {
      const response = (await getCsvColumns(file)) as GetColumnsResponse
      setCsvColumns(response.columns)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to read CSV columns.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return

    setSelectedFile(file)
    setKpis(null)
    setPrediction(null)
    setInsights(null)
    setNarrative(null)
    setErrorMessage(null)

    if (loadMode === 'upload-mapping') {
      await loadCsvColumns(file)
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Please select a CSV file to upload.')
      return
    }

    setLoading(true)
    setActionText('Uploading and validating CSV...')
    setErrorMessage(null)

    try {
      const response = await uploadCsv(selectedFile)
      setDataset(response)
      setFiltered(null)
      setSelectedCities([])
      setSelectedPropertyTypes([])
      setAreaMin(response.area_min)
      setAreaMax(response.area_max)
      setKpis(null)
      setPrediction(null)
      setInsights(null)
      setNarrative(null)
      setSelectedFile(null)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to upload CSV.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleApplyMapping() {
    if (!selectedFile) {
      setErrorMessage('Please select a CSV file to map.')
      return
    }

    const missing = Object.entries(columnMapping).filter(([, value]) => !value)
    if (missing.length) {
      setErrorMessage('Please map all required columns before uploading.')
      return
    }

    setLoading(true)
    setActionText('Applying column mapping...')
    setErrorMessage(null)

    try {
      const response = await applyColumnMapping(selectedFile, {
        city: columnMapping.City,
        property_type: columnMapping.Property_Type,
        area_sqft: columnMapping.Area_sqft,
        price: columnMapping.Price,
      })

      setDataset(response)
      setFiltered(null)
      setSelectedCities([])
      setSelectedPropertyTypes([])
      setAreaMin(response.area_min)
      setAreaMax(response.area_max)
      setKpis(null)
      setPrediction(null)
      setInsights(null)
      setNarrative(null)
      setSelectedFile(null)
      setCsvColumns([])
      setColumnMapping({ City: '', Property_Type: '', Area_sqft: '', Price: '' })
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to apply column mapping.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleApplyFilters() {
    if (!dataset?.data) {
      setErrorMessage('Load a dataset first before filtering.')
      return
    }

    setLoading(true)
    setActionText('Applying filters...')
    setErrorMessage(null)

    try {
      const response = await filterData({
        data: dataset.data,
        cities: selectedCities.length ? selectedCities : undefined,
        property_types: selectedPropertyTypes.length ? selectedPropertyTypes : undefined,
        area_min: typeof areaMin === 'number' ? areaMin : undefined,
        area_max: typeof areaMax === 'number' ? areaMax : undefined,
      })
      setFiltered(response)
      setKpis(response.kpis as Kpis)
      setPrediction(null)
      setInsights(null)
      setNarrative(null)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Filter failed.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleRunPrediction() {
    if (!activeData.length) {
      setErrorMessage('Apply filters or load a dataset first.')
      return
    }

    setLoading(true)
    setActionText('Running ML prediction...')
    setErrorMessage(null)

    try {
      const response = await runMlPrediction(activeData)
      setPrediction(response)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Prediction failed.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleRunInsights() {
    if (!activeData.length) {
      setErrorMessage('Apply filters or load a dataset first.')
      return
    }

    setLoading(true)
    setActionText('Generating insights...')
    setErrorMessage(null)

    try {
      const response = await getInsights(activeData)
      setInsights(response)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Insights generation failed.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleGenerateNarrative() {
    if (!activeData.length || !kpis || !insights) {
      setErrorMessage('Run filters, insights, and KPIs before generating narrative.')
      return
    }

    setLoading(true)
    setActionText('Generating AI narrative...')
    setErrorMessage(null)

    try {
      const response = await generateAiNarrative(activeData, kpis, insights.insights)
      setNarrative(response)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Narrative generation failed.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  async function handleDownload() {
    if (!activeData.length) {
      setErrorMessage('Load and filter data before downloading.')
      return
    }

    setLoading(true)
    setActionText('Preparing CSV download...')
    setErrorMessage(null)

    try {
      await downloadFilteredCsv(activeData)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Download failed.')
    } finally {
      setLoading(false)
      setActionText('')
    }
  }

  useEffect(() => {
    async function fetchCharts() {
      const sourceData = filtered?.data ?? dataset?.data
      if (!sourceData?.length) {
        setChartData(null)
        return
      }

      try {
        const response = await getChartData(sourceData)
        setChartData(response)
      } catch (error: any) {
        console.warn('Chart data failed', error)
        setChartData(null)
      }
    }

    void fetchCharts()
  }, [dataset, filtered])

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city],
    )
  }

  function togglePropertyType(type: string) {
    setSelectedPropertyTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    )
  }

  const datasetKpis = useMemo(() => {
    if (!dataset?.data?.length) return null

    const areaValues = dataset.data.map((row) => Number(row.Area_sqft) || 0)
    const priceValues = dataset.data.map((row) => Number(row.Price) || 0)
    const total = priceValues.length
    if (!total) return null

    const medianPrice = [...priceValues].sort((a, b) => a - b)[Math.floor(total / 2)] ?? 0
    const avgPricePerSqft = dataset.data.reduce((sum, row) => sum + (Number(row.Price_per_sqft) || 0), 0) / total
    const avgArea = areaValues.reduce((sum, value) => sum + value, 0) / total

    return {
      total_properties: total,
      median_price: Number(medianPrice),
      avg_price_per_sqft: Number(avgPricePerSqft),
      avg_area: Number(avgArea),
    }
  }, [dataset])

  const summaryKpis = filtered?.kpis ?? datasetKpis

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-[#475569] hover:text-[#0F172A]"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-[#0F172A] mt-2">Real Estate Intelligence Suite</h1>
          <p className="text-[15px] text-[#475569] max-w-3xl mt-2">
            Analyze and predict property values, compare city-level trends, and generate real estate market narratives using the backend analytics API.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="inline-flex overflow-hidden rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-1">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
              tab === 'overview' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('attributes')}
            className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
              tab === 'attributes' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Important Attributes
          </button>
          <button
            type="button"
            onClick={() => setTab('application')}
            className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
              tab === 'application' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Application
          </button>
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Overview</h2>
            <p className="text-[15px] text-[#475569] leading-relaxed mb-6">
              The Real Estate Intelligence Suite is built on a FastAPI backend with pandas and scikit-learn. It loads real estate datasets, applies filters, computes KPIs, runs price prediction models, and creates insight summaries for smarter property decisions.
            </p>
            <div className="grid gap-4">
              {overviewFeatures.map((item) => (
                <div key={item} className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#0F766E]" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Business impact</h2>
            <div className="space-y-4">
              {impactStatements.map((item) => (
                <div key={item} className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#7C3AED] mt-1" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'attributes' ? (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Required Column Dictionary</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#334155]">
                <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#475569]">
                  <tr>
                    <th className="px-3 py-3 border-b border-[#E2E8F0]">Attribute</th>
                    <th className="px-3 py-3 border-b border-[#E2E8F0]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['City', 'City where the property is located'],
                    ['Property_Type', 'Type of property (Apartment, Villa, Plot, etc.)'],
                    ['Area_sqft', 'Area in square feet'],
                    ['Price', 'Listing or sale price (INR)'],
                  ].map(([attribute, description]) => (
                    <tr key={attribute} className="even:bg-[#F8FAFC]">
                      <td className="px-3 py-3 border-b border-[#E2E8F0] font-semibold text-[#0F172A]">{attribute}</td>
                      <td className="px-3 py-3 border-b border-[#E2E8F0] text-[#475569]">{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Variable roles</h2>
            <div className="space-y-3">
              {['City', 'Property_Type', 'Area_sqft'].map((variable) => (
                <div key={variable} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  <span className="font-semibold text-[#0F172A]">{variable}</span>
                  <p className="mt-2 text-[#475569]">Independent variable used by the model and filters.</p>
                </div>
              ))}
              {['Price', 'Price_per_sqft'].map((variable) => (
                <div key={variable} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  <span className="font-semibold text-[#0F172A]">{variable}</span>
                  <p className="mt-2 text-[#475569]">Dependent variable computed or predicted by the model.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Step 1</p>
                    <h2 className="text-2xl font-bold text-[#0F172A]">Load dataset</h2>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${dataset?.total_rows ? 'bg-[#ECFDF5] text-[#166534]' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>
                    {dataset?.total_rows ? `${dataset.total_rows} rows loaded` : 'No dataset loaded'}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {['default', 'upload', 'upload-mapping'].map((mode) => {
                    const label = mode === 'default' ? 'Default dataset' : mode === 'upload' ? 'Upload CSV' : 'Upload CSV + Column mapping'
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setLoadMode(mode as typeof loadMode)
                          setSelectedFile(null)
                          setCsvColumns([])
                          setColumnMapping({ City: '', Property_Type: '', Area_sqft: '', Price: '' })
                          setErrorMessage(null)
                        }}
                        className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                          loadMode === mode
                            ? 'border-[#0F766E] bg-[#ECFDF5] text-[#0F766E]'
                            : 'border-[#CBD5E1] bg-white text-[#475569] hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-4">
                  {loadMode === 'default' ? (
                    <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-5">
                      <p className="text-sm text-[#475569]">
                        Use the built-in sample dataset to explore property trends and model outputs without uploading a file.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-5">
                      <label className="flex cursor-pointer flex-col gap-4 rounded-3xl border border-dashed border-[#94A3B8] bg-white p-6 text-[#475569] transition hover:border-[#64748B]">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                            <CloudUpload className="w-6 h-6 text-[#0F766E]" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-[#0F172A]">{selectedFile ? selectedFile.name : 'Upload your CSV file'}</p>
                            <p className="mt-1 text-sm text-[#64748B]">
                              {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB • CSV` : 'Click to browse and select a CSV file for analysis.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm text-[#475569]">Supports .csv files up to 200MB.</span>
                          <button
                            type="button"
                            className="rounded-2xl bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D5F58]"
                          >
                            Browse
                          </button>
                        </div>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                      </label>

                      {loadMode === 'upload-mapping' && (
                        <div className="mt-6 rounded-3xl border border-[#CBD5E1] bg-white p-5">
                          <h3 className="text-base font-semibold text-[#0F172A] mb-3">Map CSV columns</h3>
                          <p className="text-sm text-[#475569] mb-4">Select each required dataset field from your uploaded CSV columns.</p>

                          {csvColumns.length ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {['City', 'Property_Type', 'Area_sqft', 'Price'].map((field) => (
                                <label key={field} className="block">
                                  <span className="text-sm font-medium text-[#0F172A]">{field}</span>
                                  <select
                                    value={columnMapping[field] ?? ''}
                                    onChange={(event) => setColumnMapping((prev) => ({ ...prev, [field]: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#D8F5E7]"
                                  >
                                    <option value="">Select column</option>
                                    {csvColumns.map((column) => (
                                      <option key={column} value={column}>{column}</option>
                                    ))}
                                  </select>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[#475569]">Upload a CSV file first to load available column names.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadMode('default')
                        setSelectedFile(null)
                        setCsvColumns([])
                        setColumnMapping({ City: '', Property_Type: '', Area_sqft: '', Price: '' })
                        setLoading(true)
                        setActionText('Loading default dataset...')
                        setErrorMessage(null)
                        try {
                          const response = await loadDefaultDataset()
                          setDataset(response)
                          setFiltered(null)
                          setSelectedCities([])
                          setSelectedPropertyTypes([])
                          setAreaMin(response.area_min)
                          setAreaMax(response.area_max)
                          setKpis(null)
                          setPrediction(null)
                          setInsights(null)
                          setNarrative(null)
                        } catch (error: any) {
                          setErrorMessage(error?.message || 'Failed to load default dataset.')
                        } finally {
                          setLoading(false)
                          setActionText('')
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
                    >
                      <MapPin className="w-4 h-4" />
                      Load default dataset
                    </button>
                    {loadMode !== 'default' && (
                      <button
                        type="button"
                        onClick={loadMode === 'upload-mapping' ? handleApplyMapping : handleUpload}
                        disabled={!selectedFile || (loadMode === 'upload-mapping' && !csvColumns.length)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
                      >
                        <CloudUpload className="w-4 h-4" />
                        {loadMode === 'upload-mapping' ? 'Map and upload CSV' : 'Upload CSV'}
                      </button>
                    )}
                  </div>

                  {dataset?.warning && (
                    <div className="rounded-3xl border border-[#FBBF24] bg-[#FFFBEB] p-4 text-sm text-[#92400E]">
                      {dataset.warning}
                    </div>
                  )}
                </div>

                {dataset?.preview?.length ? (
                  <div className="mt-6 rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="text-sm font-semibold text-[#0F172A] mb-3">Dataset preview</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-[#334155]">
                        <thead className="bg-white text-xs uppercase tracking-[0.12em] text-[#475569]">
                          <tr>
                            {Object.keys(previewRows[0]).slice(0, 6).map((column) => (
                              <th key={column} className="border-b border-[#E2E8F0] px-3 py-3">{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.slice(0, 4).map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                              {Object.values(row).slice(0, 6).map((value, cellIndex) => (
                                <td key={cellIndex} className="border-b border-[#E2E8F0] px-3 py-3 text-[#475569]">{value ?? '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Step 2</p>
                    <h2 className="text-2xl font-bold text-[#0F172A]">Filters</h2>
                  </div>
                  <p className="text-sm text-[#475569]">Area range {areaRange.min} - {areaRange.max} sqft</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-3">City</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCities.length ? (
                        selectedCities.map((city) => (
                          <span key={city} className="inline-flex items-center rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]">{city}</span>
                        ))
                      ) : (
                        <span className="text-sm text-[#64748B]">No cities selected</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-3">Property Type</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPropertyTypes.length ? (
                        selectedPropertyTypes.map((type) => (
                          <span key={type} className="inline-flex items-center rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]">{type}</span>
                        ))
                      ) : (
                        <span className="text-sm text-[#64748B]">No property types selected</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#0F172A]">Cities</label>
                        <div className="grid gap-2 max-h-40 overflow-y-auto rounded-2xl border border-[#CBD5E1] bg-white p-3">
                          {availableCities.length > 0 ? (
                            availableCities.map((city) => (
                              <button
                                type="button"
                                key={city}
                                onClick={() => toggleCity(city)}
                                className={`w-full text-left rounded-2xl px-3 py-2 text-sm transition ${
                                  selectedCities.includes(city) ? 'bg-[#0F766E] text-white' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#E2E8F0]'
                                }`}
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="text-sm text-[#64748B]">Loading cities...</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#0F172A]">Property Types</label>
                        <div className="grid gap-2 max-h-40 overflow-y-auto rounded-2xl border border-[#CBD5E1] bg-white p-3">
                          {availablePropertyTypes.length > 0 ? (
                            availablePropertyTypes.map((type) => (
                              <button
                                type="button"
                                key={type}
                                onClick={() => togglePropertyType(type)}
                                className={`w-full text-left rounded-2xl px-3 py-2 text-sm transition ${
                                  selectedPropertyTypes.includes(type) ? 'bg-[#0F766E] text-white' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#E2E8F0]'
                                }`}
                              >
                                {type}
                              </button>
                            ))
                          ) : (
                            <div className="text-sm text-[#64748B]">Loading property types...</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">Area range (sqft)</p>
                          <p className="text-sm text-[#64748B]">Adjust the minimum and maximum area for filtered results.</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-[#DC2626]">{selectedAreaMin}</span>
                          <span className="text-sm font-semibold text-[#DC2626]">{selectedAreaMax}</span>
                        </div>
                      </div>

                      <div className="rounded-full bg-[#E2E8F0] p-3">
                        <Slider
                          value={[selectedAreaMin, selectedAreaMax]}
                          min={areaRange.min}
                          max={areaRange.max}
                          step={1}
                          onValueChange={(value) => {
                            setAreaMin(value[0])
                            setAreaMax(value[1])
                          }}
                          className="h-4"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-[#0F172A]">
                          Area min (sqft)
                          <input
                            type="number"
                            value={areaMin}
                            onChange={(event) => setAreaMin(Number(event.target.value) || '')}
                            className="mt-2 w-full rounded-2xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
                            placeholder={String(areaRange.min)}
                          />
                        </label>
                        <label className="block text-sm font-semibold text-[#0F172A]">
                          Area max (sqft)
                          <input
                            type="number"
                            value={areaMax}
                            onChange={(event) => setAreaMax(Number(event.target.value) || '')}
                            className="mt-2 w-full rounded-2xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
                            placeholder={String(areaRange.max)}
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Apply filters
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 mt-4">
                      <button
                        type="button"
                        onClick={handleRunPrediction}
                        disabled={!activeData.length}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Run ML prediction
                      </button>
                      <button
                        type="button"
                        onClick={handleRunInsights}
                        disabled={!activeData.length}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate automated insights
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F172A] mb-4">Key metrics</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">Total properties</p>
                    <p className="mt-3 text-3xl font-bold text-[#0F172A]">{summaryKpis?.total_properties ?? '—'}</p>
                  </div>
                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">Median price</p>
                    <p className="mt-3 text-3xl font-bold text-[#0F172A]">₹{summaryKpis?.median_price?.toLocaleString() ?? '—'}</p>
                  </div>
                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">Avg price / sqft</p>
                    <p className="mt-3 text-3xl font-bold text-[#0F172A]">₹{summaryKpis?.avg_price_per_sqft?.toLocaleString() ?? '—'}</p>
                  </div>
                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">Avg area (sqft)</p>
                    <p className="mt-3 text-3xl font-bold text-[#0F172A]">{summaryKpis?.avg_area?.toLocaleString() ?? '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0F172A] mb-4">Charts</h3>
                <div className="space-y-6">
                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">Price distribution</p>
                        <p className="text-xs text-[#64748B]">See how property prices are distributed across the loaded dataset.</p>
                      </div>
                      <BarChart3 className="w-5 h-5 text-[#0F766E]" />
                    </div>
                    {chartData?.price_histogram?.length ? (
                      <ChartContainer id="price-distribution" config={{ count: { color: '#0F766E' } }} className="h-80">
                        <BarChart
                          data={chartData.price_histogram.map((item) => ({
                            ...item,
                            bin_label: `${item.bin_start.toLocaleString()} - ${item.bin_end.toLocaleString()}`,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="bin_label" tick={{ fill: '#475569', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                          <Tooltip formatter={(value: number) => [value, 'Count']} />
                          <Bar dataKey="count" fill="#0F766E" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-sm text-[#64748B]">Chart data will appear after loading a dataset.</p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">City-wise avg price</p>
                        <p className="text-xs text-[#64748B]">Compare average prices by city for the selected properties.</p>
                      </div>
                    </div>
                    {chartData?.city_avg_price?.length ? (
                      <ChartContainer id="city-avg-price" config={{ avg_price: { color: '#7C3AED' } }} className="h-80">
                        <BarChart
                          data={chartData.city_avg_price.map((item) => ({
                            ...item,
                            avg_price: Number(item.avg_price || item.Avg_Price || 0),
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="City" tick={{ fill: '#475569', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                          <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Avg price']} />
                          <Bar dataKey="avg_price" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-sm text-[#64748B]">City average values not available yet.</p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">Price vs Area</p>
                        <p className="text-xs text-[#64748B]">Analyze how price scales with property size for the chosen listings.</p>
                      </div>
                    </div>
                    {chartData?.price_vs_area?.length ? (
                      <ChartContainer id="price-vs-area" config={{ Price: { color: '#1D4ED8' } }} className="h-80">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="Area_sqft" tick={{ fill: '#475569', fontSize: 12 }} name="Area (sqft)" />
                          <YAxis dataKey="Price" tick={{ fill: '#475569', fontSize: 12 }} name="Price" />
                          <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Price']} />
                          <Legend />
                          <Scatter
                            name="Price vs Area"
                            data={chartData.price_vs_area.map((item) => ({
                              ...item,
                              Area_sqft: Number(item.Area_sqft ?? item.area ?? 0),
                              Price: Number(item.Price ?? item.price ?? 0),
                            }))}
                            fill="#1D4ED8"
                          />
                        </ScatterChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-sm text-[#64748B]">Price vs area details will appear after generating chart data.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">Filtered preview</h2>
                <p className="text-sm text-[#475569]">Review the top filtered rows before exporting or analyzing.</p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#334155]">
                <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#475569]">
                  <tr>
                    {(previewRows[0] ? Object.keys(previewRows[0]) : ['No data']).slice(0, 8).map((column) => (
                      <th key={column} className="border-b border-[#E2E8F0] px-3 py-3">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.length ? (
                    previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                        {Object.values(row).slice(0, 8).map((value, cellIndex) => (
                          <td key={cellIndex} className="border-b border-[#E2E8F0] px-3 py-3 text-sm text-[#475569]">{value ?? '-'}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-4 text-sm text-[#64748B]" colSpan={8}>No preview data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">ML — Price prediction</h3>
            {prediction ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#334155]">
                  <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#475569]">
                    <tr>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">Metric</th>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border-b border-[#E2E8F0] px-3 py-3">RMSE</td>
                      <td className="border-b border-[#E2E8F0] px-3 py-3">₹{prediction.rmse.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-[#F8FAFC]">
                      <td className="border-b border-[#E2E8F0] px-3 py-3">R² score</td>
                      <td className="border-b border-[#E2E8F0] px-3 py-3">{prediction.r2}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border-b border-[#E2E8F0] px-3 py-3">Train size</td>
                      <td className="border-b border-[#E2E8F0] px-3 py-3">{prediction.train_size}</td>
                    </tr>
                    <tr className="bg-[#F8FAFC]">
                      <td className="border-b border-[#E2E8F0] px-3 py-3">Test size</td>
                      <td className="border-b border-[#E2E8F0] px-3 py-3">{prediction.test_size}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">Run a prediction to see model metrics and sample output.</p>
            )}
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">Automated insights</h3>
            {insights && insights.insights.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#334155]">
                  <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#475569]">
                    <tr>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">City</th>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">Property Type</th>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">Avg Price</th>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">Min Price</th>
                      <th className="border-b border-[#E2E8F0] px-3 py-3">Max Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.insights.slice(0, 8).map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                        <td className="border-b border-[#E2E8F0] px-3 py-3">{item.City}</td>
                        <td className="border-b border-[#E2E8F0] px-3 py-3">{item.Property_Type}</td>
                        <td className="border-b border-[#E2E8F0] px-3 py-3">₹{Number(item.Avg_Price)?.toLocaleString()}</td>
                        <td className="border-b border-[#E2E8F0] px-3 py-3">₹{Number(item.Min_Price)?.toLocaleString()}</td>
                        <td className="border-b border-[#E2E8F0] px-3 py-3">₹{Number(item.Max_Price)?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">Generate insights to populate the table.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
