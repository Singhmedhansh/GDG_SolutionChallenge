export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')

/**
 * Send CSV data to the FastAPI backend for bias analysis.
 *
 * @param {File} file - The CSV file object
 * @param {string} decisionColumn - The column containing hiring outcome
 * @param {string[]} protectedAttributes - List of protected attribute column names
 * @returns {Promise<object>} - The bias analysis result from the backend
 */
export async function analyzeDataset(file, decisionColumn, protectedAttributes) {
  // Read file as base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Strip the data URL prefix (e.g. "data:text/csv;base64,")
      const dataUrl = reader.result
      const base64String = dataUrl.split(',')[1]
      resolve(base64String)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      csvData: base64,
      decisionColumn,
      protectedAttributes,
    }),
  })

  if (!response.ok) {
    let errorMessage = `Backend error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage)
  }

  return response.json()
}
