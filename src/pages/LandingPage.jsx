import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Search, Shield, FileCheck, ArrowRight, CheckCircle, ChevronDown, Sparkles, Users, Briefcase, Scale, FileSpreadsheet, FileText, Wand2 } from 'lucide-react'
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

// ── FeatureCard shell ─────────────────────────────────────
function FeatureCard({ onClick, inView, delay, accent, accentSoft, accentBorder, icon, tag, title, body, cta, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay }}
      whileHover={{ y: -4, boxShadow: '0 18px 38px rgba(15,23,42,0.10)' }}
      style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 16, padding: '24px 26px 22px',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: accent, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 14px ${accent}33`,
        }}>
          {icon}
        </div>
        <div style={{
          fontFamily: fontMono, fontSize: '0.65rem', color: accent,
          background: accentSoft, border: `1px solid ${accentBorder}`,
          borderRadius: 999, padding: '3px 10px',
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
        }}>
          {tag}
        </div>
      </div>

      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: textHead, lineHeight: 1.3 }}>
        {title}
      </div>

      {children}

      <p style={{ margin: 0, color: textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>
        {body}
      </p>

      <button
        type="button"
        onClick={onClick}
        style={{
          marginTop: 'auto', alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: fontInter, fontSize: '0.88rem', fontWeight: 600,
          padding: '10px 18px', border: `1px solid ${accentBorder}`,
          borderRadius: 8, background: accentSoft, color: accent,
          cursor: 'pointer',
        }}
      >
        {cta} <ArrowRight size={14} />
      </button>
    </motion.div>
  )
}

// Dataset preview — a static little fairness-score card with an animated bar
function DatasetPreview({ inView }) {
  return (
    <div style={{
      background: '#f8fafc', border: `1px solid ${border}`,
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: fontMono, fontSize: '0.68rem', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          demo_hiring.csv
        </span>
        <span style={{
          fontFamily: fontMono, fontSize: '0.68rem',
          color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 999, padding: '2px 10px', fontWeight: 600,
        }}>
          42 / 100
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: '42%' } : { width: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ height: '100%', background: '#ef4444', borderRadius: 999 }}
        />
      </div>
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        fontFamily: fontMono, fontSize: '0.64rem', color: '#92400e',
      }}>
        {['gender ↔ proxy', 'zipcode r=0.62', 'age gap 22%'].map((chip) => (
          <span key={chip} style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 999, padding: '2px 8px',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

// Rewrite preview — the core animation: biased sentence strikes through,
// then the inclusive rewrite reveals word-by-word.
function RewritePreview({ inView }) {
  const biased = ['We', 'need', 'a', 'rockstar', 'ninja', 'who', 'can', 'work', 'hard', 'and', 'play', 'hard']
  const biasedFlags = new Set([3, 4, 10, 11]) // rockstar, ninja, play, hard
  const rewrite = "We're hiring a skilled professional who thrives on meaningful challenges and strong collaboration.".split(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* BIASED ROW */}
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 10, padding: '12px 14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontFamily: fontMono, fontSize: '0.62rem', color: '#991b1b',
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
          }} />
          Detected — exclusionary language
        </div>
        <div style={{
          position: 'relative',
          fontSize: '0.9rem', lineHeight: 1.55, color: '#450a0a',
          fontFamily: fontInter,
        }}>
          {biased.map((word, i) => (
            <motion.span
              key={i}
              initial={{ color: '#450a0a' }}
              animate={inView && biasedFlags.has(i) ? { color: '#ef4444' } : {}}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.03 }}
              style={{
                position: 'relative',
                marginRight: 4,
                fontWeight: biasedFlags.has(i) ? 600 : 400,
              }}
            >
              {word}
              {biasedFlags.has(i) && (
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 + i * 0.04 }}
                  style={{
                    position: 'absolute',
                    left: 0, right: 0, top: '50%',
                    height: 2, background: '#ef4444', transformOrigin: 'left',
                    borderRadius: 1,
                  }}
                />
              )}
            </motion.span>
          ))}
        </div>
      </div>

      {/* ARROW */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.4 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: fontMono, fontSize: '0.62rem', color: '#9333ea',
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
        }}
      >
        <Sparkles size={12} color="#9333ea" />
        Gemini rewrite
      </motion.div>

      {/* REWRITE ROW */}
      <div style={{
        background: '#faf5ff', border: '1px solid #e9d5ff',
        borderRadius: 10, padding: '12px 14px',
        minHeight: 68,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontFamily: fontMono, fontSize: '0.62rem', color: '#6b21a8',
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#9333ea',
          }} />
          Inclusive rewrite
        </div>
        <div style={{
          fontSize: '0.9rem', lineHeight: 1.55, color: '#3b0764',
          fontFamily: fontInter,
        }}>
          {rewrite.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 1.7 + i * 0.06 }}
              style={{ display: 'inline-block', marginRight: 4 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [primaryHover, setPrimaryHover] = useState(false)
  const howRef = useRef(null)
  const trustRef = useRef(null)
  const sdgRef = useRef(null)
  const featuresRef = useRef(null)
  const howInView = useInView(howRef, { once: true, margin: '-80px' })
  const trustInView = useInView(trustRef, { once: true, margin: '-80px' })
  const sdgInView = useInView(sdgRef, { once: true, margin: '-80px' })
  const featuresInView = useInView(featuresRef, { once: true, margin: '-120px' })

  const sdgs = [
    {
      code: 'SDG 5',
      title: 'Gender Equality',
      desc: 'Flags gender-based approval gaps and proxy columns so hiring models stop penalising women.',
      icon: <Users size={20} color="#ffffff" />,
      accent: '#FF3A21',
      accentSoft: '#ffe4e0',
    },
    {
      code: 'SDG 8',
      title: 'Decent Work',
      desc: 'Surfaces discriminatory patterns before automated decisions lock people out of fair employment.',
      icon: <Briefcase size={20} color="#ffffff" />,
      accent: '#A21942',
      accentSoft: '#fde4ec',
    },
    {
      code: 'SDG 10',
      title: 'Reduced Inequalities',
      desc: 'Quantifies cross-group disparities (DPD, Equalised Odds) so bias gets measured — not ignored.',
      icon: <Scale size={20} color="#ffffff" />,
      accent: '#DD1367',
      accentSoft: '#fde2ee',
    },
  ]

  const steps = [
    {
      num: '01',
      icon: <FileCheck size={28} color={blue} />,
      title: 'Upload Dataset',
      desc: 'Drop any CSV hiring dataset. Columns are previewed instantly in your browser, then analyzed in a transient backend session — no database, nothing persisted.',
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

        {/* Powered-by Gemini badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: fontInter, fontSize: '0.78rem', fontWeight: 600,
            color: '#ffffff',
            background: 'linear-gradient(135deg, #4285F4 0%, #9B72F2 50%, #D96570 100%)',
            borderRadius: 999, padding: '6px 16px 6px 10px',
            marginBottom: 14,
            boxShadow: '0 6px 16px rgba(66, 133, 244, 0.28)',
          }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.22)',
          }}>
            <Sparkles size={12} color="#ffffff" />
          </span>
          Powered by Google Gemini 1.5 Flash
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
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

          <motion.a
            href="/demo_hiring.csv"
            download="demo_hiring.csv"
            whileHover={{ scale: 1.01 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: fontInter, fontWeight: 500, fontSize: '0.9rem',
              padding: '13px 28px', border: `1px solid ${blueBorder}`,
              borderRadius: 8, background: blueBg, color: blue,
              cursor: 'pointer', textDecoration: 'none'
            }}
          >
            Download Demo CSV
          </motion.a>

          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/jobposting')}
            style={{
              fontFamily: fontInter, fontWeight: 500, fontSize: '0.9rem',
              padding: '13px 28px', border: `1px solid #c084fc`,
              borderRadius: 8, background: '#faf5ff', color: '#9333ea', cursor: 'pointer'
            }}
          >
            Scan Job Posting
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

      {/* ── TWO FEATURE CARDS: Detect + Remediate ────────── */}
      <div ref={featuresRef} style={{ background: card, padding: '80px 24px', borderTop: `1px solid ${border}` }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: fontMono, fontSize: '0.65rem',
            color: blue, background: blueBg, border: `1px solid ${blueBorder}`,
            borderRadius: 999, padding: '4px 12px',
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            <Wand2 size={11} color={blue} />
            Detect &amp; Remediate
          </div>
          <div style={{
            fontWeight: 700, fontSize: '1.8rem',
            color: textHead, marginTop: 16, letterSpacing: '-0.01em',
          }}>
            Two surfaces, one mission
          </div>
          <p style={{
            margin: '10px auto 0', maxWidth: 620,
            color: textMuted, fontSize: '0.95rem', lineHeight: 1.65,
          }}>
            Most fairness tools just flag problems. FairScan flags them <em>and</em> shows you how to fix them — whether the bias lives in your data or in the words of your job posts.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          maxWidth: 1040, margin: '40px auto 0',
        }}>
          <FeatureCard
            onClick={() => navigate('/analyze')}
            inView={featuresInView}
            delay={0.1}
            accent={blue}
            accentSoft={blueBg}
            accentBorder={blueBorder}
            icon={<FileSpreadsheet size={20} color="#ffffff" />}
            tag="Dataset Scanner"
            title="Scan your hiring data for hidden bias"
            body="Drop a CSV and get a fairness score, demographic parity gaps per protected group, and a Key-Insight card exposing proxy columns (like zipcode standing in for race)."
            cta="Scan a Dataset"
          >
            <DatasetPreview inView={featuresInView} />
          </FeatureCard>

          <FeatureCard
            onClick={() => navigate('/jobposting')}
            inView={featuresInView}
            delay={0.22}
            accent="#9333ea"
            accentSoft="#faf5ff"
            accentBorder="#e9d5ff"
            icon={<FileText size={20} color="#ffffff" />}
            tag="Job Posting Scanner"
            title="Rewrite exclusionary job language, instantly"
            body="Paste a description. FairScan flags gendered, ableist, and age-coded phrases, then Gemini rewrites it into inclusive copy — without losing your voice."
            cta="Scan a Job Posting"
          >
            <RewritePreview inView={featuresInView} />
          </FeatureCard>
        </div>
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

      {/* ── UN SDGs ─────────────────────────────────────── */}
      <div ref={sdgRef} style={{ background: card, padding: '72px 24px', borderTop: `1px solid ${border}` }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={sdgInView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: fontMono, fontSize: '0.65rem',
            color: '#0f766e', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 999, padding: '4px 12px',
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            <Scale size={11} color="#0f766e" />
            Impact
          </div>
          <div style={{
            fontWeight: 700, fontSize: '1.8rem',
            color: textHead, marginTop: 16, letterSpacing: '-0.01em',
          }}>
            Aligned with UN Sustainable Development Goals
          </div>
          <p style={{
            margin: '10px auto 0', maxWidth: 560,
            color: textMuted, fontSize: '0.95rem', lineHeight: 1.65,
          }}>
            Fair hiring isn&rsquo;t just good engineering — it&rsquo;s how we keep AI accountable to the people it touches.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          maxWidth: 960, margin: '40px auto 0',
        }}>
          {sdgs.map((sdg, i) => (
            <motion.div
              key={sdg.code}
              initial={{ opacity: 0, y: 32 }}
              animate={sdgInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.12 }}
              whileHover={{ y: -4, boxShadow: '0 14px 32px rgba(15, 23, 42, 0.08)' }}
              style={{
                background: card, border: `1px solid ${border}`,
                borderRadius: 14, padding: '22px 22px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: sdg.accent,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 6px 14px ${sdg.accent}33`,
                }}>
                  {sdg.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: fontMono, fontSize: '0.7rem',
                    color: sdg.accent, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}>
                    {sdg.code}
                  </div>
                  <div style={{
                    fontSize: '1.02rem', fontWeight: 700, color: textHead,
                    lineHeight: 1.2, marginTop: 2,
                  }}>
                    {sdg.title}
                  </div>
                </div>
              </div>
              <p style={{
                margin: 0, color: textMuted, fontSize: '0.88rem', lineHeight: 1.6,
              }}>
                {sdg.desc}
              </p>
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