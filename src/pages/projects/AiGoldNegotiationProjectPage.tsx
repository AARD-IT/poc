import { useState, type ChangeEvent } from 'react'
import { ArrowRight, CloudUpload, FileText, Zap, ShieldCheck } from 'lucide-react'

const capabilities = [
  'Automatically parse buyer RFQs from TXT, DOCX, and PDF files using AI document extraction.',
  'Match extracted line items to a gold product catalogue using ChromaDB vector search.',
  'Fetch live MCX gold price in INR/gram and combine it with purchase cost, making, wastage, packaging, and hallmark charges.',
  'Calculate transparent quotes using a 7-step pricing formula with guaranteed 30% pre-GST margin.',
  'Generate professional branded quote PDFs and auto-draft buyer emails for rapid commercial response.',
]

const businessImpact = [
  'Avoid underpricing with every quote locked at 30% pre-GST margin and a 20% negotiation floor.',
  'Move from RFQ to quote in seconds with AI-powered product matching, live pricing, and PDF generation.',
  'Support multi-round negotiation workflows with ACCEPT / COUNTER / REJECT decision logic.',
  'Improve buyer confidence through a transparent pricing equation and detailed invoice breakdown.',
  'Reduce manual quote creation overhead and accelerate deal closure with auto-generated email drafts.',
]

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#F59E0B] mb-3">Purpose</p>
          <p className="text-[15px] text-[#334155] leading-relaxed">
            Analytics Avenue receives gold RFQs from buyers, reads the request, matches products, fetches live MCX gold price, calculates a compliant quote with a 30% pre-GST margin, generates a branded PDF, sends the quote email, and manages buyer negotiations with a 20% minimum margin floor.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Capabilities</h3>
          </div>
          <ul className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
            {capabilities.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-[#0F766E] shrink-0 mt-1" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Business Impact</h3>
          </div>
          <ul className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
            {businessImpact.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-[#F59E0B] shrink-0 mt-1" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F172A] mb-4">Pricing Equation</h3>
          <div className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
            <p>From CSV: C = PurchaseCost / g | M = Making / g | W = Wastage % | P = Packaging | H = Hallmark</p>
            <p>From Live: L = MCX Gold Price (INR / gram)</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>BaseCost/g = C + M + (C × W%)</li>
              <li>UnitRawCost = (BaseCost × Weight) + P + H</li>
              <li>MarketFactor = max(L / C, 1.0)</li>
              <li>AdjustedCost = UnitRawCost × MarketFactor</li>
              <li>SellingPrice = AdjustedCost ÷ 0.70 ← 30% margin</li>
              <li>CGST = SellingPrice × 1.5% | SGST = SellingPrice × 1.5%</li>
              <li>InvoicePrice = SellingPrice + CGST + SGST</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Negotiation Logic</h3>
        <div className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
          <p>Quote at 30% margin. Floor = 20% margin. Floor price is calculated as AdjustedCost ÷ 0.80 per item.</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>ACCEPT</strong> — Buyer price is greater than or equal to our quote.</li>
            <li><strong>COUNTER</strong> — Buyer price is between the 20% floor and our quote; midpoint is offered.</li>
            <li><strong>REJECT</strong> — Buyer price is below the 20% floor.</li>
          </ul>
          <p>All math is handled in Python, while the LLM generates only the buyer-facing email content.</p>
        </div>
      </div>
    </div>
  )
}

function ApplicationTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setShowSummary(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#F59E0B] mb-3">Upload Buyer RFQ</p>
            <p className="text-[15px] text-[#334155] leading-relaxed mb-5">
              Upload the buyer's request for quotation as TXT, DOCX, or PDF to begin automated parsing, product matching, and pricing.
            </p>
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#CBD5E1] bg-white px-5 py-4 text-sm font-semibold text-[#334155] hover:border-[#94A3B8]">
                <span className="flex items-center gap-3">
                  <CloudUpload className="w-5 h-5 text-[#0F766E]" />
                  {selectedFile ? selectedFile.name : 'Choose file'}
                </span>
                <input type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileChange} />
              </label>
              <p className="mt-3 text-sm text-[#64748B]">200MB per file • TXT, DOCX, PDF</p>
            </div>

            <button
              type="button"
              onClick={() => setShowSummary(true)}
              disabled={!selectedFile}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-white font-semibold transition hover:bg-[#0D5F58] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
              Run AI Pipeline
            </button>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#FEF3C7] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#92400E] mb-4">What happens when you click Run?</h3>
            <ol className="space-y-3 text-[14px] text-[#92400E] leading-relaxed list-decimal list-inside">
              <li>File read — buyer info extracted.</li>
              <li>Groq LLaMA classifies and extracts items.</li>
              <li>Products matched from gold catalogue.</li>
              <li>Live MCX price fetched and quote calculated.</li>
              <li>Review pricing — Generate PDF — Send Email.</li>
            </ol>
          </div>
        </div>
      </div>

      {showSummary && selectedFile && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <p className="text-sm font-semibold text-[#0F766E] mb-3">Live Pricing Results</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
                    <p className="text-[13px] text-[#64748B]">LIVE GOLD 24K / GRAM</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F172A]">Rs. 13,999.77</p>
                  </div>
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
                    <p className="text-[13px] text-[#64748B]">USD / INR</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F172A]">96.81</p>
                  </div>
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center">
                    <p className="text-[13px] text-[#64748B]">PRICE SOURCE</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F766E]">LIVE</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#0F766E]" />
                    <p className="font-semibold text-[#0F172A]">Parsed RFQ</p>
                  </div>
                  <p className="text-sm text-[#475569]">{selectedFile.name} was analysed and line items were matched to the gold catalogue. Continue to quote generation and email drafting.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#475569] mb-3">Suggested next actions</p>
              <div className="space-y-3">
                <button className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-left text-[#0F172A] font-semibold">Generate Quote PDF</button>
                <button className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-left text-[#0F172A] font-semibold">Prepare Quote Email</button>
                <button className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-left text-[#0F172A] font-semibold">Review Negotiation Status</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm">
        <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#0F766E] mb-4">Sample file for testing</p>
        <div className="rounded-2xl border border-[#CBD5E1] bg-white px-5 py-4 text-sm text-[#0F172A]">
          input_folder/sample_rfq.txt
        </div>
      </div>
    </div>
  )
}

export function AiGoldNegotiationProjectPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'application'>('overview')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F59E0B] mb-4">AI Gold Negotiation Orchestrator</p>
            <h1 className="text-4xl font-bold text-[#0F172A] mb-4">Enterprise RFQ-to-Quote pricing and negotiation automation for gold buyers.</h1>
            <p className="text-[15px] text-[#475569] leading-relaxed">
              A complete workflow for reading buyer RFQs, matching gold products, pricing using live MCX data, generating branded quote PDFs, drafting buyer emails, and managing multi-round negotiations with acceptance, counteroffer, or reject logic.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('application')}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'application'
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              Application
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? <OverviewTab /> : <ApplicationTab />}
    </div>
  )
}
