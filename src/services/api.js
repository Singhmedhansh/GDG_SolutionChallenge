export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')

/**
 * Send CSV data to the FastAPI backend for bias analysis via multipart upload.
 *
 * @param {File} file - The CSV file object
 * @param {string} decisionColumn - The column containing hiring outcome
 * @param {string[]} protectedAttributes - List of protected attribute column names
 * @returns {Promise<object>} - The bias analysis result from the backend
 */
export async function analyzeDataset(file, decisionColumn, protectedAttributes) {
  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('decisionColumn', decisionColumn)
  formData.append('protectedAttributes', JSON.stringify(protectedAttributes ?? []))
  formData.append('fileName', file.name)

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
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

/**
 * Submit a model + dataset to the debiasing endpoint via multipart upload.
 *
 * @param {object} params
 * @param {File} params.modelFile - Pickled scikit-learn model (.pkl)
 * @param {File} params.datasetFile - CSV dataset
 * @param {string} params.targetColumn - Name of the label/target column
 * @param {string[]} params.protectedAttributes - Protected attribute column names
 * @param {string} params.fairnessMetric - "demographic_parity" | "equalized_odds" | "fairness_penalty"
 * @param {number} [params.penaltyWeight=0.5]
 * @returns {Promise<object>} - DebiasResponse including inference_instructions
 */
export async function debiasModel({
  modelFile,
  datasetFile,
  targetColumn,
  protectedAttributes,
  fairnessMetric,
  penaltyWeight = 0.5,
}) {
  const formData = new FormData()
  formData.append('model_file', modelFile, modelFile.name)
  formData.append('dataset_file', datasetFile, datasetFile.name)
  formData.append('target_column', targetColumn)
  formData.append('protected_attributes', JSON.stringify(protectedAttributes ?? []))
  formData.append('fairness_metric', fairnessMetric)
  formData.append('penalty_weight', String(penaltyWeight))

  const response = await fetch(`${API_BASE}/api/debias-model`, {
    method: 'POST',
    body: formData,
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
