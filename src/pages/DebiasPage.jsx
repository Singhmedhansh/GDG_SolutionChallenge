import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Settings2, SlidersHorizontal, ArrowRight, CheckCircle2, Download, BarChart2, GitCompareArrows } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ReactDropzone from 'react-dropzone'
import { useResults } from '../context/ResultsContext'

// tokens
const bg = '#f8fafc'
const card = '#ffffff'
const border = '#e2e8f0'
const blueBorder = '#bfdbfe'
const textHead = '#0f172a'
const textBody = '#334155'
const textMuted = '#64748b'
const blue = '#2563eb'
const fontInter = `'Inter', sans-serif`
const fontMono = `'IBM Plex Mono', monospace`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function DebiasPage() {
  const navigate = useNavigate()
  const {
    results,
    datasetFile: contextDatasetFile,
    setDebiasedResults,
  } = useResults() || {}

  const [step, setStep] = useState(1)

  // Form State
  const [modelFile, setModelFile] = useState(null)
  const [modelBase64, setModelBase64] = useState('')
  const [datasetFile, setDatasetFile] = useState(null)
  const [datasetBase64, setDatasetBase64] = useState('')
  const [prefilledFromAnalysis, setPrefilledFromAnalysis] = useState(false)
  const defaultAttribute = results?.protectedAttributes?.[0]?.attribute ?? 'gender'
  const [protectedAttribute, setProtectedAttribute] = useState(defaultAttribute)

  // API State
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)

  // Prefill dataset from ResultsContext (set by AnalysisPage after a scan)
  useEffect(() => {
    if (!contextDatasetFile || datasetFile) return
    let cancelled = false
    fileToBase64(contextDatasetFile).then((b64) => {
      if (cancelled) return
      setDatasetFile(contextDatasetFile)
      setDatasetBase64(b64)
      setPrefilledFromAnalysis(true)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [contextDatasetFile, datasetFile])

  const handleDropModel = (acceptedFiles) => {
    const file = acceptedFiles[0]
    setModelFile(file)
    const reader = new FileReader()
    reader.onload = () => setModelBase64(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  }

  const handleDropDataset = (acceptedFiles) => {
    const file = acceptedFiles[0]
    setDatasetFile(file)
    const reader = new FileReader()
    reader.onload = () => setDatasetBase64(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  }

  const handleDebias = async () => {
    if (!modelBase64 || !datasetBase64 || !protectedAttribute) {
      toast.error('Please complete all required fields.')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('http://localhost:8000/api/debias-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_file: modelBase64,
          dataset_csv: datasetBase64,
          protected_attributes: [protectedAttribute],
        })
      })

      if (!response.ok) throw new Error('API error')

      const data = await response.json()
      setResult(data)
      const chosen = data.demographic_parity ?? data.equalized_odds ?? {}
      setDebiasedResults?.({
        original_fairness_score: data.original_fairness_score ?? data.raw_model?.fairness_score,
        debiased_fairness_score: chosen.fairness_score,
        improvement_percent: chosen.fairness_score != null && data.raw_model?.fairness_score != null
          ? Math.max(0, chosen.fairness_score - data.raw_model.fairness_score)
          : 0,
        explanation: data.explanation,
        protectedAttribute,
        fairnessMetric: 'demographic_parity',
        methods: {
          raw_model: data.raw_model,
          demographic_parity: data.demographic_parity,
          equalized_odds: data.equalized_odds,
        },
        completedAt: new Date().toISOString(),
      })
      setStep(3) // Result step
      toast.success('Debiasing comparison complete!')
    } catch (err) {
      console.error(err)
      toast.error("Failed to debias. Is your Python backend running with fairlearn installed?")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadMethodModel = (methodKey, label) => {
    const b64 = result?.[methodKey]?.debiased_model
    if (!b64) {
      toast.error('No model to download for this method.')
      return
    }
    const link = document.createElement("a");
    link.href = "data:application/octet-stream;base64," + b64;
    link.download = `debiased_model_${label}.pkl`;
    link.click();
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
                    <label style={labelStyle}>Protected Attribute Column (e.g. gender, age)</label>
                    <input 
                      type="text" 
                      value={protectedAttribute}
                      onChange={e => setProtectedAttribute(e.target.value)}
                      style={inputStyle}
                      placeholder="e.g. gender"
                    />
                  </div>

                  <div style={{
                    fontSize: '0.85rem', color: textMuted, lineHeight: 1.6,
                    background: '#f8fafc', border: `1px solid ${border}`,
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    We'll run <strong style={{ color: textHead }}>Raw</strong>, <strong style={{ color: textHead }}>Demographic Parity</strong>, and <strong style={{ color: textHead }}>Equalized Odds</strong> in one pass so you can compare accuracy vs fairness tradeoffs side by side.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                  <button onClick={() => setStep(1)} style={secondaryBtnStyle}>Back</button>
                  <button
                    onClick={handleDebias}
                    disabled={isProcessing || !protectedAttribute}
                    style={primaryBtnStyle(isProcessing || !protectedAttribute)}
                  >
                    {isProcessing ? 'Running all three methods...' : 'Run Comparison'}
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
                  <h2 style={{ fontSize: '1.5rem', marginBottom: 8, color: textHead }}>Method Comparison</h2>
                  <p style={{ color: textMuted, maxWidth: 560, margin: '0 auto' }}>
                    We ran your model through both fairness constraints at once. Compare accuracy vs DPD to pick the tradeoff that fits.
                  </p>
                </div>

                <MethodComparison result={result} onDownload={downloadMethodModel} />

                {results && (
                  <div style={{ marginBottom: 24 }}>
                    <button
                      onClick={() => navigate('/report/comparison')}
                      style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: '0 10px 24px rgba(37, 99, 235, 0.28)',
                        fontFamily: fontInter,
                      }}
                    >
                      <GitCompareArrows size={20} />
                      See Before / After Comparison
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button onClick={() => {setStep(1); setResult(null); setModelFile(null); setDatasetFile(null);}} style={secondaryBtnStyle}>
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

function formatPct(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${(v * 100).toFixed(1)}%`
}

function formatDpd(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return Number(v).toFixed(2)
}

function MethodColumn({ title, tone, metrics, tradeoff, onDownload, downloadLabel }) {
  const accent = {
    slate: { bar: '#64748b', bg: '#f8fafc', badgeBg: '#e2e8f0', badgeText: '#475569', border: '#e2e8f0' },
    blue:  { bar: blue,      bg: '#eff6ff', badgeBg: '#dbeafe', badgeText: blue,      border: blueBorder },
    green: { bar: '#10b981', bg: '#f0fdf4', badgeBg: '#d1fae5', badgeText: '#059669', border: '#bbf7d0' },
  }[tone]

  return (
    <div style={{
      background: accent.bg,
      border: `1px solid ${accent.border}`,
      borderRadius: 12,
      padding: 20,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: fontMono, fontSize: '0.66rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: accent.badgeText, fontWeight: 700,
        }}>
          {title}
        </div>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: accent.bar,
        }} />
      </div>

      <MetricRow label="Accuracy" value={formatPct(metrics?.accuracy)} color={accent.bar} />
      <MetricRow label="DPD" value={formatDpd(metrics?.dpd)} color={accent.bar} />
      <MetricRow label="Fairness Score" value={metrics?.fairness_score != null ? `${metrics.fairness_score}/100` : '—'} color={accent.bar} big />

      <p style={{
        margin: 0, fontSize: '0.82rem', color: textBody, lineHeight: 1.55, minHeight: 54,
      }}>
        {tradeoff ?? metrics?.tradeoff ?? ''}
      </p>

      {onDownload ? (
        <button onClick={onDownload} style={{
          marginTop: 'auto',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 14px',
          background: '#ffffff', color: accent.badgeText,
          border: `1px solid ${accent.border}`, borderRadius: 8,
          fontFamily: fontInter, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
        }}>
          <Download size={14} /> {downloadLabel}
        </button>
      ) : (
        <div style={{
          marginTop: 'auto',
          textAlign: 'center', fontFamily: fontMono, fontSize: '0.7rem',
          color: textMuted, padding: '10px 14px',
        }}>
          baseline — no model to download
        </div>
      )}
    </div>
  )
}

function MetricRow({ label, value, color, big }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
      paddingBottom: 8,
      borderBottom: `1px solid rgba(15, 23, 42, 0.06)`,
    }}>
      <span style={{ fontFamily: fontMono, fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{
        fontFamily: fontMono,
        fontSize: big ? '1.1rem' : '0.95rem',
        fontWeight: 700,
        color,
      }}>
        {value}
      </span>
    </div>
  )
}

function MethodComparison({ result, onDownload }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 16,
      marginBottom: 28,
    }}>
      <MethodColumn
        title="Raw Model"
        tone="slate"
        metrics={result.raw_model}
        tradeoff={result.raw_model?.tradeoff}
      />
      <MethodColumn
        title="Demographic Parity"
        tone="blue"
        metrics={result.demographic_parity}
        tradeoff={result.demographic_parity?.tradeoff}
        onDownload={() => onDownload('demographic_parity', 'demographic_parity')}
        downloadLabel="Download .pkl"
      />
      <MethodColumn
        title="Equalized Odds"
        tone="green"
        metrics={result.equalized_odds}
        tradeoff={result.equalized_odds?.tradeoff}
        onDownload={() => onDownload('equalized_odds', 'equalized_odds')}
        downloadLabel="Download .pkl"
      />
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
