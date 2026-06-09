import { type ChangeEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight,
  CloudUpload,
  FileText,
  ShieldCheck,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react'
import { runDemo, redactFiles, type PiiRedactionResponse, type PiiRedactionResult } from '@/services/piiRedactionApi'

type Tab = 'overview' | 'application'

type InputMode = 'upload' | 'demo'

const overviewPurpose =
  'Automatically detect and redact Personally Identifiable Information (PII) from enterprise documents using GPT-4o vision and structured AI pipelines — preserving document structure while ensuring full data privacy compliance across PDF, Word, Excel, image, and text file formats.'

const overviewCapabilities = [
  'Supports PDF, DOCX, XLSX, TXT, and image files (JPG, PNG, TIFF, GIF).',
  'Multimodal AI — uses GPT-4o vision to process scanned documents and images.',
  'Detects Names, Dates, ID Numbers, Addresses, Emails, Phone Numbers, and Financial Info.',
  'Structured output via Pydantic — returns redacted text and full PII entity log.',
  'Batch processing — upload and redact multiple files in one run.',
  'Built-in demo mode with internal sample documents for quick evaluation.',
]

const overviewImpact = [
  'Accelerate GDPR, HIPAA, and data privacy compliance across document workflows.',
  'Eliminate manual redaction effort — process hundreds of documents in minutes.',
  'Reduce risk of accidental PII exposure in shared reports and datasets.',
  'Audit-ready PII detection logs for regulatory reporting and traceability.',
  'Scalable to enterprise document volumes with batch upload support.',
]

function OverviewTab() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-6">
        <div className="aa-card p-6">
          <p className="text-[11px] font-bold text-[#0284C7] uppercase tracking-[0.18em] mb-3">
            Purpose
          </p>
          <p className="text-[15px] text-[#334155] leading-relaxed">{overviewPurpose}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aa-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#0284C7]" />
              <h3 className="text-lg font-bold text-[#0F172A]">Capabilities</h3>
            </div>
            <ul className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
              {overviewCapabilities.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-[#0F766E] shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="aa-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
              <h3 className="text-lg font-bold text-[#0F172A]">Business Impact</h3>
            </div>
            <ul className="space-y-3 text-[14px] text-[#334155] leading-relaxed">
              {overviewImpact.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-[#0284C7] shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplicationTab() {
  const [mode, setMode] = useState<InputMode>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [isRunningDemo, setIsRunningDemo] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<PiiRedactionResult[]>([])
  const [summary, setSummary] = useState<PiiRedactionResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const fileCount = files.length
  const fileSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  )

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    setFiles((current) => [...current, ...selected].slice(0, 6))
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, idx) => idx !== index))
  }

  async function handleStart() {
    if (mode === 'upload' && fileCount === 0) return

    setErrorMessage(null)
    setIsProcessing(true)
    setResults([])
    setSummary(null)
    setExpandedIndex(null)

    try {
      const response = await redactFiles(files)
      setSummary(response)
      setResults(response.results)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to redact files.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRunDemo() {
    setErrorMessage(null)
    setIsRunningDemo(true)
    setIsProcessing(true)
    setResults([])
    setSummary(null)
    setExpandedIndex(null)

    try {
      const response = await runDemo()
      setSummary(response)
      setResults(response.results)
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to run demo.')
    } finally {
      setIsProcessing(false)
      setIsRunningDemo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="aa-card p-6">
        <p className="text-sm font-semibold text-[#475569] mb-3">Select Input Mode:</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex items-center gap-3 rounded-2xl border border-[#CBD5E1] px-4 py-3 w-full sm:w-auto cursor-pointer transition hover:border-[#94A3B8]">
            <input
              type="radio"
              name="pii-input-mode"
              value="upload"
              className="accent-[#0F766E]"
              checked={mode === 'upload'}
              onChange={() => setMode('upload')}
            />
            <span className="text-sm font-semibold text-[#1E293B]">Upload Your Documents</span>
          </label>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-[#CBD5E1] px-4 py-3 w-full sm:w-auto cursor-pointer transition hover:border-[#94A3B8]">
            <input
              type="radio"
              name="pii-input-mode"
              value="demo"
              className="accent-[#0F766E]"
              checked={mode === 'demo'}
              onChange={() => setMode('demo')}
            />
            <span className="text-sm font-semibold text-[#1E293B]">Run Demo (Uses Internal Samples)</span>
          </label>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="aa-card p-6 bg-[#F8FAFC]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#0F172A]">Upload single files or select a batch of files (PDF, Image, MS Office, TXT):</p>
              <p className="text-sm text-[#64748B] mt-1">Limit 200MB per file • PDF, JPG, JPEG, PNG, GIF, TIFF, DOCX, XLSX, XLS, TXT, TIF</p>
            </div>
            <label className="aa-button aa-button-secondary px-4 py-3 cursor-pointer hover:border-[#94A3B8]">
              Browse files
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-[#64748B]">
            <CloudUpload className="mx-auto mb-4 h-10 w-10 text-[#0F766E]" />
            <p className="font-semibold text-[#1E293B]">Drag and drop files here</p>
            <p className="text-sm mt-2">Upload or browse to add documents for redaction.</p>
          </div>

          {fileCount > 0 && (
            <div className="mt-6 rounded-2xl border border-[#CBD5E1] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-[#0F172A]">Selected files ({fileCount})</span>
                <span className="text-sm text-[#64748B]">{(fileSize / 1024 / 1024).toFixed(1)} MB total</span>
              </div>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#0F766E]" />
                      <div>
                        <p className="font-semibold text-[#0F172A]">{file.name}</p>
                        <p className="text-sm text-[#64748B]">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="rounded-full p-2 text-[#7C8187] hover:bg-[#E2E8F0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={fileCount === 0 || isProcessing}
              className="aa-button aa-button-primary px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                'Start Redaction'
              )}
            </button>
            <p className="text-sm text-[#475569]">Please upload documents to start processing.</p>
          </div>
        </div>
      ) : (
        <div className="aa-card p-6 bg-[#F8FAFC]">
          <p className="text-[16px] font-medium text-[#475569] mb-5">
            Run a demo using internal sample documents for quick evaluation.
          </p>
          <button
            type="button"
            onClick={handleRunDemo}
            disabled={isProcessing}
            className="aa-button aa-button-primary px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Running Demo...
              </>
            ) : (
              'Run Demo on Internal Samples'
            )}
          </button>
          {isRunningDemo && (
            <p className="mt-4 rounded-2xl border border-[#D1FAE5] bg-[#ECFDF5] p-4 text-sm text-[#166534]">
              Demo run started. The internal sample documents are being analysed for PII redaction.
            </p>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
          {errorMessage}
        </div>
      )}

      {summary && (
        <div className="aa-card border-[#A7F3D0] bg-[#ECFDF5] p-4 text-sm text-[#166534]">
          <div className="font-semibold mb-1">Processing summary</div>
          <div className="flex flex-wrap gap-4">
            <span>Total files: {summary.total_files}</span>
            <span>Successful: {summary.successful}</span>
            <span>Failed: {summary.failed}</span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0F766E]" /> Processing Results
          </div>
          {results.map((result, index) => (
            <div key={`${result.file_name}-${index}`} className="aa-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedIndex((prev) => (prev === index ? null : index))}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">Analyzing {result.file_name}</div>
                  <div className="text-sm text-[#64748B]">{result.error ? 'Failed' : 'Completed'}</div>
                </div>
                <span className="text-[#0F766E] font-semibold">{expandedIndex === index ? 'Hide' : 'View'}</span>
              </button>
              {expandedIndex === index && (
                <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4">
                  {result.error ? (
                    <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
                      {result.error}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-[#475569]">
                        <div>
                          <div className="font-semibold text-[#0F172A]">Detected PII</div>
                          <div>{result.detected_pii?.join(', ') || 'None'}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F172A]">PII Count</div>
                          <div>{result.pii_count ?? 0}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F172A]">PII Types</div>
                          <div>{result.pii_types?.join(', ') || 'None'}</div>
                        </div>
                      </div>
                      <div className="aa-surface-muted p-4 whitespace-pre-wrap text-sm text-[#334155]">
                        {result.redacted_text || 'No redacted text available.'}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PiiRedactionProjectPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F8FBFF_100%)] p-6 max-w-6xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 text-[14px] font-bold text-[#0284C7] hover:underline"
      >
        ← Back
      </button>

      <div className="mb-10">
        <div className="flex flex-col gap-4">
          <div className="aa-card inline-flex items-center gap-3 px-4 py-3">
            <span className="text-4xl">🤖</span>
            <h1 className="text-[2.25rem] font-bold text-[#0F172A] leading-tight">
              Automated PII Redaction Solution (Gen AI)
            </h1>
          </div>
          <p className="text-[#64748B] text-[15px] max-w-3xl">
            Redact Personal Identifiable Information from Documents using Generative AI
          </p>
        </div>
      </div>

      <div className="mb-8 border-b border-[#E2E8F0]">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`aa-button px-5 py-3 text-[15px] ${
              activeTab === 'overview'
                ? 'aa-button-primary'
                : 'aa-button-secondary'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('application')}
            className={`aa-button px-5 py-3 text-[15px] ${
              activeTab === 'application'
                ? 'aa-button-primary'
                : 'aa-button-secondary'
            }`}
          >
            Application
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? <OverviewTab /> : <ApplicationTab />}
    </div>
  )
}
