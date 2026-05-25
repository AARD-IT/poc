import { useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, CloudUpload, FileText, Download, ListChecks, Sparkles, ShieldCheck } from 'lucide-react'
import { analyzeFile, runDemo, downloadCsv, type AnalysisResult, type SentimentAnalyzerResponse } from '../../services/sentimentAnalyzerApi'

const capabilities = [
  'Classifies sentiment as Positive, Negative, or Neutral for each review.',
  'Identifies dominant tone across 10 categories including Joyful, Angry, Formal, and Urgent.',
  'Provides a 2-sentence AI explanation referencing specific phrases from the text.',
  'Batch processing with live progress bar and per-item timing metrics.',
  'Supports Excel file upload or built-in demo mode with sample data.',
  'Exports full analysis report as a downloadable CSV.',
]

const businessImpact = [
  'Reduce manual feedback review time from hours to minutes.',
  'Identify angry or abusive feedback instantly for priority escalation.',
  'Track sentiment trends across products, regions, or time periods.',
  'Improve customer experience strategy with data-driven tone insights.',
  'Scalable to thousands of reviews with consistent, unbiased AI classification.',
]

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Overview</h2>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#0284C7] mb-3">Purpose</p>
        <p className="text-[15px] text-[#334155] leading-relaxed">
          Automatically analyze customer feedback at scale by classifying sentiment and tone using Gemini 2.5 Pro — enabling teams to understand customer emotions, prioritize responses, and surface actionable insights from large volumes of review text without manual effort.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#0284C7]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Capabilities</h3>
          </div>
          <ul className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
            {capabilities.map((capability, index) => (
              <li key={index} className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-[#0F766E] shrink-0 mt-1" />
                {capability}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Business Impact</h3>
          </div>
          <ul className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
            {businessImpact.map((impact, index) => (
              <li key={index} className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-[#7C3AED] shrink-0 mt-1" />
                {impact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ApplicationTab() {
  const [inputMode, setInputMode] = useState<'upload' | 'demo'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileLoaded, setFileLoaded] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult[] | null>(null)
  const [apiResponse, setApiResponse] = useState<SentimentAnalyzerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => {
    if (!apiResponse) return null
    return {
      total: apiResponse.total_items,
      averageTime: apiResponse.avg_time_per_item,
      positive: apiResponse.sentiment_counts.Positive,
      negative: apiResponse.sentiment_counts.Negative,
      neutral: apiResponse.sentiment_counts.Neutral,
    }
  }, [apiResponse])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setFileLoaded(!!file)
    setResults(null)
    setApiResponse(null)
    setProgress(0)
    setError(null)
  }

  async function handleStartAnalysis() {
    if (!selectedFile && inputMode === 'upload') return

    setIsAnalyzing(true)
    setResults(null)
    setApiResponse(null)
    setProgress(0)
    setError(null)

    // Simulate progress while calling backend
    let currentProgress = 0
    const progressInterval = window.setInterval(() => {
      currentProgress += Math.random() * 30
      setProgress(Math.min(currentProgress, 90))
    }, 200)

    try {
      let response: SentimentAnalyzerResponse
      if (selectedFile) {
        response = await analyzeFile(selectedFile)
      } else {
        response = await runDemo(10)
      }

      setProgress(100)
      setApiResponse(response)
      setResults(response.results)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMsg)
    } finally {
      window.clearInterval(progressInterval)
      setIsAnalyzing(false)
    }
  }

  async function handleLoadDemo() {
    setInputMode('demo')
    setSelectedFile(null)
    setFileLoaded(false)
    setError(null)

    setIsAnalyzing(true)
    setResults(null)
    setApiResponse(null)
    setProgress(0)

    try {
      const response = await runDemo(10)
      setProgress(100)
      setApiResponse(response)
      setResults(response.results)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Demo failed'
      setError(errorMsg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleDownloadCsv() {
    if (!results) return
    try {
      await downloadCsv(results)
    } catch (err) {
      let errorMsg = 'Failed to download CSV report'
      if (err instanceof Error) {
        errorMsg = err.message
      } else if (err && typeof err === 'object') {
        errorMsg = String(err)
      }
      setError(errorMsg)
    }
  }


  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#7C3AED] mb-3">Select Input Mode</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="inline-flex items-center gap-3 rounded-xl border border-[#CBD5E1] px-4 py-3 cursor-pointer">
                <input
                  type="radio"
                  name="sentiment-input-mode"
                  value="upload"
                  checked={inputMode === 'upload'}
                  onChange={() => setInputMode('upload')}
                  className="accent-[#7C3AED]"
                />
                <span className="text-sm font-semibold text-[#0F172A]">Upload Your File</span>
              </label>
              <label className="inline-flex items-center gap-3 rounded-xl border border-[#CBD5E1] px-4 py-3 cursor-pointer">
                <input
                  type="radio"
                  name="sentiment-input-mode"
                  value="demo"
                  checked={inputMode === 'demo'}
                  onChange={() => setInputMode('demo')}
                  className="accent-[#7C3AED]"
                />
                <span className="text-sm font-semibold text-[#0F172A]">Run Demo (Sample Data)</span>
              </label>
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-sm font-semibold text-[#475569] mb-2">Supported input</p>
            <p className="text-[14px] text-[#334155]">Upload an Excel (.xlsx) file or use the built-in demo sample for quick validation.</p>
          </div>
        </div>
      </div>

      {inputMode === 'upload' ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Upload an Excel (.xlsx) file:</p>
              <p className="text-sm text-[#64748B]">Limit 200MB per file • XLSX</p>
            </div>
            <label className="inline-flex items-center gap-3 rounded-full border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] cursor-pointer hover:border-[#94A3B8]">
              <CloudUpload className="w-5 h-5 text-[#7C3AED]" />
              Browse files
              <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {selectedFile && (
            <div className="mt-5 rounded-xl bg-white border border-[#CBD5E1] p-4 text-sm text-[#0F172A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#0F766E]" />
                  <div>
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-[#64748B]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={!fileLoaded || isAnalyzing}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-white font-semibold transition hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-4 h-4" />
            Start Analysis
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#0F172A] mb-4">Demo mode</p>
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-white font-semibold transition hover:bg-[#6D28D9]"
          >
            <ListChecks className="w-4 h-4" />
            Load Demo Sample (First 10 Rows)
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#DC2626] bg-[#FEE2E2] p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#991B1B]">Error</p>
          <p className="mt-2 text-sm text-[#7F1D1D]">{error}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#0F172A] mb-4">Calling LLM for sentiment and tone analysis…</p>
          <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
            <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-[#475569]">Progress: {Math.round(progress)}%</p>
        </div>
      )}

      {results && summary && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Analysis Summary</p>
                <h2 className="text-2xl font-bold text-[#0F172A]">Overall Categorization</h2>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#E2E8F0]"
              >
                <Download className="w-4 h-4" />
                Download Full Analysis Report (CSV)
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
                <p className="text-[#64748B]">Total Items Analyzed</p>
                <p className="mt-2 text-xl font-semibold text-[#0F172A]">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
                <p className="text-[#64748B]">Average Time per Item</p>
                <p className="mt-2 text-xl font-semibold text-[#0F172A]">{summary.averageTime.toFixed(2)}s</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
                <p className="text-[#64748B]">Positive</p>
                <p className="mt-2 text-xl font-semibold text-[#0F172A]">{summary.positive}</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
                <p className="text-[#64748B]">Negative</p>
                <p className="mt-2 text-xl font-semibold text-[#0F172A]">{summary.negative}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-5">Detailed Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-[#475569]">Review</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[#475569]">Sentiment</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[#475569]">Tone</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[#475569]">Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => (
                    <tr key={index} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <td className="px-4 py-4 text-sm text-[#334155]">{row.original_text}</td>
                      <td className="px-4 py-4 text-sm text-[#334155]">{row.sentiment}</td>
                      <td className="px-4 py-4 text-sm text-[#334155]">{row.tone}</td>
                      <td className="px-4 py-4 text-sm text-[#334155]">{row.analysis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SentimentAnalyzerProjectPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'application'>('overview')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#0F172A]"
        >
          ← Back
        </button>
      </div>
      <div className="mb-8 rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#7C3AED] mb-4">AI Customer Feedback Analyzer</p>
            <h1 className="text-4xl font-bold text-[#0F172A] mb-4">Sentiment and Tone Categorization using Large Language Models</h1>
            <p className="text-[15px] text-[#475569] leading-relaxed">
              Analyze customer feedback at scale with sentiment classification, tone detection, batch processing, and downloadable results — all wrapped in a polished AI-powered workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-[#7C3AED] text-white'
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
                  ? 'bg-[#7C3AED] text-white'
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
