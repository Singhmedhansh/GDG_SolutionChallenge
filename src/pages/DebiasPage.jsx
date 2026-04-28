import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { Upload, Settings2, SlidersHorizontal, ArrowRight, CheckCircle2, Download, Info, Copy } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ReactDropzone from 'react-dropzone'
import { useResults } from '../context/ResultsContext'
import { debiasModel } from '../services/api'

// tokens
const bg = '#f8fafc'
const card = '#ffffff'
const border = '#e2e8f0'
const blueBorder = '#bfdbfe'
const textHead = '#0f172a'
const textBody = '#334155'
const textMuted = '#64748b'
const blue = '#2563eb'
const amber = '#b45309'
const amberBg = '#fffbeb'
const amberBorder = '#fcd34d'
const fontInter = `'Inter', sans-serif`
const fontMono = `'IBM Plex Mono', monospace`

const FAIRNESS_METRIC_OPTIONS = [
  { value: 'demographic_parity', label: 'Demographic Parity (ThresholdOptimizer)' },
  { value: 'equalized_odds', label: 'Equalized Odds (ThresholdOptimizer)' },
  { value: 'fairness_penalty', label: 'Fairness Penalty (sample reweighting)' },
]

export default function DebiasPage() {
  const navigate = useNavigate()
  const {
    results,
    datasetFile: contextDatasetFile,
    setDebiasedResults,
  } = useResults() || {}

  const [step, setStep] = useState(1)

  // Files
  const [modelFile, setModelFile] = useState(null)
  const [datasetFile, setDatasetFile] = useState(null)
  const [datasetColumns, setDatasetColumns] = useState([])
  const [prefilledFromAnalysis, setPrefilledFromAnalysis] = useState(false)

  // Config
  const defaultAttribute = results?.protectedAttributes?.[0]?.attribute ?? ''
  const [protectedAttribute, setProtectedAttribute] = useState(defaultAttribute)
  const [targetColumn, setTargetColumn] = useState(results?.decisionColumn ?? '')
  const [fairnessMetric, setFairnessMetric] = useState('demographic_parity')
  const [penaltyWeight, setPenaltyWeight] = useState(0.5)

  // API
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)

  const parseCsvHeader = (file) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta?.fields?.filter(Boolean) ?? []
        setDatasetColumns(cols)
      },
      error: () => setDatasetColumns([]),
    })
  }

  // Prefill dataset from ResultsContext (set by AnalysisPage after a scan)
  useEffect(() => {
    if (!contextDatasetFile || datasetFile) return
    setDatasetFile(contextDatasetFile)
    parseCsvHeader(contextDatasetFile)
    setPrefilledFromAnalysis(true)
  }, [contextDatasetFile, datasetFile])

  const handleDropModel = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setModelFile(file)
  }

  const handleDropDataset = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setDatasetFile(file)
    setTargetColumn('')
    parseCsvHeader(file)
  }

  const targetOptions = useMemo(() => datasetColumns, [datasetColumns])

  const canRun = modelFile && datasetFile && targetColumn && protectedAttribute && fairnessMetric

  const handleDebias = async () => {
    if (!canRun) {
      toast.error('Please complete all required fields, including the target column.')
      return
    }

    setIsProcessing(true)
    try {
      const data = await debiasModel({
        modelFile,
        datasetFile,
        targetColumn,
        protectedAttributes: [protectedAttribute],
        fairnessMetric,
        penaltyWeight,
      })
      setResult(data)
      setDebiasedResults?.({
        original_fairness_score: data.original_fairness_score,
        debiased_fairness_score: data.debiased_fairness_score,
        improvement_percent: data.improvement_percent,
        explanation: data.explanation,
        inference_instructions: data.inference_instructions,
        protectedAttribute,
        targetColumn,
        fairnessMetric,
        completedAt: new Date().toISOString(),
      })
      setStep(3)
      toast.success('Debiasing complete!')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to debias. Is the backend running with fairlearn installed?')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadModel = () => {
    if (!result?.debiased_model) {
      toast.error('No model to download.')
      return
    }
    const link = document.createElement('a')
    link.href = 'data:application/octet-stream;base64,' + result.debiased_model
    link.download = `debiased_model_${fairnessMetric}.pkl`
    link.click()
  }

  const copyInstructions = () => {
    if (!result?.inference_instructions) return
    navigator.clipboard.writeText(result.inference_instructions)
    toast.success('Inference instructions copied.')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: bg, color: textHead, fontFamily: fontInter, padding: '40px 24px' }}>
      <Toaster position="bottom-center" />
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px' }}>
            Debiasing Engine
          </h1>
          <p style={{ margin: 0, color: textMuted, fontSize: '1.05rem', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Upload your scikit-learn model and let our engine automatically enforce fairness constraints using fairlearn.
          </p>
        </div>

        {/* Wizard Steps indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <StepIcon active={step >= 1} done={step > 1} number={1} label="Upload" />
             <div style={{ width: 40, height: 2, background: step > 1 ? blue : border }} />
             <StepIcon active={step >= 2} done={step > 2} number={2} label="Configure" />
             <div style={{ width: 40, height: 2, background: step > 2 ? blue : border }} />
             <StepIcon active={step === 3} done={step > 3} number={3} label="Results" />
          </div>
        </div>

        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <AnimatePresence mode="wait">

            {/* STEP 1: Upload */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={20} color={blue} /> Upload Artifacts
                </h2>

                {prefilledFromAnalysis && (
                  <div style={{
                    background: '#eff6ff', border: `1px solid ${blueBorder}`,
                    borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: fontMono, fontSize: '0.72rem', color: blue, fontWeight: 600,
                  }}>
                    <CheckCircle2 size={14} />
                    Dataset pre-loaded from analysis — just drop in your model.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <ReactDropzone onDrop={handleDropModel} accept={{ 'application/octet-stream': ['.pkl'] }}>
                    {({getRootProps, getInputProps, isDragActive}) => (
                      <div {...getRootProps()} style={dropzoneStyle(isDragActive, modelFile)}>
                        <input {...getInputProps()} />
                        <Settings2 size={32} color={modelFile ? '#10b981' : '#94a3b8'} style={{ marginBottom: 12 }} />
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {modelFile ? modelFile.name : '1. Upload Model'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: textMuted }}>
                          Drag & drop your .pkl model
                        </div>
                      </div>
                    )}
                  </ReactDropzone>

                  <ReactDropzone onDrop={handleDropDataset} accept={{ 'text/csv': ['.csv'] }}>
                    {({getRootProps, getInputProps, isDragActive}) => (
                      <div {...getRootProps()} style={dropzoneStyle(isDragActive, datasetFile)}>
                        <input {...getInputProps()} />
                        <Upload size={32} color={datasetFile ? '#10b981' : '#94a3b8'} style={{ marginBottom: 12 }} />
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {datasetFile ? datasetFile.name : '2. Upload Dataset'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: textMuted }}>
                          CSV matching your training data
                        </div>
                      </div>
                    )}
                  </ReactDropzone>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                  <button
                    disabled={!modelFile || !datasetFile}
                    onClick={() => setStep(2)}
                    style={primaryBtnStyle(!modelFile || !datasetFile)}
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Configure */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                 <h2 style={{ fontSize: '1.25rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SlidersHorizontal size={20} color={blue} /> Configure Fairness Constraints
                </h2>

                <div style={{ display: 'grid', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Target / Label Column</label>
                    <p style={helperStyle}>
                      The column the model predicts (e.g. <code>hired</code>, <code>approved</code>). The backend used to silently assume this was the last column — now you pick it explicitly.
                    </p>
                    {targetOptions.length > 0 ? (
                      <select
                        value={targetColumn}
                        onChange={e => setTargetColumn(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select target column…</option>
                        {targetOptions.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={targetColumn}
                        onChange={e => setTargetColumn(e.target.value)}
                        style={inputStyle}
                        placeholder="e.g. hired"
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Protected Attribute Column</label>
                    {targetOptions.length > 0 ? (
                      <select
                        value={protectedAttribute}
                        onChange={e => setProtectedAttribute(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select protected attribute…</option>
                        {targetOptions
                          .filter(c => c !== targetColumn)
                          .map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={protectedAttribute}
                        onChange={e => setProtectedAttribute(e.target.value)}
                        style={inputStyle}
                        placeholder="e.g. gender"
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Fairness Metric</label>
                    <select
                      value={fairnessMetric}
                      onChange={e => setFairnessMetric(e.target.value)}
                      style={inputStyle}
                    >
                      {FAIRNESS_METRIC_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {fairnessMetric === 'fairness_penalty' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={labelStyle}>Penalty Weight ({penaltyWeight.toFixed(2)})</label>
                      <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={penaltyWeight}
                        onChange={e => setPenaltyWeight(parseFloat(e.target.value))}
                      />
                    </div>
                  )}

                  <div style={{
                    fontSize: '0.85rem', color: textMuted, lineHeight: 1.6,
                    background: '#f8fafc', border: `1px solid ${border}`,
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    {fairnessMetric === 'fairness_penalty'
                      ? 'Sample-reweighting retrains a copy of your model. The output is a normal scikit-learn estimator — call .predict(X) as usual.'
                      : 'ThresholdOptimizer wraps your model. The output requires the sensitive attribute at inference time — instructions will be shown after the run.'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                  <button onClick={() => setStep(1)} style={secondaryBtnStyle}>Back</button>
                  <button
                    onClick={handleDebias}
                    disabled={isProcessing || !canRun}
                    style={primaryBtnStyle(isProcessing || !canRun)}
                  >
                    {isProcessing ? 'Running…' : 'Run Debiasing'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Results */}
            {step === 3 && result && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', color: '#10b981', marginBottom: 16 }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: 8, color: textHead }}>Debiasing Complete</h2>
                  <p style={{ color: textMuted, maxWidth: 560, margin: '0 auto' }}>
                    {result.explanation}
                  </p>
                </div>

                {/* Inference Instructions — critical to show prominently */}
                <div style={{
                  background: amberBg,
                  border: `1px solid ${amberBorder}`,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <Info size={22} color={amber} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: fontMono, fontSize: '0.7rem', letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: amber, fontWeight: 700, marginBottom: 8,
                    }}>
                      ⚠ Inference Instructions — Read Before Deploying
                    </div>
                    <div style={{
                      fontFamily: fontInter, fontSize: '0.92rem', color: textHead,
                      lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {result.inference_instructions}
                    </div>
                    <button
                      onClick={copyInstructions}
                      style={{
                        marginTop: 12,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px',
                        background: '#ffffff', color: amber,
                        border: `1px solid ${amberBorder}`, borderRadius: 6,
                        fontFamily: fontMono, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 16, marginBottom: 24,
                }}>
                  <ScoreCard label="Original" value={`${result.original_fairness_score}/100`} tone="slate" />
                  <ScoreCard label="Debiased" value={`${result.debiased_fairness_score}/100`} tone="green" />
                  <ScoreCard label="Improvement" value={`${result.improvement_percent}%`} tone="blue" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <button onClick={downloadModel} style={primaryBtnStyle(false)}>
                    <Download size={16} /> Download Debiased Model (.pkl)
                  </button>
                  <button
                    onClick={() => { setStep(1); setResult(null); setModelFile(null); setDatasetFile(null); setDatasetColumns([]); setTargetColumn(''); }}
                    style={secondaryBtnStyle}
                  >
                    Start Over
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ label, value, tone }) {
  const accent = {
    slate: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
    blue:  { bg: '#eff6ff', border: blueBorder, text: blue },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#059669' },
  }[tone]
  return (
    <div style={{
      background: accent.bg, border: `1px solid ${accent.border}`,
      borderRadius: 12, padding: 20, textAlign: 'center',
    }}>
      <div style={{
        fontFamily: fontMono, fontSize: '0.66rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', color: accent.text, fontWeight: 700, marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: fontMono, fontSize: '1.5rem', fontWeight: 700, color: accent.text }}>
        {value}
      </div>
    </div>
  )
}

function StepIcon({ active, done, number, label }) {
  let bgc = card, c = textMuted, b = border
  if (active) { bgc = '#eff6ff'; c = blue; b = blue }
  if (done) { bgc = blue; c = '#fff'; b = blue }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: bgc, color: c, border: `2px solid ${b}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, transition: 'all 0.3s' }}>
        {done ? <CheckCircle2 size={20} /> : number}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: active ? 600 : 400, color: active ? textHead : textMuted }}>
        {label}
      </div>
    </div>
  )
}

const dropzoneStyle = (isActive, hasFile) => ({
  border: `2px dashed ${hasFile ? '#10b981' : (isActive ? blue : border)}`,
  background: hasFile ? '#f0fdf4' : (isActive ? '#f8fafc' : card),
  borderRadius: 12,
  padding: '40px 20px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
})

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: textHead
}

const helperStyle = {
  margin: 0,
  fontSize: '0.8rem',
  color: textMuted,
  lineHeight: 1.5,
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 8,
  border: `1px solid ${border}`,
  fontSize: '0.95rem',
  fontFamily: fontInter,
  color: textBody,
  outline: 'none',
  background: '#f8fafc'
}

const primaryBtnStyle = (disabled) => ({
  padding: '12px 24px',
  background: blue,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  opacity: disabled ? 0.6 : 1,
  transition: 'opacity 0.2s',
  fontFamily: fontInter
})

const secondaryBtnStyle = {
  padding: '12px 24px',
  background: 'transparent',
  color: textBody,
  border: `1px solid ${border}`,
  borderRadius: 8,
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
  fontFamily: fontInter
}
