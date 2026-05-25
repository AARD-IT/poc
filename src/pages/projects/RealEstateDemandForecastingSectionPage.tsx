import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import { CloudUpload, Download, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import {
  loadDefaultDataset,
  uploadCsv,
  applyFilters,
  getChartData,
  getForecast,
  getInsights,
  getCsvColumns,
  applyColumnMapping,
  downloadCsvFile,
} from '@/services/realEstateDemandForecastingApi'

const BLUE = '#064b86'
const DEFAULT_TABLE_COLUMNS = [
  'Property_ID',
  'City',
  'Locality',
  'Country',
  'Region',
  'Property_Type',
  'BHK',
  'Bathroom_Count',
  'Area_sqft',
  'Price',
  'Price_per_sqft',
  'Floor_Number',
  'Total_Floors',
  'Age_Years',
  'Facing',
  'Furnishing',
  'Parking',
  'Amenities',
  'Maintenance_Fees',
  'Registration_Cost',
  'Tax_Percent',
  'Currency',
  'Latitude',
  'Longitude',
  'Zone',
  'Agent_Name',
  'Agent_ID',
  'Listing_Date',
  'Listing_Channel',
  'Lead_Score',
  'Days_On_Market',
  'Status',
  'Views_Count',
  'Inquiries_Count',
  'Site_Visits_Count',
  'Conversion_Probability',
  'Description',
  'Highlights',
  'Nearby_Landmarks',
]

type Tab = 'overview' | 'attributes' | 'application'
type AppMode = 'default' | 'upload' | 'mapping'
type TrendItem = { Month: string; Demand: number }
type PropertyDemandItem = { Property_Type: string; Count: number }
type ForecastItem = { Month: string; Forecast: number }
type InsightItem = {
  City: string
  Property_Type: string
  Avg_Price: number
  Max_Price: number
  Min_Price: number
  Count?: number
}
type Kpis = {
  total_listings: number
  avg_monthly_sales: number
  top_city: string
  avg_price: number
}

const overviewFeatures = [
  'Time-series demand tracking',
  'Property-type segmentation',
  'Price sensitivity analysis',
  'ML-based forecasting (6-month linear regression)',
  'Automated insights for cities & property types',
]

const impactStatements = [
  'Predict market cycles early',
  'Prevent over/under inventory allocation',
  'Optimize pricing strategy',
  'Support strategic investment & expansion',
]

const overviewKpis = ['Avg Monthly Sales', 'Demand Growth', 'Top Cities', 'Price Sensitivity']

function downloadTextCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csvRows = [headers.join(','), ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function RealEstateDemandForecastingSectionPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [appMode, setAppMode] = useState<AppMode>('default')
  const [data, setData] = useState<Record<string, any>[]>([])
  const [filtered, setFiltered] = useState<Record<string, any>[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')
  const [kpis, setKpis] = useState<Kpis>({ total_listings: 0, avg_monthly_sales: 0, top_city: 'N/A', avg_price: 0 })
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [propertyDemand, setPropertyDemand] = useState<PropertyDemandItem[]>([])
  const [loading, setLoading] = useState(false)
  const [forecastError, setForecastError] = useState<string | null>(null)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [mappingColumns, setMappingColumns] = useState({ city: '', listing_date: '', property_type: '', price: '' })
  const [availableCsvColumns, setAvailableCsvColumns] = useState<string[]>([])
  const [mappingFile, setMappingFile] = useState<File | null>(null)
  const [mappingError, setMappingError] = useState<string | null>(null)
  const [fileUploadLabel, setFileUploadLabel] = useState('No file chosen')

  const activeData = filtered.length ? filtered : data
  const datasetRows = activeData.length
  const datasetCities = cities.length
  const datasetTypes = types.length
  const forecastMonths = forecast.length || 6
  const previewRows = activeData.slice(0, 6)
  const selectedFiltersLabel = [
    selectedCities.length ? `${selectedCities.length} city${selectedCities.length === 1 ? '' : 'ies'} selected` : null,
    selectedTypes.length ? `${selectedTypes.length} property type${selectedTypes.length === 1 ? '' : 's'} selected` : null,
  ]
    .filter(Boolean)
    .join(' � ') || 'None selected'

  const summaryCards = useMemo(
    () => [
      { label: 'Loaded rows', value: datasetRows.toLocaleString() },
      { label: 'Cities', value: datasetCities.toString() },
      { label: 'Property types', value: datasetTypes.toString() },
      { label: 'Forecast horizon', value: `${forecastMonths} months` },
    ],
    [datasetRows, datasetCities, datasetTypes, forecastMonths]
  )

  useEffect(() => {
    loadDefaultDatasetFromApi()
  }, [])

  async function refreshAnalysis(rawData: Record<string, any>[]) {
    setForecastError(null)
    setInsightsError(null)
    if (!rawData.length) {
      setTrend([])
      setPropertyDemand([])
      setForecast([])
      setInsights([])
      return
    }

    try {
      const chartData = await getChartData(rawData)
      setTrend(chartData.monthly_demand_trend)
      setPropertyDemand(chartData.demand_by_property_type)
    } catch (err) {
      console.error(err)
      setTrend([])
      setPropertyDemand([])
    }

    try {
      const forecastResponse = await getForecast(rawData)
      setForecast(forecastResponse.forecast)
    } catch (err: any) {
      console.error(err)
      setForecast([])
      setForecastError(err?.message || 'Unable to generate forecast')
    }

    try {
      const insightsResponse = await getInsights(rawData)
      setInsights(insightsResponse.insights as InsightItem[])
    } catch (err: any) {
      console.error(err)
      setInsights([])
      setInsightsError(err?.message || 'Unable to generate insights')
    }
  }

  async function hydrateFromData(rawData: Record<string, any>[], rawCities: string[], rawTypes: string[], rawMinDate?: string, rawMaxDate?: string) {
    setData(rawData)
    setFiltered(rawData)
    setCities(rawCities)
    setTypes(rawTypes)
    setMinDate(rawMinDate || '')
    setMaxDate(rawMaxDate || '')
    setDateStart(rawMinDate || '')
    setDateEnd(rawMaxDate || '')
    setSelectedCities([])
    setSelectedTypes([])

    try {
      const filterResponse = await applyFilters({ data: rawData })
      setKpis(filterResponse.kpis)
      await refreshAnalysis(filterResponse.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadDefaultDatasetFromApi() {
    setLoading(true)
    try {
      const response = await loadDefaultDataset()
      await hydrateFromData(response.data, response.cities, response.property_types, response.date_min, response.date_max)
      setAppMode('default')
      setFileUploadLabel('No file chosen')
      setMappingFile(null)
      setAvailableCsvColumns([])
      setMappingColumns({ city: '', listing_date: '', property_type: '', price: '' })
      setMappingError(null)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const uploadCSV = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileUploadLabel(file.name)
    setLoading(true)
    try {
      const response = await uploadCsv(file)
      await hydrateFromData(response.data, response.cities, response.property_types, response.date_min, response.date_max)
      setAppMode('upload')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMappingFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setMappingFile(file)
    setMappingError(null)
    setAvailableCsvColumns([])
    setFileUploadLabel(file.name)
    setLoading(true)
    try {
      const response = await getCsvColumns(file)
      setAvailableCsvColumns(response.columns)
      setMappingColumns({ city: '', listing_date: '', property_type: '', price: '' })
    } catch (error: any) {
      setMappingError(error?.message || 'Unable to read CSV columns')
    } finally {
      setLoading(false)
    }
  }

  const applyMapping = async () => {
    if (!mappingFile) {
      setMappingError('Please upload a CSV file before mapping columns.')
      return
    }

    if (!mappingColumns.city || !mappingColumns.listing_date || !mappingColumns.property_type || !mappingColumns.price) {
      setMappingError('Please map all required columns before applying.')
      return
    }

    setLoading(true)
    try {
      const response = await applyColumnMapping(mappingFile, {
        city: mappingColumns.city,
        listing_date: mappingColumns.listing_date,
        property_type: mappingColumns.property_type,
        price: mappingColumns.price,
      })
      await hydrateFromData(response.data, response.cities, response.property_types, response.date_min, response.date_max)
      setAppMode('mapping')
      setMappingError(null)
    } catch (error: any) {
      setMappingError(error?.message || 'Unable to apply mapping')
    } finally {
      setLoading(false)
    }
  }

  const applyFilterSelection = async () => {
    if (!data.length) return
    setLoading(true)
    try {
      const response = await applyFilters({
        data,
        cities: selectedCities,
        property_types: selectedTypes,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
      })
      setFiltered(response.data)
      setKpis(response.kpis)
      await refreshAnalysis(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadFilteredDataset = async () => {
    if (!activeData.length) return
    setLoading(true)
    try {
      const blob = await downloadCsvFile({ data: activeData })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'filtered_dataset.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadForecast = () => {
    const rows = forecast.map((item) => [item.Month, item.Forecast])
    downloadTextCsv('forecast.csv', ['Month', 'Forecast'], rows)
  }

  const downloadInsights = () => {
    const rows = insights.map((item) => [item.City, item.Property_Type, item.Avg_Price, item.Max_Price, item.Min_Price, item.Count ?? ''])
    downloadTextCsv('insights.csv', ['City', 'Property Type', 'Avg Price', 'Max Price', 'Min Price', 'Count'], rows)
  }

  const downloadSampleCsv = () => {
    const rows = [
      ['City', 'Listing_Date', 'Property_Type', 'Price'],
      ['Mumbai', '2024-01-01', 'Apartment', '12000000'],
      ['Delhi', '2024-02-15', 'Villa', '25000000'],
    ]
    downloadTextCsv('sample_real_estate.csv', rows[0], rows.slice(1))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Real Estate Demand Forecasting Lab</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#475569]">
              Load listing data, refine city and property type filters, and generate demand forecasts with a real estate analytics backend.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-[#475569]">Status</div>
            <div className="mt-3 text-2xl font-bold text-[#0F172A]">{loading ? 'Refreshing' : 'Ready'}</div>
            <div className="mt-1 text-sm text-[#64748B]">{selectedFiltersLabel}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="inline-flex overflow-hidden rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-1">
            {(['overview', 'attributes', 'application'] as Tab[]).map((currentTab) => (
              <button
                key={currentTab}
                type="button"
                onClick={() => setTab(currentTab)}
                className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
                  tab === currentTab
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {currentTab === 'overview' ? 'Overview' : currentTab === 'attributes' ? 'Important Attributes' : 'Application'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-[#475569]">{card.label}</div>
              <div className="mt-4 text-3xl font-bold text-[#0F172A]">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Overview</h2>
            <p className="text-sm text-[#475569] leading-relaxed mb-6">
              A complete forecasting engine for real estate demand analysis. Tracks market cycles, price trends, inventory behavior, and predicts demand for the upcoming months.
            </p>
            <div className="space-y-4">
              {overviewFeatures.map((item) => (
                <div key={item} className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Business Impact</h2>
              <div className="space-y-3">
                {impactStatements.map((item) => (
                  <div key={item} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">High-Level KPIs</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {overviewKpis.map((item) => (
                  <div key={item} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                    {item}
                  </div>
                ))}
              </div>
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
                    <th className="px-3 py-3 border-b border-[#E2E8F0]">Column</th>
                    <th className="px-3 py-3 border-b border-[#E2E8F0]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['City', 'City of the property listing.'],
                    ['Listing_Date', 'Date when property was listed.'],
                    ['Property_Type', 'Type of property (Villa, Plot, Apartment, etc).'],
                    ['Price', 'Listed property price.'],
                  ].map(([column, description]) => (
                    <tr key={column} className="even:bg-[#F8FAFC]">
                      <td className="px-3 py-3 border-b border-[#E2E8F0] font-semibold text-[#0F172A]">{column}</td>
                      <td className="px-3 py-3 border-b border-[#E2E8F0] text-[#475569]">{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Independent Variables</h2>
              {['City', 'Listing_Date', 'Property_Type', 'Price'].map((item) => (
                <div key={item} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Dependent Variables</h2>
              {['Demand', 'Trend', 'Forecast'].map((item) => (
                <div key={item} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#475569]">Step 1 � Load Dataset</p>
                <h2 className="text-2xl font-bold text-[#0F172A] mt-2">Dataset option</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {([
                { value: 'default', label: 'Default dataset' },
                { value: 'upload', label: 'Upload CSV' },
                { value: 'mapping', label: 'Upload CSV + Column mapping' },
              ] as Array<{ value: AppMode; label: string }>).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAppMode(option.value)}
                  className={`rounded-3xl border p-4 text-left transition ${
                    appMode === option.value ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-[#CBD5E1] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#0F172A]">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {appMode === 'default' && (
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Default dataset</h2>
              <p className="text-sm text-[#475569] mb-6">
                Load the standard dataset from the backend and visualize results in the application panels below.
              </p>
              <button
                type="button"
                onClick={loadDefaultDatasetFromApi}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
              >
                <Download className="w-4 h-4" />
                Load default dataset
              </button>
            </div>
          )}

          {appMode === 'upload' && (
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Upload CSV</h2>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
              >
                <Download className="w-4 h-4" />
                Download sample CSV
              </button>
              <div className="mt-6 rounded-3xl border border-dashed border-[#94A3B8] bg-[#F8FAFC] p-6">
                <label className="block cursor-pointer">
                  <div className="flex items-center justify-between rounded-3xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm text-[#475569]">
                    <span>{fileUploadLabel}</span>
                    <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#0F766E]">CSV</span>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={uploadCSV} />
                </label>
                <p className="mt-4 text-sm text-[#94A3B8]">Drag and drop file here � Limit 200MB per file � CSV</p>
              </div>
            </div>
          )}

          {appMode === 'mapping' && (
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Upload CSV + Column mapping</h2>
              <div className="rounded-3xl border border-dashed border-[#94A3B8] bg-[#F8FAFC] p-6">
                <label className="block cursor-pointer">
                  <div className="flex items-center justify-between rounded-3xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm text-[#475569]">
                    <span>{mappingFile ? mappingFile.name : 'No file chosen'}</span>
                    <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#0F766E]">CSV</span>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleMappingFile} />
                </label>
                <p className="mt-4 text-sm text-[#94A3B8]">Drag and drop file here � Limit 200MB per file � CSV</p>
              </div>
              {availableCsvColumns.length > 0 && (
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'City', key: 'city' },
                    { label: 'Listing_Date', key: 'listing_date' },
                    { label: 'Property_Type', key: 'property_type' },
                    { label: 'Price', key: 'price' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <label className="text-sm font-semibold text-[#0F172A]">Map ? {item.label}</label>
                      <select
                        value={mappingColumns[item.key as keyof typeof mappingColumns]}
                        onChange={(event) =>
                          setMappingColumns((current) => ({
                            ...current,
                            [item.key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#D8F5E7]"
                      >
                        <option value="">-- Select --</option>
                        {availableCsvColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {mappingError && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mappingError}</div>}
                  <button
                    type="button"
                    onClick={applyMapping}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
                  >
                    <MapPin className="w-4 h-4" />
                    Apply mapping
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Step 2 � Filters</p>
                <h2 className="text-2xl font-bold text-[#0F172A]">Filters</h2>
              </div>
              <button
                type="button"
                onClick={downloadFilteredDataset}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
              >
                <Download className="w-4 h-4" />
                Download filtered dataset
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                <label className="text-sm font-semibold text-[#0F172A] mb-3 block">City</label>
                <div className="mb-4 min-h-[56px] rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3">
                  {selectedCities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCities.map((city) => (
                        <button
                          type="button"
                          key={city}
                          onClick={() => setSelectedCities((current) => current.filter((value) => value !== city))}
                          className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]"
                        >
                          {city}
                          <span aria-hidden="true">×</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#64748B]">Choose one or more cities</div>
                  )}
                </div>
                <div className="grid gap-2 max-h-56 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      type="button"
                      key={city}
                      onClick={() => setSelectedCities((current) =>
                        current.includes(city) ? current.filter((value) => value !== city) : [...current, city]
                      )}
                      className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
                        selectedCities.includes(city)
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-white text-[#0F172A] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
                <label className="text-sm font-semibold text-[#0F172A] mb-3 block">Property Type</label>
                <div className="mb-4 min-h-[56px] rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3">
                  {selectedTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTypes.map((type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => setSelectedTypes((current) => current.filter((value) => value !== type))}
                          className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]"
                        >
                          {type}
                          <span aria-hidden="true">×</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#64748B]">Choose one or more property types</div>
                  )}
                </div>
                <div className="grid gap-2 max-h-56 overflow-y-auto">
                  {types.map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setSelectedTypes((current) =>
                        current.includes(type) ? current.filter((value) => value !== type) : [...current, type]
                      )}
                      className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
                        selectedTypes.includes(type)
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-white text-[#0F172A] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#0F172A] mb-2 block">Date range</label>
                  <input
                    type="date"
                    value={dateStart}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#D8F5E7]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0F172A] mb-2 block">to</label>
                  <input
                    type="date"
                    value={dateEnd}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#D8F5E7]"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={applyFilterSelection}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
              >
                <MapPin className="w-4 h-4" />
                Apply filters
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Data preview</p>
                <h2 className="text-xl font-bold text-[#0F172A]">Loaded rows</h2>
              </div>
              <span className="rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]">{datasetRows.toLocaleString()} rows</span>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <table className="min-w-full text-left text-sm text-[#334155]">
                <thead className="bg-white text-xs uppercase tracking-[0.12em] text-[#475569]">
                  <tr>
                    {DEFAULT_TABLE_COLUMNS.map((column) => (
                      <th key={column} className="px-3 py-3 border-b border-[#E2E8F0]">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.length ? (
                    previewRows.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                        {DEFAULT_TABLE_COLUMNS.map((column) => (
                          <td key={column} className="px-3 py-3 text-[#475569]">{row[column] ?? '-'}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-3 text-[#475569]" colSpan={DEFAULT_TABLE_COLUMNS.length}>No rows available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Metrics</p>
                  <h2 className="text-xl font-bold text-[#0F172A]">Filtered dataset KPIs</h2>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Total Listings', value: `${kpis.total_listings.toLocaleString()}` },
                  { label: 'Avg Monthly Sales', value: `${kpis.avg_monthly_sales}` },
                  { label: 'Top City', value: kpis.top_city },
                  { label: 'Avg Price', value: `? ${kpis.avg_price.toLocaleString()}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                    <div className="font-semibold text-[#0F172A]">{item.label}</div>
                    <div className="mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm overflow-auto">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Forecast summary</p>
                  <h2 className="text-xl font-bold text-[#0F172A]">Forecast horizon</h2>
                </div>
                <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#166534]">{forecastMonths} months</span>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#475569]">
                  Forecasts are recalculated from the current filtered dataset.
                </div>
                <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#475569]">
                  Filter by city, property type, and date range to update the demand prediction.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">Monthly Demand Trend</h2>
                <p className="text-sm text-[#475569]">Trend of listing demand over time.</p>
              </div>
            </div>
            <div className="mt-5">
              {forecastError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {forecastError}
                </div>
              ) : trend.length ? (
                <Plot
                  data={[
                    {
                      x: trend.map((t) => t.Month),
                      y: trend.map((t) => t.Demand),
                      type: 'scatter',
                      mode: 'lines+markers',
                      marker: { color: BLUE },
                    },
                  ]}
                  layout={{ autosize: true, height: 420, paper_bgcolor: 'white', plot_bgcolor: 'white' }}
                  style={{ width: '100%' }}
                />
              ) : (
                <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#475569]">
                  Monthly demand trend is unavailable for the current dataset. Adjust filters or load a larger dataset.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Demand by Property Type</h2>
                  <p className="text-sm text-[#475569]">Demand share by property category.</p>
                </div>
              </div>
              <div className="mt-5">
                <Plot
                  data={[
                    {
                      x: propertyDemand.map((p) => p.Property_Type),
                      y: propertyDemand.map((p) => p.Count),
                      type: 'bar',
                      marker: { color: BLUE },
                    },
                  ]}
                  layout={{ autosize: true, height: 360, paper_bgcolor: 'white', plot_bgcolor: 'white' }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm overflow-auto">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Automated insights</h2>
                  <p className="text-sm text-[#475569]">Property-level pricing summary by market segment.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadInsights}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
                >
                  <Download className="w-4 h-4" />
                  Download insights
                </button>
              </div>
              <div className="overflow-x-auto">
                {insightsError ? (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {insightsError}
                  </div>
                ) : insights.length ? (
                  <table className="min-w-full text-left text-sm text-[#334155]">
                    <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#475569]">
                      <tr>
                        <th className="px-3 py-3 border-b border-[#E2E8F0]">City</th>
                        <th className="px-3 py-3 border-b border-[#E2E8F0]">Property Type</th>
                        <th className="px-3 py-3 border-b border-[#E2E8F0]">Avg Price</th>
                        <th className="px-3 py-3 border-b border-[#E2E8F0]">Max Price</th>
                        <th className="px-3 py-3 border-b border-[#E2E8F0]">Min Price</th>
                        <th className="px-3 py-3 border-b border-[#E2E8F0]">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                          <td className="px-3 py-3 text-[#475569]">{item.City}</td>
                          <td className="px-3 py-3 text-[#475569]">{item.Property_Type}</td>
                          <td className="px-3 py-3 text-[#475569]">{Math.round(item.Avg_Price)}</td>
                          <td className="px-3 py-3 text-[#475569]">{Math.round(item.Max_Price)}</td>
                          <td className="px-3 py-3 text-[#475569]">{Math.round(item.Min_Price)}</td>
                          <td className="px-3 py-3 text-[#475569]">{item.Count ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#475569]">
                    Automated insights are unavailable for the current dataset. Select a dataset or adjust filters.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">6-Month Demand Forecast</h2>
                <p className="text-sm text-[#475569]">Forecasted demand for the next six months.</p>
              </div>
              <button
                type="button"
                onClick={downloadForecast}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58]"
              >
                <Download className="w-4 h-4" />
                Download forecast
              </button>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              {forecastError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {forecastError}
                </div>
              ) : forecast.length ? (
                <table className="min-w-full text-left text-sm text-[#334155]">
                  <thead className="bg-white text-xs uppercase tracking-[0.12em] text-[#475569]">
                    <tr>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">Month</th>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                        <td className="px-3 py-3 text-[#475569]">{item.Month}</td>
                        <td className="px-3 py-3 text-[#475569]">{item.Forecast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#475569]">
                  6-month forecast is unavailable for the current dataset. Adjust filters or load a larger dataset.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
