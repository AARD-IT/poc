import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import { CloudUpload, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import {
  loadDefaultDataset,
  uploadCsv,
  applyFilters,
  getChartData,
  getForecast,
  getInsights,
} from '@/services/realEstateDemandForecastingApi'

const BLUE = '#064b86'

type Tab = 'overview' | 'attributes' | 'application'
type TrendItem = { Month: string; Demand: number }
type PropertyDemandItem = { Property_Type: string; Count: number }
type ForecastItem = { Month: string; Forecast: number }
type InsightItem = {
  City: string
  Property_Type: string
  Avg_Price: number
  Max_Price: number
  Min_Price: number
}

const overviewFeatures = [
  'Load default dataset or upload your own real estate CSV with automatic column mapping.',
  'Filter by city and property type to refine demand forecasts and market segmentation.',
  'Visualize monthly demand trends, property demand share, and forecasted listings.',
  'Generate pricing insights and spot high-demand property categories quickly.',
]

const impactStatements = [
  'Make faster investment decisions using data-driven demand signals.',
  'Reduce inventory risk by aligning listing trends with forecasted demand.',
  'Surface high-value neighborhoods and property segments instantly.',
  'Scale analytics with an easy upload-and-forecast workflow for new portfolios.',
]

export function RealEstateDemandForecastingSectionPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<Record<string, any>[]>([])
  const [filtered, setFiltered] = useState<Record<string, any>[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [propertyDemand, setPropertyDemand] = useState<PropertyDemandItem[]>([])
  const [loading, setLoading] = useState(false)

  const activeData = filtered.length ? filtered : data
  const datasetRows = activeData.length
  const datasetCities = cities.length
  const datasetTypes = types.length
  const forecastMonths = forecast.length || 6
  const previewRows = activeData.slice(0, 4)
  const selectedFiltersLabel = [
    selectedCities.length ? `${selectedCities.length} city${selectedCities.length === 1 ? '' : 'ies'} selected` : null,
    selectedTypes.length ? `${selectedTypes.length} property type${selectedTypes.length === 1 ? '' : 's'} selected` : null,
  ]
    .filter(Boolean)
    .join(' · ') || 'None selected'

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

  async function loadDefaultDatasetFromApi() {
    setLoading(true)
    try {
      const response = await loadDefaultDataset()
      await hydrateFromData(response.data, response.cities, response.property_types)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function hydrateFromData(rawData: Record<string, any>[], rawCities: string[], rawTypes: string[]) {
    setData(rawData)
    setFiltered(rawData)
    setCities(rawCities)
    setTypes(rawTypes)
    try {
      const chartData = await getChartData(rawData)
      setTrend(chartData.monthly_demand_trend)
      setPropertyDemand(chartData.demand_by_property_type)
      const forecastResponse = await getForecast(rawData)
      setForecast(forecastResponse.forecast)
      const insightsResponse = await getInsights(rawData)
      setInsights(insightsResponse.insights as InsightItem[])
    } catch (err) {
      console.error(err)
    }
  }

  const uploadCSV = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const response = await uploadCsv(file)
      await hydrateFromData(response.data, response.cities, response.property_types)
    } catch (err) {
      console.error(err)
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
      })
      setFiltered(response.data)
      const chartData = await getChartData(response.data)
      setTrend(chartData.monthly_demand_trend)
      setPropertyDemand(chartData.demand_by_property_type)
      const forecastResponse = await getForecast(response.data)
      setForecast(forecastResponse.forecast)
      const insightsResponse = await getInsights(response.data)
      setInsights(insightsResponse.insights as InsightItem[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
              This project provides real estate demand forecasting and market insights using time-series analysis, property segmentation, and automated reporting.
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
                    ['Listing_Date', 'Date of property listing'],
                    ['Property_Type', 'Type of property, such as Apartment or Villa'],
                    ['Price', 'Listing or sale price of the property'],
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
              {['City', 'Listing_Date', 'Property_Type'].map((variable) => (
                <div key={variable} className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  <span className="font-semibold text-[#0F172A]">{variable}</span>
                  <p className="mt-2 text-[#475569]">Independent variable used to slice demand and apply filters.</p>
                </div>
              ))}
              <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                <span className="font-semibold text-[#0F172A]">Price</span>
                <p className="mt-2 text-[#475569]">Dependent variable representing the listing value and pricing target.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Step 1</p>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Load dataset</h2>
                </div>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${datasetRows ? 'bg-[#ECFDF5] text-[#166534]' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>
                  {datasetRows ? `${datasetRows.toLocaleString()} rows loaded` : 'No dataset loaded'}
                </span>
              </div>
              <div className="rounded-3xl border border-dashed border-[#94A3B8] bg-[#F8FAFC] p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                    <CloudUpload className="w-6 h-6 text-[#0F766E]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A]">Upload your CSV</p>
                    <p className="text-sm text-[#475569]">City, Listing_Date, Property_Type, Price</p>
                  </div>
                </div>
                <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-between rounded-3xl bg-white px-5 py-4 text-sm font-semibold text-[#0F172A] shadow-sm transition hover:bg-slate-50">
                  Browse file
                  <input type="file" accept=".csv" className="hidden" onChange={uploadCSV} />
                </label>
              </div>
              <div className="mt-5 rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#475569]">
                <p>Upload a CSV file to refresh demand charts and forecast data. The default dataset is loaded automatically when the section opens.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Step 2</p>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Apply filters</h2>
                </div>
                <p className="text-sm text-[#475569]">Current filter selection</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-[#0F172A] mb-2 block">Cities</label>
                  <select
                    multiple
                    className="w-full rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#D8F5E7]"
                    onChange={(e) => setSelectedCities([...e.target.selectedOptions].map((o) => o.value))}
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0F172A] mb-2 block">Property types</label>
                  <select
                    multiple
                    className="w-full rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#D8F5E7]"
                    onChange={(e) => setSelectedTypes([...e.target.selectedOptions].map((o) => o.value))}
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
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
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
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
                      <th className="px-3 py-3">City</th>
                      <th className="px-3 py-3">Listing Date</th>
                      <th className="px-3 py-3">Property Type</th>
                      <th className="px-3 py-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                        <td className="px-3 py-3 text-[#475569]">{row.City}</td>
                        <td className="px-3 py-3 text-[#475569]">{row.Listing_Date}</td>
                        <td className="px-3 py-3 text-[#475569]">{row.Property_Type}</td>
                        <td className="px-3 py-3 text-[#475569]">₹ {row.Price?.toLocaleString?.()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#475569]">Forecast summary</p>
                  <h2 className="text-xl font-bold text-[#0F172A]">Insights at a glance</h2>
                </div>
                <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#166534]">{forecastMonths} months</span>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#475569]">
                  <p className="font-semibold text-[#0F172A] mb-2">Forecast range</p>
                  <p>Projected demand for the next six months based on the loaded dataset.</p>
                </div>
                <div className="rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#475569]">
                  <p className="font-semibold text-[#0F172A] mb-2">Demand trend</p>
                  <p>Compare current market demand with historical property demand and segment performance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">Monthly Demand Trend</h2>
                <p className="text-sm text-[#475569]">A trend line of monthly listing demand for the current dataset.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]">Visual tool</span>
            </div>
            <div className="mt-5">
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
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">Demand by Property Type</h2>
                  <p className="text-sm text-[#475569]">Identify the strongest property segments.</p>
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
                  <p className="text-sm text-[#475569]">Grouped pricing summary by city and property type.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#334155]">
                  <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#475569]">
                    <tr>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">City</th>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">Property Type</th>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">Avg Price</th>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">Max Price</th>
                      <th className="px-3 py-3 border-b border-[#E2E8F0]">Min Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                        <td className="px-3 py-3 text-[#475569]">{item.City}</td>
                        <td className="px-3 py-3 text-[#475569]">{item.Property_Type}</td>
                        <td className="px-3 py-3 text-[#475569]">₹ {Math.round(item.Avg_Price)}</td>
                        <td className="px-3 py-3 text-[#475569]">₹ {Math.round(item.Max_Price)}</td>
                        <td className="px-3 py-3 text-[#475569]">₹ {Math.round(item.Min_Price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
