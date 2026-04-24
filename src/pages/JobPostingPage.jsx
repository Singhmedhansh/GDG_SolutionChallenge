import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, ShieldAlert, FileText, ArrowRight,
  AlertTriangle, Lightbulb, CheckCircle2,
  Copy, Download, Loader2
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { API_BASE } from '../services/api'

// ── Design tokens ──────────────────────────────────────────
const bg = '#f8fafc'
const card = '#ffffff'
const border = '#e2e8f0'
const blue = '#2563eb'
const blueBg = '#eff6ff'
const blueBorder = '#bfdbfe'
const textHead = '#0f172a'
const textMuted = '#64748b'
const fontInter = `'Inter', sans-serif`
const fontMono = `'IBM Plex Mono', monospace`

export default function JobPostingPage() {
  const navigate = useNavigate()
  
  const [jobDescription, setJobDescription] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  
  // Debounce ref
  const timeoutRef = useRef(null)

  const handleTextChange = (e) => {
    const text = e.target.value
    setJobDescription(text)
    
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    // Set a new timeout to auto-scan if text is long enough
    if (text.trim().length > 50) {
      timeoutRef.current = setTimeout(() => {
        runScan(text)
      }, 1000)
    } else {
      setScanResult(null)
    }
  }

  const runScan = async (text) => {
    if (!text || text.trim() === '') return
    
    setIsScanning(true)
    try {
      const response = await fetch(`${API_BASE}/api/scan-job-posting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: text })
      })
      
      if (!response.ok) {
        throw new Error('Failed to scan')
      }
      
      const data = await response.json()
      setScanResult(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to scan job description.")
    } finally {
      setIsScanning(false)
    }
  }

  const copyRewritten = () => {
    if (scanResult?.rewritten_job) {
      navigator.clipboard.writeText(scanResult.rewritten_job)
      toast.success("Copied to clipboard!")
    }
  }

  const handleDownload = () => {
    if (!scanResult) return
    const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'job_bias_report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getRiskColor = (risk) => {
    if (risk === 'high') return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' }
    if (risk === 'medium') return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
    if (risk === 'low') return { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' }
    return { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: bg, color: textHead, fontFamily: fontInter, padding: '40px 24px' }}>
      <Toaster position="bottom-right" />
      <style>{`
        * { box-sizing: border-box; }
        .jd-textarea:focus { outline: none; border-color: ${blueBorder}; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .glass-scroll::-webkit-scrollbar { width: 6px; }
        .glass-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
      
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: fontMono, fontSize: '0.72rem', color: textMuted, marginBottom: 12,
          }}>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} style={{ color: textMuted, textDecoration: 'none' }}>Home</a>
            <span> / Job Posting Scanner</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px' }}>
            Job Posting Bias Scanner
          </h1>
          <p style={{ margin: 0, color: textMuted, fontSize: '1rem' }}>
            Check your job description for hidden bias before posting. Real-time Gemini AI analysis.
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
          
          {/* LEFT: Input Area */}
          <div style={{
            background: card, border: `1px solid ${border}`, borderRadius: 12,
            display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem' }}>
                <FileText size={16} color={blue} /> Job Description
              </div>
              <div>
                {isScanning ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: blue, fontFamily: fontMono }}>
                    <Loader2 size={13} className="animate-spin" /> Scanning...
                  </div>
                ) : scanResult ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#10b981', fontFamily: fontMono }}>
                    <CheckCircle2 size={13} /> Scanned
                  </div>
                ) : null}
              </div>
            </div>
            
            <textarea
              className="jd-textarea glass-scroll"
              placeholder="Paste your job posting here..."
              value={jobDescription}
              onChange={handleTextChange}
              style={{
                flex: 1, width: '100%', border: 'none', padding: 20, resize: 'none',
                fontFamily: fontInter, fontSize: '0.95rem', lineHeight: 1.6, color: textHead,
                background: 'transparent'
              }}
            />
            
            <div style={{ padding: 16, borderTop: `1px solid ${border}`, background: '#f8fafc' }}>
               <button
                  onClick={() => runScan(jobDescription)}
                  disabled={isScanning || jobDescription.trim() === ''}
                  style={{
                    width: '100%', padding: '12px', background: blue, color: '#fff',
                    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem',
                    cursor: (isScanning || jobDescription.trim() === '') ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: (isScanning || jobDescription.trim() === '') ? 0.7 : 1
                  }}
               >
                 {isScanning ? 'Scanning with Gemini...' : 'Scan for Bias'}
               </button>
            </div>
          </div>

          {/* RIGHT: Results Area */}
          <div style={{ height: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AnimatePresence mode="wait">
              {!scanResult ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', border: `2px dashed ${border}`, borderRadius: 12,
                    background: card, color: textMuted, padding: 32, textAlign: 'center'
                  }}
                >
                  <Search size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: textHead, marginBottom: 8 }}>
                    Awaiting Job Description
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: 300, lineHeight: 1.6 }}>
                    Paste your text on the left to instantly detect exclusionary language and receive fairness suggestions.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="glass-scroll"
                  style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  
                  {/* Overall Risk */}
                  <div style={{
                    background: getRiskColor(scanResult.overall_risk).bg,
                    border: `1px solid ${getRiskColor(scanResult.overall_risk).border}`,
                    borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16
                  }}>
                    <ShieldAlert size={28} color={getRiskColor(scanResult.overall_risk).color} />
                    <div>
                      <div style={{ fontFamily: fontMono, fontSize: '0.7rem', color: getRiskColor(scanResult.overall_risk).color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Overall Bias Risk
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: textHead, textTransform: 'capitalize' }}>
                        {scanResult.overall_risk} Risk
                      </div>
                    </div>
                  </div>

                  {/* Bias Flags */}
                  {scanResult.bias_flags.length > 0 && (
                     <div>
                       <div style={{ fontFamily: fontMono, fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                         Detected Biases
                       </div>
                       <div style={{ display: 'grid', gap: 12 }}>
                         {scanResult.bias_flags.map((flag, idx) => (
                           <div key={idx} style={{
                             background: card, border: `1px solid ${border}`, borderRadius: 8, padding: 16,
                             borderLeft: `4px solid ${getRiskColor(flag.severity).color}`
                           }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                               <span style={{ fontWeight: 600, fontSize: '0.95rem', color: textHead }}>{flag.type}</span>
                               <span style={{
                                 fontFamily: fontMono, fontSize: '0.65rem', padding: '3px 8px', borderRadius: 999,
                                 background: getRiskColor(flag.severity).bg, color: getRiskColor(flag.severity).color,
                                 border: `1px solid ${getRiskColor(flag.severity).border}`, textTransform: 'uppercase'
                               }}>
                                 {flag.severity}
                               </span>
                             </div>
                             <div style={{ fontSize: '0.85rem', color: '#92400e', background: '#fffbeb', padding: '6px 10px', borderRadius: 6, marginBottom: 8, fontStyle: 'italic' }}>
                               "{flag.example}"
                             </div>
                             <div style={{ fontSize: '0.85rem', color: textMuted, lineHeight: 1.5 }}>
                               {flag.explanation}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                  )}

                  {/* Suggestions */}
                  {scanResult.suggestions.length > 0 && (
                    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '20px' }}>
                      <div style={{ fontFamily: fontMono, fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                        AI Recommendations
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {scanResult.suggestions.map((sug, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <Lightbulb size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                            <div style={{ fontSize: '0.875rem', color: textHead, lineHeight: 1.5 }}>{sug}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewritten Job */}
                  {scanResult.rewritten_job && scanResult.rewritten_job !== jobDescription && (
                    <div style={{ background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: fontMono, fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Rewritten Version
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={copyRewritten} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: fontInter }}>
                            <Copy size={14} /> Copy
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: 20, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.7, fontFamily: fontInter, whiteSpace: 'pre-wrap' }}>
                        {scanResult.rewritten_job}
                      </div>
                    </div>
                  )}
                  
                  {scanResult.rewritten_job && (
                    <button
                      onClick={handleDownload}
                      style={{
                        padding: '12px', background: card, color: textHead, border: `1px solid ${border}`,
                        borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontWeight: 500, fontSize: '0.9rem', marginBottom: 20
                      }}
                    >
                      <Download size={16} /> Download Full Report
                    </button>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
