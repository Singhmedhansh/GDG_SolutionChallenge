import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Settings2, SlidersHorizontal, ArrowRight, CheckCircle2, Download, BarChart2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ReactDropzone from 'react-dropzone'

// tokens
const bg = '#f8fafc'
const card = '#ffffff'
const border = '#e2e8f0'
const textHead = '#0f172a'
const textBody = '#334155'
const textMuted = '#64748b'
const blue = '#2563eb'
const fontInter = `'Inter', sans-serif`
const fontMono = `'IBM Plex Mono', monospace`

export default function DebiasPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  
  // Form State
  const [modelFile, setModelFile] = useState(null)
  const [modelBase64, setModelBase64] = useState('')
  const [datasetFile, setDatasetFile] = useState(null)
  const [datasetBase64, setDatasetBase64] = useState('')
  const [protectedAttribute, setProtectedAttribute] = useState('gender')
  const [metric, setMetric] = useState('demographic_parity')
  const [penaltyWeight, setPenaltyWeight] = useState(0.5)

  // API State
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)

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
      const response = await fetch('http://localhost:8000/api/debias-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_file: modelBase64,
          dataset_csv: datasetBase64,
          protected_attributes: [protectedAttribute],
          fairness_metric: metric,
          penalty_weight: parseFloat(penaltyWeight)
        })
      })

      if (!response.ok) throw new Error('API error')
      
      const data = await response.json()
      setResult(data)
      setStep(3) // Result step
      toast.success('Model debiasing complete!')
    } catch (err) {
      console.error(err)
      toast.error("Failed to debias. Is your Python backend running with fairlearn installed?")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result?.debiased_model) return
    const link = document.createElement("a");
    link.href = "data:application/octet-stream;base64," + result.debiased_model;
    link.download = `debiased_model_${metric}.pkl`;
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Debiasing Methodology</label>
                    <select 
                      value={metric}
                      onChange={e => setMetric(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="demographic_parity">Demographic Parity (Post-processing)</option>
                      <option value="equalized_odds">Equalized Odds (Post-processing)</option>
                      <option value="penalty">Loss Penalty (Sample Re-weighting)</option>
                    </select>
                    <div style={{ fontSize: '0.85rem', color: textMuted, marginTop: 4 }}>
                       Defines whether the engine optimizes for independent predictions or equal error rates across groups.
                    </div>
                  </div>

                  {metric === 'penalty' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={labelStyle}>Penalty Weight: {penaltyWeight}</label>
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        value={penaltyWeight}
                        onChange={e => setPenaltyWeight(e.target.value)}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                  <button onClick={() => setStep(1)} style={secondaryBtnStyle}>Back</button>
                  <button 
                    onClick={handleDebias}
                    disabled={isProcessing || !protectedAttribute}
                    style={primaryBtnStyle(isProcessing || !protectedAttribute)}
                  >
                    {isProcessing ? 'Processing Model...' : 'Apply Debiasing'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Results */}
            {step === 3 && result && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', color: '#10b981', marginBottom: 16 }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: 8, color: textHead }}>Debiasing Complete</h2>
                  <p style={{ color: textMuted }}>{result.explanation}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginBottom: 32 }}>
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: `1px solid ${border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Original Fairness</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{result.original_fairness_score}<span style={{fontSize: '1rem'}}>/100</span></div>
                  </div>
                  
                  <div style={{ background: '#eff6ff', padding: 24, borderRadius: 12, border: `1px solid ${blueBorder}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', color: blue, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Debiased Fairness</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: blue }}>{result.debiased_fairness_score}<span style={{fontSize: '1rem'}}>/100</span></div>
                    
                    {result.improvement_percent > 0 && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: '#10b981', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                        +{result.improvement_percent}%
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button onClick={() => {setStep(1); setResult(null); setModelFile(null); setDatasetFile(null);}} style={secondaryBtnStyle}>
                    Start Over
                  </button>
                  <button onClick={handleDownload} style={primaryBtnStyle(false)}>
                    <Download size={18} /> Download Protected .pkl
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
