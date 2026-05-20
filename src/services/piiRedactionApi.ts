const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface PiiRedactionResult {
  file_name: string
  redacted_text?: string
  detected_pii?: string[]
  pii_count?: number
  pii_types?: string[]
  error?: string | null
}

export interface PiiRedactionResponse {
  total_files: number
  successful: number
  failed: number
  results: PiiRedactionResult[]
}

export async function redactFiles(files: File[]): Promise<PiiRedactionResponse> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch(`${API_BASE_URL}/redact`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail || error?.message || 'Failed to redact files')
  }

  return response.json()
}

export async function runDemo(): Promise<PiiRedactionResponse> {
  const response = await fetch(`${API_BASE_URL}/demo`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail || error?.message || 'Failed to run demo')
  }

  return response.json()
}
