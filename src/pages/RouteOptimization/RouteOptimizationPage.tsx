import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { format } from 'date-fns'
import { CloudUpload, Download, Filter, Loader2, MapPin, Upload } from 'lucide-react'
import {
  applyColumnMapping,
  downloadFilteredCsv,
  filterData,
  getChartData,
  getClusters,
  getCostSimulation,
  getCsvColumns,
  getInsights,
  getPlaybooks,
  loadDefaultDataset,
  runAnomalyDetection,
  runGradientBoosting,
  runKnn,
  runRandomForest,
  uploadCsv,
} from '@/services/routeOptimizationApi'
import type {
  RouteOptimizationAnomalyResponse,
  RouteOptimizationChartResponse,
  RouteOptimizationClusterResponse,
  RouteOptimizationCostSimulationResponse,
  RouteOptimizationDatasetResponse,
  RouteOptimizationFilterResponse,
  RouteOptimizationInsightsResponse,
  RouteOptimizationMlResponse,
  RouteOptimizationMode,
  RouteOptimizationPlaybooksResponse,
  RouteOptimizationRow,
} from '@/types/routeOptimization'
import DistanceHistogram from './components/charts/DistanceHistogram'
import EfficiencyBoxPlot from './components/charts/EfficiencyBoxPlot'
import DelayScatter from './components/charts/DelayScatter'
import FuelViolin from './components/charts/FuelViolin'
import EfficiencyLine from './components/charts/EfficiencyLine'
import ClusterScatter from './components/charts/ClusterScatter'
import CorrelationHeatmap from './components/charts/CorrelationHeatmap'

type TabKey = 'overview' | 'dictionary' | 'application' | 'playbooks'

const REQUIRED_COLUMNS = [
  { column: 'Timestamp', type: 'Datetime', description: 'Trip start timestamp' },
  { column: 'Vehicle_ID', type: 'Categorical', description: 'Unique vehicle identifier' },
  { column: 'Route_ID', type: 'Categorical', description: 'Unique route identifier' },
  { column: 'Route_Distance_km', type: 'Numeric', description: 'Distance of route' },
  { column: 'Actual_Travel_Hours', type: 'Numeric', description: 'Actual hours taken' },
  { column: 'Actual_Fuel_Liters', type: 'Numeric', description: 'Actual fuel consumed' },
  { column: 'Delay_Hours', type: 'Numeric', description: 'Delay in hours' },
]

const INDEPENDENT_VARIABLES = [
  'Route_Distance_km',
  'Vehicle_Type',
  'Vehicle_Capacity_kg',
  'Load_Weight_kg',
  'Traffic_Level',
  'Weather_Condition',
  'Start_City',
  'End_City',
  'Timestamp',
]

const DEPENDENT_VARIABLES = [
  'Actual_Travel_Hours',
  'Actual_Fuel_Liters',
  'Delay_Hours',
  'Efficiency_Score',
  'Fuel_L_per_km',
  '_is_anomaly',
]

const MAPPING_FIELDS = [
  'Timestamp',
  'Vehicle_ID',
  'Vehicle_Type',
  'Route_ID',
  'Start_City',
  'End_City',
  'Route_Distance_km',
  'Traffic_Level',
  'Weather_Condition',
  'Predicted_Travel_Hours',
  'Actual_Travel_Hours',
  'Predicted_Fuel_Liters',
  'Actual_Fuel_Liters',
  'Vehicle_Capacity_kg',
  'Load_Weight_kg',
  'Delay_Hours',
  'Efficiency_Score',
]

const PREVIEW_COLUMNS = [
  'Timestamp',
  'Vehicle_ID',
  'Vehicle_Type',
  'Route_ID',
  'Start_City',
  'End_City',
  'Route_Distance_km',
  'Traffic_Level',
  'Weather_Condition',
  'Predicted_Travel_Hours',
  'Actual_Travel_Hours',
  'Predicted_Fuel_Liters',
  'Actual_Fuel_Liters',
  'Vehicle_Capacity_kg',
  'Load_Weight_kg',
  'Delay_Hours',
  'Efficiency_Score',
]

const DEFAULT_FIELD_MAP: Record<string, string> = MAPPING_FIELDS.reduce((acc, field) => {
  acc[field] = field
  return acc
}, {} as Record<string, string>)

const PLAYBOOKS = [
  {
    title: 'Top Routes to Reassign',
    key: 'routes_to_reassign' as const,
    subtitle: 'low efficiency + high fuel',
  },
  {
    title: 'Vehicles to Audit',
    key: 'vehicles_to_audit' as const,
    subtitle: 'fuel/km & delay',
  },
  {
    title: 'Drivers / Operators to Coach',
    key: 'drivers_to_coach' as const,
    subtitle: '',
  },
  {
    title: 'High-Risk Traffic × Weather Conditions',
    key: 'high_risk_conditions' as const,
    subtitle: '',
  },
]

function createRequiredColumnsCsv() {
  const rows = REQUIRED_COLUMNS.map((row) => [row.column, row.type, row.description])
  const csv = ['Column,Type,Description', ...rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'route_optimization_required_columns.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadRowsAsCsv(filename: string, rows: RouteOptimizationRow[]) {
  if (!rows.length) return
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key))
      return set
    }, new Set<string>()),
  )
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadSampleCsv() {
  const sample = [
    ['Timestamp', 'Vehicle_ID', 'Vehicle_Type', 'Route_ID', 'Start_City', 'End_City', 'Route_Distance_km', 'Traffic_Level', 'Weather_Condition', 'Predicted_Travel_Hours', 'Actual_Travel_Hours', 'Predicted_Fuel_Liters', 'Actual_Fuel_Liters', 'Vehicle_Capacity_kg', 'Load_Weight_kg', 'Delay_Hours', 'Efficiency_Score'],
    ['2026-06-01 08:00', 'V001', 'Truck', 'R001', 'Mumbai', 'Pune', '148', 'Medium', 'Clear', '4.8', '5.1', '35.4', '36.2', '1200', '900', '0.4', '0.92'],
    ['2026-06-01 09:30', 'V002', 'Van', 'R002', 'Delhi', 'Jaipur', '280', 'High', 'Rain', '7.3', '8.1', '52.6', '54.8', '900', '650', '0.8', '0.81'],
  ]
  const csv = sample.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'route_optimization_sample.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatMetric(value: number | null | undefined, decimals = 2) {
  if (value == null || Number.isNaN(value)) return '--'
  return Number(value).toFixed(decimals)
}

function getPreviewColumns(rows: RouteOptimizationRow[]) {
  return Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).slice(0, 10).forEach((key) => set.add(key))
      return set
    }, new Set<string>()),
  ).slice(0, 10)
}

function Table({
  title,
  rows,
  columns,
  emptyText = 'No data available.',
}: {
  title: string
  rows: RouteOptimizationRow[]
  columns?: string[]
  emptyText?: string
}) {
  const visibleColumns = columns ?? getPreviewColumns(rows)

  return (
    <div className="rounded-[24px] border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[13px]">
          <thead className="bg-[#F8FAFC] text-[#475569]">
            <tr>
              {visibleColumns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[#64748B]" colSpan={visibleColumns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-t border-[#E2E8F0]">
                  {visibleColumns.map((column) => (
                    <td key={column} className="max-w-[240px] px-4 py-3 align-top text-[#0F172A]">
                      {row[column] == null ? '--' : String(row[column])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#D6EAF8] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-2xl font-bold text-[#0F172A]">{title}</h3>
      {subtitle ? <p className="mt-2 text-[15px] leading-7 text-[#475569]">{subtitle}</p> : null}
    </div>
  )
}

function LoadingOverlay() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#CCFBF1] bg-[#ECFDF5] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading
    </div>
  )
}

function Header() {
  return (
    <section className="rounded-[28px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7FBFF_100%)] px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:px-8 md:py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#0F766E] text-lg font-black text-white shadow-lg">
          AA
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">Route Optimization &amp; Logistics Efficiency</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-7 text-[#475569]">Reduce miles, cut fuel, speed deliveries with data-driven routing.</p>
        </div>
      </div>
    </section>
  )
}

function OverviewTab({ kpis }: { kpis: RouteOptimizationFilterResponse['kpis'] | null }) {
  const overviewKpis = [
    { label: 'Total Routes Tracked', value: formatMetric(kpis?.total_routes, 0) },
    { label: 'Avg Efficiency Score', value: formatMetric(kpis?.avg_efficiency, 3) },
    { label: 'Avg Delay (hrs)', value: formatMetric(kpis?.avg_delay_hours, 2) },
    { label: 'Avg Fuel / Route (L)', value: formatMetric(kpis?.avg_fuel_liters, 2) },
    { label: 'On-Time %', value: `${formatMetric(kpis?.ontime_percent, 1)}%` },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle title="Overview" />

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">Purpose</p>
        <p className="mt-3 max-w-4xl text-[16px] leading-8 text-[#334155]">
          Cut route costs and delivery time by optimizing routes,
          predicting delays &amp; fuel usage,
          and prioritising high-impact fleet actions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Capabilities Card</h3>
          <ul className="mt-4 space-y-3 text-[15px] leading-7 text-[#334155]">
            <li>Route efficiency scoring and anomaly detection</li>
            <li>Predictive travel time and fuel consumption models</li>
            <li>Clustering of routes/vehicles for capacity planning</li>
            <li>Multi-filter exploration (vehicle / route / traffic / weather)</li>
            <li>Exportable prioritized actions for operations teams</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Business Impact Card</h3>
          <ul className="mt-4 space-y-3 text-[15px] leading-7 text-[#334155]">
            <li>Lower fuel &amp; operational cost per km</li>
            <li>Faster deliveries &amp; higher on-time %</li>
            <li>Reduced CO₂ per shipment</li>
            <li>Better fleet utilisation &amp; scheduling</li>
            <li>Data-driven procurement of vehicles &amp; drivers</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {overviewKpis.map((item) => (
          <SummaryCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A]">Who Should Use &amp; How</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Who:</p>
            <p className="mt-2 text-[15px] leading-7 text-[#334155]">Fleet managers, logistics planners, operations heads, sustainability teams.</p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">How:</p>
            <ol className="mt-2 space-y-2 text-[15px] leading-7 text-[#334155]">
              <li>1. Load dataset (default/upload)</li>
              <li>2. Filter by vehicle / route / period</li>
              <li>3. Review top-delay &amp; low-efficiency routes</li>
              <li>4. Export cost simulations, ML predictions &amp; playbooks to drive execution</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataDictionaryTab({ onDownloadRequiredColumns }: { onDownloadRequiredColumns: () => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Data Dictionary"
        subtitle="Below is the complete schema used for Route Optimization. Required columns must exist in your file or be mapped manually."
      />

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <Table
          title="Required columns table"
          rows={REQUIRED_COLUMNS as unknown as RouteOptimizationRow[]}
          columns={['column', 'type', 'description']}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Independent Variables Card</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {INDEPENDENT_VARIABLES.map((item) => (
              <span key={item} className="rounded-full border border-[#C7E5F6] bg-[#EFF8FD] px-3 py-1.5 text-[14px] font-semibold text-[#075985]">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Dependent Variables Card</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {DEPENDENT_VARIABLES.map((item) => (
              <span key={item} className="rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-1.5 text-[14px] font-semibold text-[#0F766E]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onDownloadRequiredColumns}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D5F58]"
        >
          <Download className="h-4 w-4" />
          Download Required Columns CSV
        </button>
      </div>
    </div>
  )
}

function ApplicationTab({
  mode,
  setMode,
  previewRows,
  data,
  filteredRows,
  loadStatus,
  loading,
  error,
  vehicles,
  vehicleTypes,
  routes,
  selectedVehicles,
  selectedVehicleTypes,
  selectedRoutes,
  setSelectedVehicles,
  setSelectedVehicleTypes,
  setSelectedRoutes,
  dateStart,
  dateEnd,
  setDateStart,
  setDateEnd,
  onDefaultData,
  onUploadCsv,
  onUploadMapping,
  uploadFile,
  setUploadFile,
  mappingFile,
  setMappingFile,
  mappingColumns,
  setMappingColumns,
  availableColumns,
  setAvailableColumns,
  onApplyMapping,
  kpis,
  charts,
  clusters,
  costSimulation,
  randomForest,
  gradientBoosting,
  knn,
  anomalyDetection,
  insights,
  onDownloadFiltered,
  onDownloadCost,
  onDownloadInsights,
  onDownloadMl,
}: {
  mode: RouteOptimizationMode
  setMode: (mode: RouteOptimizationMode) => void
  previewRows: RouteOptimizationRow[]
  data: RouteOptimizationRow[]
  filteredRows: RouteOptimizationRow[]
  loadStatus: string
  loading: boolean
  error: string | null
  vehicles: string[]
  vehicleTypes: string[]
  routes: string[]
  selectedVehicles: string[]
  selectedVehicleTypes: string[]
  selectedRoutes: string[]
  setSelectedVehicles: (values: string[]) => void
  setSelectedVehicleTypes: (values: string[]) => void
  setSelectedRoutes: (values: string[]) => void
  dateStart: string
  dateEnd: string
  setDateStart: (value: string) => void
  setDateEnd: (value: string) => void
  onDefaultData: () => void
  onUploadCsv: (file: File) => Promise<void>
  onUploadMapping: (file: File) => Promise<void>
  uploadFile: File | null
  setUploadFile: (file: File | null) => void
  mappingFile: File | null
  setMappingFile: (file: File | null) => void
  mappingColumns: Record<string, string>
  setMappingColumns: (columns: Record<string, string>) => void
  availableColumns: string[]
  setAvailableColumns: (columns: string[]) => void
  onApplyMapping: () => Promise<void>
  kpis: RouteOptimizationFilterResponse['kpis'] | null
  charts: RouteOptimizationChartResponse | null
  clusters: RouteOptimizationClusterResponse | null
  costSimulation: RouteOptimizationCostSimulationResponse | null
  randomForest: RouteOptimizationMlResponse | null
  gradientBoosting: RouteOptimizationMlResponse | null
  knn: RouteOptimizationMlResponse | null
  anomalyDetection: RouteOptimizationAnomalyResponse | null
  insights: RouteOptimizationInsightsResponse | null
  onDownloadFiltered: () => void
  onDownloadCost: () => void
  onDownloadInsights: () => void
  onDownloadMl: (label: string, rows: RouteOptimizationRow[]) => void
}) {
  const filteredPreview = filteredRows.slice(0, 10)

  return (
    <div className="space-y-6">
      <SectionTitle title="Application" />

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle title="STEP 1 — LOAD DATASET" />
        <div className="grid gap-3 md:grid-cols-3">
          {(['default', 'upload', 'mapping'] as RouteOptimizationMode[]).map((item) => (
            <label
              key={item}
              className={`flex cursor-pointer items-center gap-3 rounded-[18px] border px-4 py-4 transition ${
                mode === item ? 'border-[#0F766E] bg-[#ECFDF5]' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]'
              }`}
            >
              <input
                type="radio"
                name="dataset-mode"
                checked={mode === item}
                onChange={() => {
                  setMode(item)
                  if (item === 'default') onDefaultData()
                }}
                className="h-4 w-4 accent-[#0F766E]"
              />
              <span className="text-[15px] font-semibold text-[#0F172A]">
                {item === 'default' ? 'Default Data' : item === 'upload' ? 'Upload CSV' : 'Upload + Map Columns'}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {mode === 'upload' ? (
            <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Upload CSV Flow</p>
                  <p className="mt-1 text-[13px] text-[#475569]">Download Sample CSV for reference or upload your dataset.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadRowsAsCsv.bind(null, 'route_optimization_sample.csv', previewRows.slice(0, 2))}
                  className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A]"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </button>
              </div>

              <label className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center">
                <CloudUpload className="h-7 w-7 text-[#0F766E]" />
                <span className="mt-3 text-[15px] font-semibold text-[#0F172A]">Upload your dataset</span>
                <span className="mt-1 text-[13px] text-[#64748B]">Drag and drop file here • Limit 200MB per file • CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0] ?? null
                    setUploadFile(file)
                    if (file) void onUploadCsv(file)
                  }}
                />
              </label>
              <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">Dataset uploaded.</p>
            </div>
          ) : null}

          {mode === 'default' ? (
            <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Default Data Flow</p>
                  <p className="mt-1 text-[13px] text-[#475569]">When user clicks Default Data.</p>
                </div>
                <button
                  type="button"
                  onClick={onDefaultData}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white"
                >
                  <MapPin className="h-4 w-4" />
                  Default Data
                </button>
              </div>
              <p className="mt-4 text-[14px] text-[#475569]">GET /load-default</p>
              <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">{loadStatus}</p>
              <div className="mt-4 overflow-hidden rounded-[22px] border border-[#E2E8F0]">
                <Table title="Dataset preview table" rows={previewRows.slice(0, 10)} columns={PREVIEW_COLUMNS} />
              </div>
            </div>
          ) : null}

          {mode === 'mapping' ? (
            <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <p className="text-sm font-semibold text-[#0F172A]">Upload + Map Columns</p>
              <p className="mt-1 text-[13px] text-[#475569]">Upload a CSV and map the expected route-optimization fields.</p>
              <label className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center">
                <Upload className="h-5 w-5 text-[#0F766E]" />
                <span className="mt-3 text-[15px] font-semibold text-[#0F172A]">{mappingFile ? mappingFile.name : 'Upload CSV'}</span>
                <span className="mt-1 text-[13px] text-[#64748B]">Drag and drop file here • Limit 200MB per file • CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0] ?? null
                    setMappingFile(file)
                    if (!file) return
                    const response = await getCsvColumns(file)
                    setAvailableColumns(response.columns || [])
                    setMappingColumns(
                      MAPPING_FIELDS.reduce((acc, field) => {
                        acc[field] = response.columns?.includes(field) ? field : ''
                        return acc
                      }, {} as Record<string, string>),
                    )
                  }}
                />
              </label>
              {availableColumns.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {MAPPING_FIELDS.map((field) => (
                    <label key={field} className="rounded-[18px] border border-[#E2E8F0] bg-white p-4 text-sm font-semibold text-[#0F172A]">
                      <span className="mb-2 block">{field}</span>
                      <select
                        value={mappingColumns[field] || ''}
                        onChange={(event) => setMappingColumns({ ...mappingColumns, [field]: event.target.value })}
                        className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
                      >
                        <option value="">-- Skip --</option>
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onApplyMapping}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white"
                >
                  Apply Mapping
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle title="STEP 2 — FILTERS & PREVIEW" />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <MultiSelect label="Vehicle_ID" options={vehicles} values={selectedVehicles} onChange={setSelectedVehicles} />
          <MultiSelect label="Vehicle_Type" options={vehicleTypes} values={selectedVehicleTypes} onChange={setSelectedVehicleTypes} />
          <MultiSelect label="Route_ID" options={routes} values={selectedRoutes} onChange={setSelectedRoutes} />
          <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Date Range</p>
            <div className="mt-3 grid gap-3">
              <input
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
                className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
              />
              <input
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-[#0F172A]">Filtered Data Preview (first 10 rows)</h3>
          <button
            type="button"
            onClick={onDownloadFiltered}
            className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A]"
          >
            <Download className="h-4 w-4" />
            Download filtered preview
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[22px] border border-[#E2E8F0]">
          <Table title="" rows={filteredPreview} columns={PREVIEW_COLUMNS} />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A]">KPIs (Dynamic)</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Routes in selection" value={formatMetric(kpis?.total_routes, 0)} />
          <SummaryCard label="Avg Efficiency Score" value={formatMetric(kpis?.avg_efficiency, 3)} />
          <SummaryCard label="Avg Delay (hrs)" value={formatMetric(kpis?.avg_delay_hours, 2)} />
          <SummaryCard label="Avg Fuel / Route (L)" value={formatMetric(kpis?.avg_fuel_liters, 2)} />
          <SummaryCard label="On-Time Deliveries" value={`${formatMetric(kpis?.ontime_percent, 1)}%`} />
        </div>
      </div>

      <div className="space-y-6 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle title="EXPLORATORY DATA ANALYSIS" subtitle="Use Plotly React." />
        <DistanceHistogram data={charts?.route_distance_histogram ?? []} />
        <EfficiencyBoxPlot data={charts?.efficiency_by_vehicle_type ?? []} />
        <DelayScatter data={charts?.delay_vs_distance ?? []} />
        <FuelViolin data={charts?.fuel_per_km ?? []} />
        <EfficiencyLine data={charts?.daily_efficiency_trend ?? []} />
        <ClusterScatter data={clusters?.clusters ?? []} />
        <CorrelationHeatmap data={charts?.correlation_matrix ?? null} />
      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle title="ROUTE LEVEL COST SIMULATION" />
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Fuel Cost" value={formatMetric(costSimulation?.total_fuel_cost, 2)} />
            <SummaryCard label="Distance Cost" value={formatMetric(costSimulation?.total_distance_cost, 2)} />
            <SummaryCard label="Delay Penalty" value={formatMetric(costSimulation?.total_delay_penalty, 2)} />
            <SummaryCard label="Grand Total" value={formatMetric(costSimulation?.grand_total_cost, 2)} />
          </div>
          <button
            type="button"
            onClick={onDownloadCost}
            className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A]"
          >
            <Download className="h-4 w-4" />
            Download Cost Simulation
          </button>
        </div>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#E2E8F0]">
          <Table
            title="Route-Level Cost Simulation"
            rows={costSimulation?.simulation ?? []}
            columns={['Route_ID', 'Vehicle_ID', 'Fuel_Cost_INR', 'Distance_Cost_INR', 'Delay_Penalty_INR', 'Total_Route_Cost_INR']}
          />
        </div>
      </div>

      <div className="space-y-6 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle
          title="MACHINE LEARNING — MODELS & PREDICTIONS"
          subtitle="Models run only when sufficient rows and required columns exist (recommended: ≥ 80 rows)"
        />
        <ModelCard
          title="RandomForest — Predict Actual Travel Hours"
          metrics={randomForest}
          rows={randomForest?.predictions ?? []}
          downloadLabel="Download RandomForest predictions"
          onDownload={() => onDownloadMl('random_forest_predictions.csv', randomForest?.predictions ?? [])}
        />
        <ModelCard
          title="GradientBoosting — Predict Actual Fuel Liters"
          metrics={gradientBoosting}
          rows={gradientBoosting?.predictions ?? []}
          downloadLabel="Download GradientBoosting predictions"
          onDownload={() => onDownloadMl('gradient_boosting_predictions.csv', gradientBoosting?.predictions ?? [])}
        />
        <ModelCard
          title="KNN Regressor — Predict Delay Hours"
          metrics={knn}
          rows={knn?.predictions ?? []}
          downloadLabel="Download KNN predictions"
          onDownload={() => onDownloadMl('knn_predictions.csv', knn?.predictions ?? [])}
        />
        <AnomalyCard
          title="Anomaly Detection — IsolationForest"
          metrics={anomalyDetection}
          rows={anomalyDetection?.anomalies ?? []}
          onDownload={() => onDownloadMl('anomaly_detection.csv', anomalyDetection?.anomalies ?? [])}
        />
      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle title="AUTOMATED INSIGHTS" />
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onDownloadInsights}
            className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A]"
          >
            <Download className="h-4 w-4" />
            Download insights CSV
          </button>
        </div>
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#E2E8F0]">
          <Table title="Automated Insights" rows={insights?.insights ?? []} />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A]">Load status</h3>
        <p className="mt-3 text-[15px] text-[#475569]">{loading ? 'Refreshing analysis...' : loadStatus}</p>
        {error ? <p className="mt-2 text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
        <p className="mt-4 text-sm text-[#64748B]">Loaded rows: {data.length}</p>
      </div>
    </div>
  )
}

function MultiSelect({
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
  const placeholder = `Choose one or more ${label.toLowerCase().replace(/_/g, ' ')}${label === 'Vehicle_Type' ? 's' : label === 'Route_ID' ? 's' : 's'}`

  return (
    <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">{label}</p>
      <div className="mb-4 mt-3 min-h-[56px] rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-3">
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {values.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange(values.filter((value) => value !== option))}
                className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C]"
              >
                {option}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#64748B]">{placeholder}</div>
        )}
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() =>
              onChange(
                values.includes(option) ? values.filter((value) => value !== option) : [...values, option],
              )
            }
            className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
              values.includes(option) ? 'bg-[#0F766E] text-white' : 'bg-white text-[#0F172A] hover:bg-[#E2E8F0]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModelCard({
  title,
  metrics,
  rows,
  downloadLabel,
  onDownload,
}: {
  title: string
  metrics: RouteOptimizationMlResponse | null
  rows: RouteOptimizationRow[]
  downloadLabel: string
  onDownload: () => void
}) {
  return (
    <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-[#0F172A]">{title}</h4>
          <div className="mt-2 flex gap-3 text-sm text-[#475569]">
            <span>RMSE {formatMetric(metrics?.rmse, 3)}</span>
            <span>R² {formatMetric(metrics?.r2, 3)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] shadow-sm"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white">
        <Table title="Prediction table" rows={rows} emptyText="Prediction table will appear when backend returns results." />
      </div>
    </div>
  )
}

function AnomalyCard({
  title,
  metrics,
  rows,
  onDownload,
}: {
  title: string
  metrics: RouteOptimizationAnomalyResponse | null
  rows: RouteOptimizationRow[]
  onDownload: () => void
}) {
  return (
    <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-[#0F172A]">{title}</h4>
          <div className="mt-2 flex gap-3 text-sm text-[#475569]">
            <span>Detected anomalies {formatMetric(metrics?.num_anomalies, 0)}</span>
            <span>Rate {formatMetric(metrics?.anomaly_rate, 2)}%</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download anomalies
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white">
        <Table title="Anomaly table" rows={rows} emptyText="Anomaly table will appear when backend returns results." />
      </div>
    </div>
  )
}

function ActionPlaybooksTab({
  playbooks,
  onDownloadPlaybook,
}: {
  playbooks: RouteOptimizationPlaybooksResponse | null
  onDownloadPlaybook: (name: string, rows: RouteOptimizationRow[]) => void
}) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Action Playbooks" />

      {PLAYBOOKS.map((section) => {
        const rows = playbooks?.[section.key] ?? []
        return (
          <div key={section.key} className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  {section.title}
                  {section.subtitle ? <span className="ml-2 text-[14px] font-medium text-[#64748B]">({section.subtitle})</span> : null}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onDownloadPlaybook(`${section.key}.csv`, rows)}
                className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-[#0F172A]"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-[18px] border border-[#E2E8F0]">
              <Table title="Table" rows={rows} />
            </div>
          </div>
        )
      })}

      <div className="rounded-[24px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_100%)] p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#0F172A]">Executive Recommendations</h3>
        <div className="mt-4 space-y-2 text-[15px] leading-7 text-[#334155]">
          <p>Reassign or redesign the 10 least efficient high-fuel routes.</p>
          <p>Audit vehicles with the worst fuel/km and highest delay scores.</p>
          <p>Coach or re-pair drivers/operators flagged by the inefficiency scorecard.</p>
          <p>Avoid high-risk traffic-weather combinations.</p>
          <p>Use ML-predicted travel hours for planning time-critical routes.</p>
          <p>Feed these insights into monthly fleet reviews and vendor contracts.</p>
        </div>
      </div>
    </div>
  )
}

export function RouteOptimizationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [mode, setMode] = useState<RouteOptimizationMode>('default')
  const [data, setData] = useState<RouteOptimizationRow[]>([])
  const [filteredRows, setFilteredRows] = useState<RouteOptimizationRow[]>([])
  const [previewRows, setPreviewRows] = useState<RouteOptimizationRow[]>([])
  const [vehicles, setVehicles] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [routes, setRoutes] = useState<string[]>([])
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([])
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [loadStatus, setLoadStatus] = useState('Default dataset not loaded yet.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [mappingFile, setMappingFile] = useState<File | null>(null)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [mappingColumns, setMappingColumns] = useState<Record<string, string>>(DEFAULT_FIELD_MAP)
  const [kpis, setKpis] = useState<RouteOptimizationFilterResponse['kpis'] | null>(null)
  const [charts, setCharts] = useState<RouteOptimizationChartResponse | null>(null)
  const [clusters, setClusters] = useState<RouteOptimizationClusterResponse | null>(null)
  const [costSimulation, setCostSimulation] = useState<RouteOptimizationCostSimulationResponse | null>(null)
  const [randomForest, setRandomForest] = useState<RouteOptimizationMlResponse | null>(null)
  const [gradientBoosting, setGradientBoosting] = useState<RouteOptimizationMlResponse | null>(null)
  const [knn, setKnn] = useState<RouteOptimizationMlResponse | null>(null)
  const [anomalyDetection, setAnomalyDetection] = useState<RouteOptimizationAnomalyResponse | null>(null)
  const [insights, setInsights] = useState<RouteOptimizationInsightsResponse | null>(null)
  const [playbooks, setPlaybooks] = useState<RouteOptimizationPlaybooksResponse | null>(null)

  const maybeColumns = useMemo(() => getPreviewColumns(filteredRows.length ? filteredRows : previewRows), [filteredRows, previewRows])

  async function loadDefaultData() {
    setLoading(true)
    setError(null)
    try {
      const response: RouteOptimizationDatasetResponse = await loadDefaultDataset()
      const rows = response.data ?? []
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setVehicles(response.vehicles ?? [])
      setVehicleTypes(response.vehicle_types ?? [])
      setRoutes(response.routes ?? [])
      setSelectedVehicles([])
      setSelectedVehicleTypes([])
      setSelectedRoutes([])
      setDateStart(response.date_min?.slice(0, 10) ?? '')
      setDateEnd(response.date_max?.slice(0, 10) ?? '')
      setLoadStatus('Default dataset loaded.')
      setMode('default')
      await applyCurrentFilters(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load default dataset.')
      setLoadStatus('Unable to load default dataset.')
    } finally {
      setLoading(false)
    }
  }

  async function uploadSelectedCsv(file: File) {
    setLoading(true)
    setError(null)
    try {
      const response = await uploadCsv(file)
      const rows = response.data ?? []
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setVehicles(response.vehicles ?? [])
      setVehicleTypes(response.vehicle_types ?? [])
      setMode('upload')
      setRoutes(response.routes ?? [])
      setSelectedVehicles([])
      setSelectedVehicleTypes([])
      setSelectedRoutes([])
      setDateStart(response.date_min?.slice(0, 10) ?? '')
      setDateEnd(response.date_max?.slice(0, 10) ?? '')
      setLoadStatus('Dataset uploaded.')
      await applyCurrentFilters(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setLoadStatus('Dataset upload failed.')
    } finally {
      setLoading(false)
    }
  }

  async function prepareMappingColumns(file: File) {
    setLoading(true)
    setError(null)
    try {
      const response = await getCsvColumns(file)
      setAvailableColumns(response.columns ?? [])
      setMappingColumns(
        MAPPING_FIELDS.reduce((acc, field) => {
          acc[field] = response.columns?.includes(field) ? field : ''
          return acc
        }, {} as Record<string, string>),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read CSV columns.')
    } finally {
      setLoading(false)
    }
  }

  async function applyMapping() {
    if (!mappingFile) {
      setError('Please upload a CSV file first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await applyColumnMapping(mappingFile, mappingColumns)
      const rows = response.data ?? []
      const derivedVehicleTypes = Array.from(new Set(rows.map((row) => row.Vehicle_Type).filter(Boolean) as string[]))
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setVehicles(response.vehicles ?? [])
      setVehicleTypes(derivedVehicleTypes)
      setRoutes(response.routes ?? [])
      setMode('mapping')
      setSelectedVehicles([])
      setSelectedVehicleTypes([])
      setSelectedRoutes([])
      setLoadStatus('Dataset uploaded.')
      await applyCurrentFilters(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mapping failed.')
    } finally {
      setLoading(false)
    }
  }

  async function applyCurrentFilters(rows: RouteOptimizationRow[]) {
    if (!rows.length) {
      setFilteredRows([])
      setKpis(null)
      setCharts(null)
      setClusters(null)
      setCostSimulation(null)
      setRandomForest(null)
      setGradientBoosting(null)
      setKnn(null)
      setAnomalyDetection(null)
      setInsights(null)
      setPlaybooks(null)
      return
    }

    try {
      const filterResponse = await filterData({
        data: rows,
        vehicle_ids: selectedVehicles.length ? selectedVehicles : undefined,
        vehicle_types: selectedVehicleTypes.length ? selectedVehicleTypes : undefined,
        route_ids: selectedRoutes.length ? selectedRoutes : undefined,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
      })
      const selectedRows = filterResponse.data ?? rows
      setFilteredRows(selectedRows)
      setKpis(filterResponse.kpis)

      const [chartsResponse, clustersResponse, costResponse, rfResponse, gbResponse, knnResponse, anomalyResponse, insightsResponse, playbooksResponse] = await Promise.all([
        getChartData(selectedRows).catch(() => null),
        getClusters(selectedRows).catch(() => null),
        getCostSimulation(selectedRows).catch(() => null),
        runRandomForest(selectedRows).catch(() => null),
        runGradientBoosting(selectedRows).catch(() => null),
        runKnn(selectedRows).catch(() => null),
        runAnomalyDetection(selectedRows).catch(() => null),
        getInsights(selectedRows).catch(() => null),
        getPlaybooks(selectedRows).catch(() => null),
      ])

      setCharts(chartsResponse)
      setClusters(clustersResponse)
      setCostSimulation(costResponse)
      setRandomForest(rfResponse)
      setGradientBoosting(gbResponse)
      setKnn(knnResponse)
      setAnomalyDetection(anomalyResponse)
      setInsights(insightsResponse)
      setPlaybooks(playbooksResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter analysis failed.')
      setFilteredRows(rows)
    }
  }

  useEffect(() => {
    void loadDefaultData()
  }, [])

  useEffect(() => {
    if (!data.length) return
    const timer = window.setTimeout(() => {
      void applyCurrentFilters(data)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [data, selectedVehicles, selectedVehicleTypes, selectedRoutes, dateStart, dateEnd])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header />

        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-4">
            {(['overview', 'dictionary', 'application', 'playbooks'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-[18px] px-5 py-3 text-sm font-semibold transition ${
                  activeTab === tab ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'dictionary' ? 'Data Dictionary' : tab === 'application' ? 'Application' : 'Action Playbooks'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' ? (
          <OverviewTab kpis={kpis} />
        ) : activeTab === 'dictionary' ? (
          <DataDictionaryTab onDownloadRequiredColumns={createRequiredColumnsCsv} />
        ) : activeTab === 'application' ? (
          <ApplicationTab
            mode={mode}
            setMode={setMode}
            previewRows={previewRows}
            data={data}
            filteredRows={filteredRows.length ? filteredRows : previewRows}
            loadStatus={loadStatus}
            loading={loading}
            error={error}
            vehicles={vehicles}
            vehicleTypes={vehicleTypes}
            routes={routes}
            selectedVehicles={selectedVehicles}
            selectedVehicleTypes={selectedVehicleTypes}
            selectedRoutes={selectedRoutes}
            setSelectedVehicles={setSelectedVehicles}
            setSelectedVehicleTypes={setSelectedVehicleTypes}
            setSelectedRoutes={setSelectedRoutes}
            dateStart={dateStart}
            dateEnd={dateEnd}
            setDateStart={setDateStart}
            setDateEnd={setDateEnd}
            onDefaultData={loadDefaultData}
            onUploadCsv={uploadSelectedCsv}
            onUploadMapping={prepareMappingColumns}
            uploadFile={uploadFile}
            setUploadFile={setUploadFile}
            mappingFile={mappingFile}
            setMappingFile={setMappingFile}
            mappingColumns={mappingColumns}
            setMappingColumns={setMappingColumns}
            availableColumns={availableColumns}
            setAvailableColumns={setAvailableColumns}
            onApplyMapping={applyMapping}
            kpis={kpis}
            charts={charts}
            clusters={clusters}
            costSimulation={costSimulation}
            randomForest={randomForest}
            gradientBoosting={gradientBoosting}
            knn={knn}
            anomalyDetection={anomalyDetection}
            insights={insights}
            onDownloadFiltered={() => downloadRowsAsCsv('filtered_preview.csv', filteredRows.length ? filteredRows : previewRows)}
            onDownloadCost={() => downloadRowsAsCsv('cost_simulation.csv', costSimulation?.simulation ?? [])}
            onDownloadInsights={() => downloadRowsAsCsv('insights.csv', insights?.insights ?? [])}
            onDownloadMl={(name, rows) => downloadRowsAsCsv(name, rows)}
          />
        ) : (
          <ActionPlaybooksTab
            playbooks={playbooks}
            onDownloadPlaybook={(name, rows) => downloadRowsAsCsv(name, rows)}
          />
        )}

        {loading ? (
          <div className="fixed bottom-6 right-6">
            <LoadingOverlay />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RouteOptimizationPage
