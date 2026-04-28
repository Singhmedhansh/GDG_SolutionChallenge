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

const COMPARISON_METHODS = [
  { key: 'demographic_parity', label: 'Demographic Parity', tone: 'blue' },
  { key: 'equalized_odds',     label: 'Equalized Odds',     tone: 'green' },
  { key: 'fairness_penalty',   label: 'Fairness Penalty',   tone: 'violet' },
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
  const [penaltyWeight, setPenaltyWeight] = useState(0.5)

  // API
  const [isProcessing, setIsProcessing] = useState(false)
  const [methodStatus, setMethodStatus] = useState({}) // { demographic_parity: 'running' | 'done' | 'error' }
  const [comparison, setComparison] = useState(null)   // { demographic_parity: {...response...}, equalized_odds: {...}, fairness_penalty: {...} }

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

  const canRun = modelFile && datasetFile && targetColumn && protectedAttribute

  const runComparison = async () => {
    if (!canRun) {
      toast.error('Please complete all required fields, including the target column.')
      return
    }

    setIsProcessing(true)
    setComparison(null)
    const initialStatus = {}
    COMPARISON_METHODS.forEach((m) => { initialStatus[m.key] = 'running' })
    setMethodStatus(initialStatus)

    // Fan out: call /api/debias-model once per metric in parallel
    const calls = COMPARISON_METHODS.map(async (method) => {
      try {
        const data = await debiasModel({
          modelFile,
          datasetFile,
          targetColumn,
          protectedAttributes: [protectedAttribute],
          fairnessMetric: method.key,
          penaltyWeight,
        })
        setMethodStatus((prev) => ({ ...prev, [method.key]: 'done' }))
        return [method.key, data]
      } catch (err) {
        console.error(`${method.key} failed:`, err)
        setMethodStatus((prev) => ({ ...prev, [method.key]: 'error' }))
        return [method.key, { __error: err.message || 'Failed' }]
      }
    })

    const settled = await Promise.all(calls)
    const merged = Object.fromEntries(settled)
    setComparison(merged)

    const ok = Object.values(merged).filter((v) => !v.__error)
    if (ok.length === 0) {
      toast.error('All three methods failed. Is the backend running with fairlearn installed?')
    } else {
      toast.success(`Comparison complete (${ok.length}/${COMPARISON_METHODS.length} methods succeeded).`)
      // Persist the best (highest debiased score) result to context for the report page
      const best = ok.reduce((acc, r) => (r.debiased_fairness_score > (acc?.debiased_fairness_score ?? -1) ? r : acc), null)
      if (best) {
        setDebiasedResults?.({
          original_fairness_score: best.original_fairness_score,
          debiased_fairness_score: best.debiased_fairness_score,
          improvement_percent: best.improvement_percent,
          explanation: best.explanation,
          inference_instructions: best.inference_instructions,
          protectedAttribute,
          targetColumn,
          comparison: merged,
          completedAt: new Date().toISOString(),
        })
      }
      setStep(3)
    }

    setIsProcessing(false)
  }

  const downloadModel = (methodKey) => {
    const b64 = comparison?.[methodKey]?.debiased_model
    if (!b64) {
      toast.error('No model to download for this method.')
      return
    }
    const link = document.createElement('a')
    link.href = 'data:application/octet-stream;base64,' + b64
    link.download = `debiased_model_${methodKey}.pkl`
    link.click()
  }

  const copyInstructions = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Inference instructions copied.')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: bg, color: textHead, fontFamily: fontInter, padding: '40px 24px' }}>
      <Toaster position="bottom-center" />
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px' }}>
            Debiasing Engine
          </h1>
          <p style={{ margin: 0, color: textMuted, fontSize: '1.05rem', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            We run your model through three fairness strategies in one pass — Demographic Parity, Equalized Odds, and Fairness Penalty — so you can compare tradeoffs side by side.
          </p>
        </div>

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
                    <label style={labelStyle}>Fairness Penalty Weight ({penaltyWeight.toFixed(2)})</label>
                    <p style={helperStyle}>
                      Only used by the third method (sample-reweighting retraining). 0 = no penalty, 1 = full penalty.
                    </p>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={penaltyWeight}
                      onChange={e => setPenaltyWeight(parseFloat(e.target.value))}
                    />
                  </div>

                  <div style={{
                    fontSize: '0.85rem', color: textMuted, lineHeight: 1.6,
                    background: '#f8fafc', border: `1px solid ${border}`,
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    We&rsquo;ll run <strong style={{ color: textHead }}>Demographic Parity</strong>, <strong style={{ color: textHead }}>Equalized Odds</strong>, and <strong style={{ color: textHead }}>Fairness Penalty</strong> in parallel against the same target column. The first two wrap your model in a Fairlearn ThresholdOptimizer (requires <code>sensitive_features</code> at predict time); the third returns a normal scikit-learn estimator.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                  <button onClick={() => setStep(1)} style={secondaryBtnStyle}>Back</button>
                  <button
                    onClick={runComparison}
                    disabled={isProcessing || !canRun}
                    style={primaryBtnStyle(isProcessing || !canRun)}
                  >
                    {isProcessing ? 'Running all three methods…' : 'Run Comparison'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Results */}
            {step === 3 && comparison && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', color: '#10b981', marginBottom: 16 }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: 8, color: textHead }}>Method Comparison</h2>
                  <p style={{ color: textMuted, maxWidth: 620, margin: '0 auto' }}>
                    Three fairness strategies run against the same model + target column. Compare fairness lift vs. the inference contract each one demands.
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 16, marginBottom: 24,
                }}>
                  {COMPARISON_METHODS.map((m) => (
                    <MethodColumn
                      key={m.key}
                      method={m}
                      data={comparison[m.key]}
                      status={methodStatus[m.key]}
                      onDownload={() => downloadModel(m.key)}
                      onCopyInstructions={() => copyInstructions(comparison[m.key]?.inference_instructions)}
                    />
                  ))}
                </div>

                <div style={{
                  background: amberBg,
                  border: `1px solid ${amberBorder}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <Info size={18} color={amber} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.85rem', color: textHead, lineHeight: 1.55 }}>
                    <strong>Heads up:</strong> the two ThresholdOptimizer models (Demographic Parity, Equalized Odds) require you to pass the protected attribute via <code>sensitive_features</code> when calling <code>.predict()</code> in production. Each card&rsquo;s <em>inference instructions</em> button copies the exact snippet for that model.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setStep(1); setComparison(null); setMethodStatus({}); setModelFile(null); setDatasetFile(null); setDatasetColumns([]); setTargetColumn(''); }}
                    style={secondaryBtnStyle}
                  >
                    Start Over
                  </button>
                  {results && (
                    <button onClick={() => navigate('/report')} style={primaryBtnStyle(false)}>
                      Back to Report <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function MethodColumn({ method, data, status, onDownload, onCopyInstructions }) {
  const accent = {
    blue:   { bar: blue,      bg: '#eff6ff', badgeBg: '#dbeafe', badgeText: blue,      border: blueBorder },
    green:  { bar: '#10b981', bg: '#f0fdf4', badgeBg: '#d1fae5', badgeText: '#059669', border: '#bbf7d0' },
    violet: { bar: '#7c3aed', bg: '#f5f3ff', badgeBg: '#ede9fe', badgeText: '#6d28d9', border: '#ddd6fe' },
  }[method.tone]

  if (status === 'running') {
    return (
      <div style={{ ...cardStyle(accent), alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
        <div style={{
          fontFamily: fontMono, fontSize: '0.66rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: accent.badgeText, fontWeight: 700, marginBottom: 14,
        }}>
          {method.label}
        </div>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: `2px solid ${accent.border}`, borderTopColor: accent.bar,
          animation: 'scanSpin 1s linear infinite',
        }} />
        <style>{`@keyframes scanSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ marginTop: 10, fontSize: '0.8rem', color: textMuted }}>Running…</div>
      </div>
    )
  }

  if (data?.__error) {
    return (
      <div style={{ ...cardStyle(accent), borderColor: '#fecaca', background: '#fef2f2' }}>
        <div style={{
          fontFamily: fontMono, fontSize: '0.66rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#b91c1c', fontWeight: 700, marginBottom: 8,
        }}>
          {method.label} — Failed
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.5 }}>
          {data.__error}
        </p>
      </div>
    )
  }

  const orig = data?.original_fairness_score
  const debiased = data?.debiased_fairness_score
  const improvement = data?.improvement_percent

  return (
    <div style={cardStyle(accent)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: fontMono, fontSize: '0.66rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: accent.badgeText, fontWeight: 700,
        }}>
          {method.label}
        </div>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent.bar }} />
      </div>

      <MetricRow label="Original" value={orig != null ? `${orig}/100` : '—'} color={textBody} />
      <MetricRow label="Debiased" value={debiased != null ? `${debiased}/100` : '—'} color={accent.bar} big />
      <MetricRow label="Improvement" value={improvement != null ? `${improvement}%` : '—'} color={accent.bar} />

      <p style={{ margin: 0, fontSize: '0.78rem', color: textBody, lineHeight: 1.5, minHeight: 48 }}>
        {data?.explanation ?? ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
        {onDownload && (
          <button onClick={onDownload} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px',
            background: '#ffffff', color: accent.badgeText,
            border: `1px solid ${accent.border}`, borderRadius: 8,
            fontFamily: fontInter, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} /> Download .pkl
          </button>
        )}
        {data?.inference_instructions && (
          <button onClick={onCopyInstructions} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px',
            background: 'transparent', color: textMuted,
            border: `1px dashed ${accent.border}`, borderRadius: 8,
            fontFamily: fontMono, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
          }}>
            <Copy size={12} /> Copy inference instructions
          </button>
        )}
      </div>
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
        fontSize: big ? '1.25rem' : '0.95rem',
        fontWeight: 700,
        color,
      }}>
        {value}
      </span>
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

const cardStyle = (accent) => ({
  background: accent.bg,
  border: `1px solid ${accent.border}`,
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
})

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
