const API_BASE_URL =
  import.meta.env.VITE_IDP_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8006'

export interface IdpProcessResult {
  file_name: string
  document_type?: string
  signature_present?: boolean
  extracted_data?: Record<string, any>
  signature_image?: string | null
  raw_text?: string
  error?: string | null
}

export interface IdpProcessResponse {
  total_files: number
  successful: number
  failed: number
  results: IdpProcessResult[]
}

export async function processFiles(files: File[]): Promise<IdpProcessResponse> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch(`${API_BASE_URL}/process`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail || error?.message || 'Failed to process documents')
  }

  return response.json()
}

export async function runDemo(): Promise<IdpProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/demo`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail || error?.message || 'Failed to run demo')
  }

  return response.json()
}
