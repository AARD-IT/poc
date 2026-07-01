import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { CloudUpload, Download, Loader2, MapPin, Upload } from 'lucide-react'
import {
  applyColumnMapping,
  downloadFilteredCsv,
  filterData,
  getChartData,
  getClusters,
  getCsvColumns,
  getInsights,
  getPlaybooks,
  loadDefaultDataset,
  runDelayPredictor,
  runPickTimePredictor,
  runProductivityPredictor,
  uploadCsv,
} from '@/services/warehouseOperationsApi'
import type {
  WarehouseOperationsChartResponse,
  WarehouseOperationsClusterResponse,
  WarehouseOperationsDatasetResponse,
  WarehouseOperationsFilterResponse,
  WarehouseOperationsInsightsResponse,
  WarehouseOperationsMlResponse,
  WarehouseOperationsMode,
  WarehouseOperationsPlaybooksResponse,
  WarehouseOperationsRow,
} from '@/types/warehouseOperations'

import PickQtyDistribution from './components/charts/PickQtyDistribution'
import TravelDistanceOverTime from './components/charts/TravelDistanceOverTime'
import ZoneHeatmapActivity from './components/charts/ZoneHeatmapActivity'
import SlottingScoreSkuClass from './components/charts/SlottingScoreSkuClass'
import DelayReasonsDistribution from './components/charts/DelayReasonsDistribution'
import TravelTimeVsDistance from './components/charts/TravelTimeVsDistance'
import EquipmentUsage from './components/charts/EquipmentUsage'
import PickerProductivityDistribution from './components/charts/PickerProductivityDistribution'
import CongestionFactorWarehouse from './components/charts/CongestionFactorWarehouse'
import SkuWeightDistribution from './components/charts/SkuWeightDistribution'
import PickPackTime from './components/charts/PickPackTime'
import HeatmapLevelOverTime from './components/charts/HeatmapLevelOverTime'
import AisleCongestion from './components/charts/AisleCongestion'
import ProductivityShift from './components/charts/ProductivityShift'
import DelayDurationDistribution from './components/charts/DelayDurationDistribution'
import ClusterScatter from './components/charts/ClusterScatter'

type TabKey = 'overview' | 'dictionary' | 'application' | 'playbooks'

const REQUIRED_COLUMNS = [
  { column: 'Order_ID', type: 'Categorical', description: 'Unique identifier of the customer order' },
  { column: 'Warehouse', type: 'Categorical', description: 'Warehouse / FC identifier' },
  { column: 'Zone', type: 'Categorical', description: 'Warehouse zone / segment' },
  { column: 'Aisle', type: 'Categorical', description: 'Aisle where items are stored' },
  { column: 'Bin', type: 'Categorical', description: 'Bin / location code for SKU' },
  { column: 'Order_Timestamp', type: 'Datetime', description: 'Timestamp when order was created / released' },
  { column: 'Shift', type: 'Categorical', description: 'Shift (Morning, Afternoon, Night)' },
  { column: 'Picker_ID', type: 'Categorical', description: 'Picker ID' },
  { column: 'SKU', type: 'Categorical', description: 'Stock Keeping Unit' },
  { column: 'SKU_Weight_KG', type: 'Numeric', description: 'SKU Weight' },
  { column: 'SKU_Cube_M3', type: 'Numeric', description: 'SKU Volume' },
  { column: 'SKU_Class', type: 'Categorical', description: 'SKU ABC Class' },
  { column: 'Pick_Qty', type: 'Numeric', description: 'Quantity Picked' },
  { column: 'Travel_Distance_M', type: 'Numeric', description: 'Travel Distance' },
  { column: 'Travel_Time_Sec', type: 'Numeric', description: 'Travel Time' },
  { column: 'Pick_Time_Sec', type: 'Numeric', description: 'Pick Time' },
  { column: 'Pack_Time_Sec', type: 'Numeric', description: 'Pack Time' },
  { column: 'Heatmap_Level', type: 'Numeric', description: 'Congestion Heat Level' },
  { column: 'Slotting_Score', type: 'Numeric', description: 'Slotting Optimization Score' },
  { column: 'Equipment_Type', type: 'Categorical', description: 'Equipment Used' },
  { column: 'Picker_Productivity_Items_Hour', type: 'Numeric', description: 'Productivity' },
  { column: 'Congestion_Factor', type: 'Numeric', description: 'Congestion Metric' },
  { column: 'Delay_Reason', type: 'Categorical', description: 'Delay Category' },
  { column: 'Delay_Minutes', type: 'Numeric', description: 'Delay Duration' },
]

const INDEPENDENT_VARIABLES = [
  'Warehouse',
  'Zone',
  'Aisle',
  'Bin',
  'Order_Timestamp',
  'Shift',
  'Picker_ID',
  'SKU',
  'SKU_Weight_KG',
  'SKU_Cube_M3',
  'SKU_Class',
  'Pick_Qty',
  'Travel_Distance_M',
  'Travel_Time_Sec',
  'Heatmap_Level',
  'Slotting_Score',
  'Equipment_Type',
  'Congestion_Factor',
  'Delay_Reason',
]

const DEPENDENT_VARIABLES = [
  'Pick_Time_Sec',
  'Delay_Minutes',
  'Picker_Productivity_Items_Hour',
  'Pack_Time_Sec',
]

const MAPPING_FIELDS = REQUIRED_COLUMNS.map((col) => col.column)

const PREVIEW_COLUMNS = REQUIRED_COLUMNS.map((col) => col.column)

const DEFAULT_FIELD_MAP: Record<string, string> = MAPPING_FIELDS.reduce((acc, field) => {
  acc[field] = field
  return acc
}, {} as Record<string, string>)

const PLAYBOOKS = [
  { Action: 'Reassign congested aisles', Rationale: 'Divert picks away from aisles with persistent high Heatmap_Level and Congestion_Factor.' },
  { Action: 'Relocate slow-moving SKUs', Rationale: 'Move low-velocity SKUs to deeper locations; free golden zones for Class A SKUs.' },
  { Action: 'Picker retraining', Rationale: 'Target pickers in the bottom productivity quartile for coaching and SOP refresh.' },
  { Action: 'Forklift / AMR scheduling', Rationale: 'Assign AMRs or forklifts to long-distance routes and heavy SKUs to cut travel time.' },
  { Action: 'Travel-time reduction', Rationale: 'Group orders and routes by Zone/Aisle to minimise zig-zag walk patterns.' },
  { Action: 'Congestion hotfix', Rationale: 'Stagger high-volume picks across shifts or windows to flatten heatmap spikes.' },
  { Action: 'Slotting optimisation', Rationale: 'Increase Slotting_Score for high-frequency SKUs by bringing them closer to docks.' },
  { Action: 'Delay elimination', Rationale: 'Use Delay_Reason stats to run focused kaizen events on top-3 root causes.' },
]

function createRequiredColumnsCsv() {
  const rows = REQUIRED_COLUMNS.map((row) => [row.column, row.type, row.description])
  const csv = ['Column,Type,Description', ...rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'warehouse_operations_required_columns.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadRowsAsCsv(filename: string, rows: WarehouseOperationsRow[]) {
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
    ['Order_ID', 'Warehouse', 'Zone', 'Aisle', 'Bin', 'Order_Timestamp', 'Shift', 'Picker_ID', 'SKU', 'SKU_Weight_KG', 'SKU_Cube_M3', 'SKU_Class', 'Pick_Qty', 'Travel_Distance_M', 'Travel_Time_Sec', 'Pick_Time_Sec', 'Pack_Time_Sec', 'Heatmap_Level', 'Slotting_Score', 'Equipment_Type', 'Picker_Productivity_Items_Hour', 'Congestion_Factor', 'Delay_Reason', 'Delay_Minutes'],
    ['ORD1001', 'WH_North', 'Zone_A', 'Aisle_12', 'Bin_04', '2023-06-15 08:30:00', 'Morning', 'PK_042', 'SKU_90234', '12.4', '0.045', 'A', '3', '45.2', '72', '120', '45', '2', '85.5', 'Forklift', '150.0', '1.2', 'None', '0.0'],
    ['ORD1002', 'WH_North', 'Zone_B', 'Aisle_18', 'Bin_12', '2023-06-15 09:15:00', 'Morning', 'PK_018', 'SKU_11234', '1.8', '0.005', 'C', '1', '12.6', '24', '35', '18', '4', '62.1', 'Hand_Cart', '95.0', '2.8', 'Aisle Congestion', '4.5'],
  ]
  const csv = sample.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'warehouse_operations_sample.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatMetric(value: number | null | undefined, decimals = 2) {
  if (value == null || Number.isNaN(value)) return '--'
  return Number(value).toFixed(decimals)
}

function getPreviewColumns(rows: WarehouseOperationsRow[]) {
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
  rows: WarehouseOperationsRow[]
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
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">Warehouse Operations Analytics</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-7 text-[#475569]">Analyse picking efficiency, slotting, layouts, and picker productivity.</p>
        </div>
      </div>
    </section>
  )
}

function OverviewTab({ kpis }: { kpis: WarehouseOperationsFilterResponse['kpis'] | null }) {
  const overviewKpis = [
    { label: 'Total Orders', value: formatMetric(kpis?.total_orders, 0) },
    { label: 'Avg Pick Time', value: `${formatMetric(kpis?.avg_pick_time_sec, 1)}s` },
    { label: 'Avg Travel Time', value: `${formatMetric(kpis?.avg_travel_time_sec, 1)}s` },
    { label: 'Heatmap Intensity', value: formatMetric(kpis?.avg_heatmap_level, 2) },
    { label: 'Productivity Score', value: `${formatMetric(kpis?.avg_productivity, 1)} items/hr` },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle title="Overview" />

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">Purpose</p>
        <p className="mt-3 max-w-4xl text-[16px] leading-8 text-[#334155]">
          Analyse picking efficiency, slotting, congestion, picker productivity and equipment usage.
          Use this to redesign layout, rebalance workload, and cut cost per order without breaking your ops team.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Capabilities Card</h3>
          <ul className="mt-4 space-y-3 text-[15px] leading-7 text-[#334155]">
            <li>Warehouse heatmaps &amp; congestion analysis</li>
            <li>Pick-path &amp; travel distance efficiency</li>
            <li>Slotting score &amp; SKU-class optimisation</li>
            <li>Picker productivity benchmarking</li>
            <li>Delay root-cause analytics</li>
            <li>Equipment utilisation and mix analysis</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Business Impact Card</h3>
          <ul className="mt-4 space-y-3 text-[15px] leading-7 text-[#334155]">
            <li>Faster order fulfilment &amp; higher throughput</li>
            <li>Lower labour + operational cost per order</li>
            <li>Reduced congestion &amp; picker fatigue</li>
            <li>Better layout &amp; slotting decisions</li>
            <li>More predictable performance during peaks</li>
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
            <p className="mt-2 text-[15px] leading-7 text-[#334155]">Warehouse managers &amp; DC heads, ops / logistics leaders, industrial engineering / IE teams, process excellence &amp; BI teams.</p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#0F766E]">How:</p>
            <ol className="mt-2 space-y-2 text-[15px] leading-7 text-[#334155]">
              <li>1. Load dataset (default/upload)</li>
              <li>2. Filter by warehouse, shift, and picker ID</li>
              <li>3. Audit pick times and travel distance metrics</li>
              <li>4. Implement ML predictions and download playbooks for action</li>
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
        subtitle="Below is the complete schema used for Warehouse Operations. Required columns must exist in your file or be mapped manually."
      />

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <Table
          title="Required columns table"
          rows={REQUIRED_COLUMNS as unknown as WarehouseOperationsRow[]}
          columns={['column', 'type', 'description']}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Independent Variables</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {INDEPENDENT_VARIABLES.map((item) => (
              <span key={item} className="rounded-full border border-[#C7E5F6] bg-[#EFF8FD] px-3 py-1.5 text-[14px] font-semibold text-[#075985]">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A]">Dependent Variables</h3>
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
          Download Data Dictionary
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
  warehouses,
  shifts,
  pickerIds,
  selectedWarehouses,
  selectedShifts,
  selectedPickerIds,
  setSelectedWarehouses,
  setSelectedShifts,
  setSelectedPickerIds,
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
  pickTimeMl,
  delayMl,
  productivityMl,
  insights,
  onDownloadFiltered,
  onDownloadInsights,
  onDownloadMl,
  onDownloadClusters,
}: {
  mode: WarehouseOperationsMode
  setMode: (mode: WarehouseOperationsMode) => void
  previewRows: WarehouseOperationsRow[]
  data: WarehouseOperationsRow[]
  filteredRows: WarehouseOperationsRow[]
  loadStatus: string
  loading: boolean
  error: string | null
  warehouses: string[]
  shifts: string[]
  pickerIds: string[]
  selectedWarehouses: string[]
  selectedShifts: string[]
  selectedPickerIds: string[]
  setSelectedWarehouses: (values: string[]) => void
  setSelectedShifts: (values: string[]) => void
  setSelectedPickerIds: (values: string[]) => void
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
  kpis: WarehouseOperationsFilterResponse['kpis'] | null
  charts: WarehouseOperationsChartResponse | null
  clusters: WarehouseOperationsClusterResponse | null
  pickTimeMl: WarehouseOperationsMlResponse | null
  delayMl: WarehouseOperationsMlResponse | null
  productivityMl: WarehouseOperationsMlResponse | null
  insights: WarehouseOperationsInsightsResponse | null
  onDownloadFiltered: () => void
  onDownloadInsights: () => void
  onDownloadMl: (label: string, rows: WarehouseOperationsRow[]) => void
  onDownloadClusters: () => void
}) {
  const filteredPreview = filteredRows.slice(0, 10)

  // Determine whether to display the rest of the workflow
  const showWorkflow = data.length > 0

  return (
    <div className="space-y-6">
      <SectionTitle title="Application" />

      {/* STEP 1: LOAD DATASET (Always Visible) */}
      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <SectionTitle title="STEP 1 — LOAD DATASET" />
        <div className="grid gap-3 md:grid-cols-3">
          {(['default', 'upload', 'mapping'] as WarehouseOperationsMode[]).map((item) => (
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
                  setData([])
                  setFilteredRows([])
                  setPreviewRows([])
                  setKpis(null)
                  setCharts(null)
                  setClusters(null)
                  setPickTimeMl(null)
                  setDelayMl(null)
                  setProductivityMl(null)
                  setInsights(null)
                  setUploadFile(null)
                  setMappingFile(null)
                  setAvailableColumns([])
                  if (item === 'default') {
                    void loadDefaultData()
                  }
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
                  <p className="text-sm font-semibold text-[#0F172A]">Step 1: Upload CSV File</p>
                  <p className="mt-1 text-[13px] text-[#475569]">Upload your warehouse dataset CSV.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A]"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </button>
              </div>

              <label className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center hover:bg-slate-50 transition">
                <CloudUpload className="h-7 w-7 text-[#0F766E]" />
                <span className="mt-3 text-[15px] font-semibold text-[#0F172A]">Drag &amp; Drop CSV</span>
                <span className="mt-1 text-[13px] text-[#64748B]">or Browse Files to upload</span>
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
              {showWorkflow && (
                <p className="mt-3 text-[14px] font-semibold text-[#0F766E]">Dataset uploaded. ({data.length} rows loaded)</p>
              )}
            </div>
          ) : null}

          {mode === 'default' ? (
            <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Default Data Flow</p>
                  <p className="mt-1 text-[13px] text-[#475569]">Loaded from standard supply chain dataset repositories.</p>
                </div>
                <button
                  type="button"
                  onClick={onDefaultData}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D5F58] transition"
                >
                  <MapPin className="h-4 w-4" />
                  Download Default Dataset
                </button>
              </div>
              <p className="mt-3 text-[14px] font-semibold text-[#0F766E]">{loadStatus}</p>
              {showWorkflow && (
                <div className="mt-4 overflow-hidden rounded-[22px] border border-[#E2E8F0]">
                  <Table title="Dataset preview table (Horizontal Scroll)" rows={previewRows.slice(0, 10)} columns={PREVIEW_COLUMNS} />
                </div>
              )}
            </div>
          ) : null}

          {mode === 'mapping' ? (
            <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <p className="text-sm font-semibold text-[#0F172A]">Step 1: Load Dataset</p>
              <p className="mt-1 text-[13px] text-[#475569]">Upload CSV to map columns to required fields.</p>
              <label className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center hover:bg-slate-50 transition">
                <Upload className="h-5 w-5 text-[#0F766E]" />
                <span className="mt-3 text-[15px] font-semibold text-[#0F172A]">{mappingFile ? mappingFile.name : 'Drag &amp; Drop CSV'}</span>
                <span className="mt-1 text-[13px] text-[#64748B]">or Browse Files</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0] ?? null
                    setMappingFile(file)
                    if (file) void onUploadMapping(file)
                  }}
                />
              </label>

              {availableColumns.length ? (
                <div className="mt-5 space-y-4">
                  <h4 className="text-[14px] font-bold text-[#0F172A] uppercase tracking-wider">Map Columns to Required Schema</h4>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {MAPPING_FIELDS.map((field) => (
                      <label key={field} className="rounded-[18px] border border-[#E2E8F0] bg-white p-4 text-sm font-semibold text-[#0F172A] block">
                        <span className="mb-2 block">{field}</span>
                        <select
                          value={mappingColumns[field] || ''}
                          onChange={(event) => setMappingColumns({ ...mappingColumns, [field]: event.target.value })}
                          className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] font-medium"
                        >
                          <option value="">-- Skip / Select column --</option>
                          {availableColumns.map((column) => (
                            <option key={column} value={column}>{column}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-start">
                    <button
                      type="button"
                      onClick={onApplyMapping}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0D5F58] transition"
                    >
                      Apply Mapping
                    </button>
                  </div>
                </div>
              ) : null}
              {showWorkflow && (
                <p className="mt-3 text-[14px] font-semibold text-[#0F766E]">Dataset mapped and loaded. ({data.length} rows loaded)</p>
              )}
            </div>
          ) : null}
        </div>
      </div>



      {/* REST OF WORKFLOW (Only appears when dataset loaded / showWorkflow is true) */}
      {showWorkflow ? (
        <>
          {/* STEP 2: FILTERS & PREVIEW */}
          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <SectionTitle title="STEP 2 — FILTERS & PREVIEW" />
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <MultiSelect label="Warehouse" options={warehouses} values={selectedWarehouses} onChange={setSelectedWarehouses} />
              <MultiSelect label="Shift" options={shifts} values={selectedShifts} onChange={setSelectedShifts} />
              <MultiSelect label="Picker ID" options={pickerIds} values={selectedPickerIds} onChange={setSelectedPickerIds} />

              <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Order Date Filter</p>
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

            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-lg font-bold text-[#0F172A]">Filtered Data Preview (first 10 rows)</h3>
              <button
                type="button"
                onClick={onDownloadFiltered}
                className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition"
              >
                <Download className="h-4 w-4" />
                Download Filtered Data
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-[#E2E8F0]">
              <Table title="" rows={filteredPreview} columns={PREVIEW_COLUMNS} />
            </div>
          </div>

          {/* STEP 3: KPIs */}
          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0F172A]">Dynamic KPIs</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label="Orders" value={formatMetric(kpis?.total_orders, 0)} />
              <SummaryCard label="Avg Pick Time" value={`${formatMetric(kpis?.avg_pick_time_sec, 1)}s`} />
              <SummaryCard label="Avg Travel Time" value={`${formatMetric(kpis?.avg_travel_time_sec, 1)}s`} />
              <SummaryCard label="Avg Heatmap Level" value={formatMetric(kpis?.avg_heatmap_level, 2)} />
              <SummaryCard label="Avg Productivity" value={`${formatMetric(kpis?.avg_productivity, 1)} items/hr`} />
            </div>
          </div>

          {/* STEP 4: EXPLORATORY DATA ANALYSIS */}
          <div className="space-y-6 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <SectionTitle title="EXPLORATORY DATA ANALYSIS" subtitle="Plotly dynamic charts mapping the warehouse operations dataset." />
            <div className="grid grid-cols-1 gap-6">
              <PickQtyDistribution data={charts?.pick_qty_distribution ?? []} />
              <TravelDistanceOverTime data={charts?.travel_distance_over_time ?? []} />
              <ZoneHeatmapActivity data={charts?.zone_heatmap_activity ?? []} />
              <SlottingScoreSkuClass data={charts?.slotting_score_by_sku_class ?? []} />
              <DelayReasonsDistribution data={charts?.delay_reasons ?? []} />
              <TravelTimeVsDistance data={charts?.travel_time_vs_distance ?? []} />
              <EquipmentUsage data={charts?.equipment_usage ?? []} />
              <PickerProductivityDistribution data={charts?.picker_productivity_distribution ?? []} />
              <CongestionFactorWarehouse data={charts?.congestion_by_warehouse ?? []} />
              <SkuWeightDistribution data={charts?.sku_weight_distribution ?? []} />
              <PickPackTime data={charts?.pick_vs_pack_time ?? []} />
              <HeatmapLevelOverTime data={charts?.heatmap_over_time ?? []} />
              <AisleCongestion data={filteredRows.length ? filteredRows : previewRows} />
              <ProductivityShift data={charts?.productivity_by_shift ?? []} />
              <DelayDurationDistribution data={charts?.delay_duration_distribution ?? []} />
            </div>
          </div>

          {/* STEP 5: MACHINE LEARNING MODELS */}
          <div className="space-y-6 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <SectionTitle
              title="MACHINE LEARNING MODELS"
              subtitle="Predictive and clustering workflows running Random Forests, Gradient Boosters, and KMeans."
            />
            
            {/* Pick Time Regressor */}
            <ModelCard
              title="1. Predict Pick Time (RandomForestRegressor)"
              metrics={pickTimeMl}
              rows={pickTimeMl?.predictions ?? []}
              downloadLabel="Download Pick Time Predictions"
              onDownload={() => onDownloadMl('pick_time_predictions.csv', pickTimeMl?.predictions ?? [])}
            />

            {/* Clustering */}
            <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-[#0F172A]">2. Congestion Pattern Clustering (KMeans Cluster)</h4>
                  <p className="text-sm text-[#475569]">Groups warehouse picks by Heatmap, Congestion, and Pick Quantity.</p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadClusters}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] shadow-sm hover:bg-slate-50 transition"
                >
                  <Download className="h-4 w-4" />
                  Download Cluster Distribution
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white">
                  <Table
                    title="Cluster Distribution Table"
                    rows={clusters?.cluster_counts ?? []}
                    columns={['Cluster', 'Count']}
                  />
                </div>
                <ClusterScatter data={clusters?.scatter_data ?? []} />
              </div>
            </div>

            {/* Delay Predictor */}
            <ModelCard
              title="3. Predict Delay Minutes (GradientBoostingRegressor)"
              metrics={delayMl}
              rows={delayMl?.predictions ?? []}
              downloadLabel="Download Delay Predictions"
              onDownload={() => onDownloadMl('delay_predictions.csv', delayMl?.predictions ?? [])}
            />

            {/* Picker Productivity Predictor */}
            <ModelCard
              title="4. Predict Picker Productivity (RandomForestRegressor)"
              metrics={productivityMl}
              rows={productivityMl?.predictions ?? []}
              downloadLabel="Download Productivity Predictions"
              onDownload={() => onDownloadMl('picker_productivity_predictions.csv', productivityMl?.predictions ?? [])}
            />
          </div>

          {/* STEP 6: AUTOMATED INSIGHTS */}
          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <SectionTitle title="AUTOMATED INSIGHTS" />
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-sm text-[#475569]">Insights generated dynamically based on highest congestion, slow equipment, productivity, and delay reasons.</p>
              <button
                type="button"
                onClick={onDownloadInsights}
                className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition"
              >
                <Download className="h-4 w-4" />
                Download Automated Insights
              </button>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-[#E2E8F0]">
              <Table title="Automated Insights Table" rows={insights?.insights ?? []} columns={['Insight', 'Value', 'Detail']} />
            </div>
          </div>
        </>
      ) : null}

      {/* LOAD STATUS FOOTER */}
      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A]">System load status</h3>
        <p className="mt-3 text-[15px] text-[#475569]">{loading ? 'Refreshing analysis...' : loadStatus}</p>
        {error ? <p className="mt-2 text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
        <p className="mt-4 text-sm text-[#64748B]">Loaded dataset rows count: {data.length}</p>
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
  const placeholder = `Choose one or more ${label.toLowerCase()}s`

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
                className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-sm font-semibold text-[#B91C1C] hover:bg-[#FCA5A5] transition"
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
      <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
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
              values.includes(option) ? 'bg-[#0F766E] text-white font-semibold' : 'bg-white text-[#0F172A] hover:bg-[#E2E8F0]'
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
  metrics: WarehouseOperationsMlResponse | null
  rows: WarehouseOperationsRow[]
  downloadLabel: string
  onDownload: () => void
}) {
  return (
    <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-[#0F172A]">{title}</h4>
          <div className="mt-2 flex gap-4 text-sm font-medium text-[#475569]">
            <span>RMSE: {formatMetric(metrics?.rmse, 3)}</span>
            <span>R²: {formatMetric(metrics?.r2, 3)}</span>
            <span>Train size: {metrics?.train_size ?? '--'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] shadow-sm hover:bg-slate-50 transition"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white">
        <Table title="Actual vs Predicted Results (Preview)" rows={rows} emptyText="Model predictions will appear when the dataset is loaded." />
      </div>
    </div>
  )
}

function ActionPlaybooksTab({
  playbooks,
  onDownloadPlaybook,
}: {
  playbooks: WarehouseOperationsRow[]
  onDownloadPlaybook: () => void
}) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Action Playbooks" />

      <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">Action Recommendations</h3>
            <p className="text-sm text-[#475569] mt-1">Recommended layout and operational playbook based on warehouse parameters.</p>
          </div>
          <button
            type="button"
            onClick={onDownloadPlaybook}
            className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4" />
            Download Playbooks
          </button>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-[#E2E8F0]">
          <Table title="Playbooks Table" rows={playbooks} columns={['Action', 'Rationale']} />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_100%)] p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#0F172A]">Executive Recommendations</h3>
        <div className="mt-4 space-y-2 text-[15px] leading-7 text-[#334155]">
          <p>• Prioritise slotting optimisation for Class A SKUs to reduce avg travel distance.</p>
          <p>• Reroute or stagger picks in high-congestion aisles to flatline heatmap spikes.</p>
          <p>• Schedule AMRs / Forklifts for heavier SKU weights to reduce picker fatigue and travel duration.</p>
          <p>• Target bottom quartile pickers for training on standard SOP workflows.</p>
          <p>• Conduct root-cause kaizen events on the highest frequency delay categories.</p>
        </div>
      </div>
    </div>
  )
}

export function WarehouseOperationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [mode, setMode] = useState<WarehouseOperationsMode>('default')
  const [data, setData] = useState<WarehouseOperationsRow[]>([])
  const [filteredRows, setFilteredRows] = useState<WarehouseOperationsRow[]>([])
  const [previewRows, setPreviewRows] = useState<WarehouseOperationsRow[]>([])
  
  const [warehouses, setWarehouses] = useState<string[]>([])
  const [shifts, setShifts] = useState<string[]>([])
  const [pickerIds, setPickerIds] = useState<string[]>([])
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([])
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedPickerIds, setSelectedPickerIds] = useState<string[]>([])
  
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [loadStatus, setLoadStatus] = useState('Default dataset not loaded yet.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [mappingFile, setMappingFile] = useState<File | null>(null)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [mappingColumns, setMappingColumns] = useState<Record<string, string>>(DEFAULT_FIELD_MAP)
  
  const [kpis, setKpis] = useState<WarehouseOperationsFilterResponse['kpis'] | null>(null)
  const [charts, setCharts] = useState<WarehouseOperationsChartResponse | null>(null)
  const [clusters, setClusters] = useState<WarehouseOperationsClusterResponse | null>(null)
  const [pickTimeMl, setPickTimeMl] = useState<WarehouseOperationsMlResponse | null>(null)
  const [delayMl, setDelayMl] = useState<WarehouseOperationsMlResponse | null>(null)
  const [productivityMl, setProductivityMl] = useState<WarehouseOperationsMlResponse | null>(null)
  const [insights, setInsights] = useState<WarehouseOperationsInsightsResponse | null>(null)
  const [playbooks, setPlaybooks] = useState<WarehouseOperationsRow[]>(PLAYBOOKS)

  async function loadDefaultData() {
    setLoading(true)
    setError(null)
    try {
      const response: WarehouseOperationsDatasetResponse = await loadDefaultDataset()
      const rows = response.data ?? []
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setWarehouses(response.warehouses ?? [])
      setShifts(response.shifts ?? [])
      setPickerIds(response.picker_ids ?? [])
      setSelectedWarehouses([])
      setSelectedShifts([])
      setSelectedPickerIds([])
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
      setWarehouses(response.warehouses ?? [])
      setShifts(response.shifts ?? [])
      setMode('upload')
      setPickerIds(response.picker_ids || Array.from(new Set(rows.map((r) => r.Picker_ID).filter(Boolean))).slice(0, 50) as string[])
      setSelectedWarehouses([])
      setSelectedShifts([])
      setSelectedPickerIds([])
      setDateStart(response.date_min?.slice(0, 10) ?? '')
      setDateEnd(response.date_max?.slice(0, 10) ?? '')
      setLoadStatus('Dataset uploaded successfully.')
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
      setData(rows)
      setPreviewRows(response.preview ?? rows.slice(0, 10))
      setWarehouses(response.warehouses ?? [])
      setShifts(response.shifts ?? [])
      setPickerIds(response.picker_ids || Array.from(new Set(rows.map((r) => r.Picker_ID).filter(Boolean))).slice(0, 50) as string[])
      setMode('mapping')
      setSelectedWarehouses([])
      setSelectedShifts([])
      setSelectedPickerIds([])
      setLoadStatus('Dataset mapped and loaded.')
      await applyCurrentFilters(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mapping failed.')
    } finally {
      setLoading(false)
    }
  }

  async function applyCurrentFilters(rows: WarehouseOperationsRow[]) {
    if (!rows.length) {
      setFilteredRows([])
      setKpis(null)
      setCharts(null)
      setClusters(null)
      setPickTimeMl(null)
      setDelayMl(null)
      setProductivityMl(null)
      setInsights(null)
      return
    }

    try {
      const filterResponse = await filterData({
        data: rows,
        warehouses: selectedWarehouses.length ? selectedWarehouses : undefined,
        shifts: selectedShifts.length ? selectedShifts : undefined,
        picker_ids: selectedPickerIds.length ? selectedPickerIds : undefined,
        date_start: dateStart || undefined,
        date_end: dateEnd || undefined,
      })
      const selectedRows = filterResponse.data ?? rows
      setFilteredRows(selectedRows)
      setKpis(filterResponse.kpis)

      // Fetch downstream analytics
      const [chartsResponse, clustersResponse, ptMlResponse, dlMlResponse, prodMlResponse, insightsResponse] = await Promise.all([
        getChartData(selectedRows).catch(() => null),
        getClusters(selectedRows).catch(() => null),
        runPickTimePredictor(selectedRows).catch(() => null),
        runDelayPredictor(selectedRows).catch(() => null),
        runProductivityPredictor(selectedRows).catch(() => null),
        getInsights(selectedRows).catch(() => null),
      ])

      setCharts(chartsResponse)
      setClusters(clustersResponse)
      setPickTimeMl(ptMlResponse)
      setDelayMl(dlMlResponse)
      setProductivityMl(prodMlResponse)
      setInsights(insightsResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter application failed.')
      setFilteredRows(rows)
    }
  }

  async function handleDownloadFiltered() {
    try {
      const blob = await downloadFilteredCsv(filteredRows.length ? filteredRows : data)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'filtered_warehouse_operations_data.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      // Fallback
      downloadRowsAsCsv('filtered_warehouse_operations_data.csv', filteredRows.length ? filteredRows : data)
    }
  }

  // Load playbooks and default data initially
  useEffect(() => {
    void loadDefaultData()
    void getPlaybooks().then((res) => {
      if (res.playbooks) {
        setPlaybooks(res.playbooks)
      }
    }).catch(() => {})
  }, [])

  // Auto trigger filter refresh when filtering inputs change
  useEffect(() => {
    if (!data.length) return
    const timer = window.setTimeout(() => {
      void applyCurrentFilters(data)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [data, selectedWarehouses, selectedShifts, selectedPickerIds, dateStart, dateEnd])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6">
      <div className="mx-auto max-w-[95%] xl:max-w-[1550px] space-y-6">
        <Header />

        {/* TAB CONTROLS */}
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

        {/* TAB CONTENTS */}
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
            warehouses={warehouses}
            shifts={shifts}
            pickerIds={pickerIds}
            selectedWarehouses={selectedWarehouses}
            selectedShifts={selectedShifts}
            selectedPickerIds={selectedPickerIds}
            setSelectedWarehouses={setSelectedWarehouses}
            setSelectedShifts={setSelectedShifts}
            setSelectedPickerIds={setSelectedPickerIds}
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
            pickTimeMl={pickTimeMl}
            delayMl={delayMl}
            productivityMl={productivityMl}
            insights={insights}
            onDownloadFiltered={handleDownloadFiltered}
            onDownloadInsights={() => downloadRowsAsCsv('warehouse_operations_insights.csv', insights?.insights ?? [])}
            onDownloadMl={(name, rows) => downloadRowsAsCsv(name, rows)}
            onDownloadClusters={() => downloadRowsAsCsv('congestion_clusters.csv', clusters?.cluster_counts ?? [])}
          />
        ) : (
          <ActionPlaybooksTab
            playbooks={playbooks}
            onDownloadPlaybook={() => downloadRowsAsCsv('warehouse_playbooks.csv', playbooks)}
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

export default WarehouseOperationsPage
