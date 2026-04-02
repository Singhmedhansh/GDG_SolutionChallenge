import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Search, Shield, FileCheck, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────
const TRUST = ['React', 'Python FastAPI', 'Gemini API', 'Google Cloud']
const spring = { type: 'spring', stiffness: 80, damping: 18 }
const blue = '#2563eb'
const blueBg = '#eff6ff'
const blueBorder = '#bfdbfe'
const bg = '#f8fafc'
const card = '#ffffff'
const border = '#e2e8f0'
const textHead = '#0f172a'
const textMuted = '#64748b'
const fontMono = `'IBM Plex Mono', monospace`
const fontInter = `'Inter', sans-serif`

// ── StatPill (no external library) ────────────────────────
function StatPill({ end, suffix, label, duration }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let current = 0
    const steps = 40
    const increment = end / steps
    const interval = (duration * 1000) / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [end, duration])

  return (
    <div style={{
      fontFamily: fontMono, fontSize: '0.72rem', color: textMuted,
      background: card, border: `1px solid ${border}`, borderRadius: 999,
      padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 4
    }}>
      <span style={{ color: blue, fontWeight: 600 }}>{count}{suffix}</span>
      {label}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [primaryHover, setPrimaryHover] = useState(false)
  const howRef = useRef(null)
  const trustRef = useRef(null)
  const howInView = useInView(howRef, { once: true, margin: '-80px' })
  const trustInView = useInView(trustRef, { once: true, margin: '-80px' })

  const steps = [
    {
      num: '01',
      icon: <FileCheck size={28} color={blue} />,
      title: 'Upload Dataset',
      desc: 'Drop any CSV hiring dataset. Columns are parsed and previewed instantly in your browser — no data leaves your machine.',
    },
    {
      num: '02',
      icon: <Search size={28} color={blue} />,
      title: 'Detect Bias',
      desc: 'Our engine scans for demographic parity gaps, proxy attributes, and fairness metric violations across all protected groups.',
    },
    {
      num: '03',
      icon: <Shield size={28} color={blue} />,
      title: 'Fix & Export',
      desc: 'Receive a detailed fairness report with flagged columns and actionable mitigation recommendations your team can act on.',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: fontInter, color: textHead }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600;800&display=swap');
        body { background: ${bg}; }
        * { box-sizing: border-box; }
      `}</style>

      <Toaster position="top-right" />

      {/* ── HERO ────────────────────────────────────────── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '80px 24px'
      }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: fontMono, fontSize: '0.72rem', color: blue,
            background: blueBg, border: `1px solid ${blueBorder}`,
            borderRadius: 999, padding: '5px 16px', marginBottom: 32
          }}
        >
          <Search size={13} color={blue} />
          AI-Powered Bias Detection for Hiring
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          <div style={{
            fontWeight: 800, fontSize: 'clamp(3rem, 6vw, 5rem)',
            lineHeight: 1.1, letterSpacing: '-0.02em', color: textHead
          }}>
            Detect Hidden Bias.
          </div>
          <div style={{
            fontWeight: 800, fontSize: 'clamp(3rem, 6vw, 5rem)',
            lineHeight: 1.1, letterSpacing: '-0.02em', color: blue
          }}>
            Build Fairer AI.
          </div>
        </motion.div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.25 }}
          style={{
            color: textMuted, fontSize: '1rem', maxWidth: 500,
            textAlign: 'center', lineHeight: 1.75, marginBottom: 40, margin: '0 auto 40px'
          }}
        >
          FairScan audits your hiring datasets for hidden discrimination — before automated decisions impact real people.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            onClick={() => {
              toast.success('Redirecting to upload...')
              setTimeout(() => navigate('/analyze'), 600)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: fontInter, fontWeight: 500, fontSize: '0.9rem',
              padding: '13px 28px', border: 'none', borderRadius: 8,
              background: primaryHover ? '#1d4ed8' : blue,
              color: '#fff', cursor: 'pointer', transition: 'background 0.2s'
            }}
          >
            Upload Dataset <ArrowRight size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/report')}
            style={{
              fontFamily: fontInter, fontWeight: 500, fontSize: '0.9rem',
              padding: '13px 28px', border: `1px solid ${border}`,
              borderRadius: 8, background: card, color: '#475569', cursor: 'pointer'
            }}
          >
            View Demo Report
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.45 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <StatPill end={94} suffix="%" label=" Detection Accuracy" duration={2} />
          <StatPill end={3} suffix="" label=" Fairness Metrics" duration={1.5} />
          <div style={{
            fontFamily: fontMono, fontSize: '0.72rem', color: textMuted,
            background: card, border: `1px solid ${border}`,
            borderRadius: 999, padding: '6px 16px'
          }}>
            Open Source ✓
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginTop: 48 }}
        >
          <ChevronDown size={20} color="#94a3b8" />
        </motion.div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <div ref={howRef} style={{ background: '#f1f5f9', padding: '80px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={howInView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}
        >
          <hr style={{ border: 'none', borderTop: `1px solid ${border}` }} />
          <div style={{
            fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8',
            letterSpacing: '0.2em', textTransform: 'uppercase', margin: '16px 0'
          }}>
            HOW IT WORKS
          </div>
          <hr style={{ border: 'none', borderTop: `1px solid ${border}` }} />
          <div style={{
            fontWeight: 700, fontSize: '1.8rem',
            color: textHead, marginTop: 24
          }}>
            Three steps to fairer hiring
          </div>
        </motion.div>

        {/* Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24, maxWidth: 900, margin: '48px auto 0'
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={howInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.15 }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
              style={{
                background: card, border: `1px solid ${border}`,
                borderRadius: 12, padding: '32px 28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              {step.icon}
              <div style={{
                fontFamily: fontMono, fontSize: '0.72rem', color: blue,
                background: blueBg, border: `1px solid ${blueBorder}`,
                borderRadius: 6, padding: '3px 10px', marginTop: 16,
                display: 'inline-block', width: 'fit-content'
              }}>
                {step.num}
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: textHead, marginTop: 12 }}>
                {step.title}
              </div>
              <div style={{ fontSize: '0.875rem', color: textMuted, lineHeight: 1.65, marginTop: 8 }}>
                {step.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── TRUST BAR ───────────────────────────────────── */}
      <div ref={trustRef} style={{ background: card, padding: '40px 24px', borderTop: `1px solid ${border}` }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={trustInView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <span style={{ fontFamily: fontInter, color: '#94a3b8', fontSize: '0.85rem' }}>
            Built with
          </span>
          {TRUST.map((t, i) => (
            <span key={i} style={{
              fontFamily: fontMono, fontSize: '0.72rem', color: textMuted,
              background: bg, border: `1px solid ${border}`, borderRadius: 999,
              padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
              <CheckCircle size={11} color={blue} />
              {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <div style={{
        background: bg, padding: 24, borderTop: `1px solid ${border}`,
        textAlign: 'center', fontFamily: fontMono,
        fontSize: '0.65rem', color: '#cbd5e1', letterSpacing: '0.18em'
      }}>
        FairScan v1.0 — Solutions Challenge 2026 — GDG × Hack2Skill
      </div>
    </div>
  )
}