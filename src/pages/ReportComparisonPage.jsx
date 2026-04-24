import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate as animateMotion,
} from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Sparkles,
  GitCompareArrows,
} from 'lucide-react'
import { useResults } from '../context/ResultsContext'
import { mockResults } from '../data/mockResults'

const pageStyles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    background: '#f8fafc',
    color: '#0f172a',
    padding: '40px 24px',
    fontFamily: "'Inter', sans-serif",
  },
  shell: { maxWidth: '960px', margin: '0 auto' },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  sectionLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '16px',
  },
}

function toneFor(score) {
  if (score < 50) return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Bias Detected' }
  if (score < 75) return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Needs Review' }
  return { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Fair' }
}

function dpdOf(groupStats) {
  if (!groupStats?.length) return 0
  const rates = groupStats.map((g) => g.approvalRate ?? 0)
  return (Math.max(...rates) - Math.min(...rates)) / 100
}

// Project "after" group stats from "before" stats using the overall improvement fraction:
// each group's rate moves toward the attribute mean by the improvement fraction.
// Used as a visual projection when the backend doesn't return per-attribute debiased stats.
function projectAfterStats(groupStats, improvementFraction) {
  if (!groupStats?.length) return []
  const mean = groupStats.reduce((sum, g) => sum + (g.approvalRate ?? 0), 0) / groupStats.length
  const shrink = Math.max(0, Math.min(1, improvementFraction))
  return groupStats.map((g) => {
    const rate = g.approvalRate ?? 0
    const projected = rate + (mean - rate) * shrink
    return { ...g, approvalRate: Math.round(projected) }
  })
}

function AnimatedNumber({ value, duration = 1.2, prefix = '', suffix = '', style }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animateMotion(mv, value, { duration, ease: 'easeOut' })
    const unsub = rounded.on('change', (v) => setDisplay(v))
    return () => { controls.stop(); unsub() }
  }, [value, duration, mv, rounded])

  return <span style={style}>{prefix}{display}{suffix}</span>
}

function MiniBar({ label, value, color, delay = 0, valueSuffix = '%' }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
      }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#64748b' }}>
          {label}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color }}>
          {value}{valueSuffix}
        </span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
        />
      </div>
    </div>
  )
}

export default function ReportComparisonPage() {
  const navigate = useNavigate()
  const { results: apiResults, debiasedResults } = useResults() || {}

  useEffect(() => {
    if (!debiasedResults) {
      navigate('/report', { replace: true })
    }
  }, [debiasedResults, navigate])

  const before = apiResults || mockResults
  const after = debiasedResults

  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-60px' })

  const beforeScore = Math.round(before?.fairnessScore ?? after?.original_fairness_score ?? 0)
  const afterScore = Math.round(after?.debiased_fairness_score ?? 0)
  const delta = afterScore - beforeScore
  const improvementFraction = useMemo(() => {
    if (beforeScore >= 100) return 0
    return Math.max(0, (afterScore - beforeScore) / (100 - beforeScore))
  }, [beforeScore, afterScore])

  const beforeTone = toneFor(beforeScore)
  const afterTone = toneFor(afterScore)

  // Prefer backend-provided per-attribute debiased stats if present; otherwise project.
  const backendAfterAttrs =
    after?.debiased_attributes ?? after?.protected_attributes ?? after?.attributes ?? null

  const attributeRows = useMemo(() => {
    const originals = before?.protectedAttributes ?? []
    return originals.map((orig) => {
      const matched = Array.isArray(backendAfterAttrs)
        ? backendAfterAttrs.find((x) => x?.attribute === orig.attribute)
        : null
      const afterStats = matched?.groupStats
        ?? projectAfterStats(orig.groupStats, improvementFraction)
      const beforeDpd = dpdOf(orig.groupStats)
      const afterDpd = matched?.dpd ?? dpdOf(afterStats)
      return {
        attribute: orig.attribute,
        beforeStats: orig.groupStats,
        afterStats,
        beforeDpd,
        afterDpd,
        projected: !matched,
      }
    })
  }, [before, backendAfterAttrs, improvementFraction])

  const anyProjected = attributeRows.some((r) => r.projected)

  if (!after) return null

  return (
    <div style={pageStyles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`}</style>
      <div style={pageStyles.shell}>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.72rem', color: '#94a3b8', marginBottom: 10,
          }}>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</a>
            <span> / </span>
            <a href="/report" onClick={(e) => { e.preventDefault(); navigate('/report') }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Report</a>
            <span> / Comparison</span>
          </div>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.1, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Before / After Comparison
          </h1>
          <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Fairness constraints applied with <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#0f172a' }}>
              {after.fairnessMetric ?? 'demographic_parity'}
            </span>
            {after.protectedAttribute && <> on <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#0f172a' }}>{after.protectedAttribute}</span></>}
          </p>
          <div style={{ borderBottom: '1px solid #e2e8f0', margin: '24px 0 0' }} />
        </motion.div>

        {/* ── HERO: Score Before/After ── */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 24 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          style={{
            ...pageStyles.card,
            marginTop: 24, marginBottom: 24,
            padding: '32px 28px',
          }}
        >
          <div style={pageStyles.sectionLabel}>Fairness Score</div>
          <div style={pageStyles.sectionTitle}>Overall improvement</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
            alignItems: 'center',
            gap: 24,
            marginTop: 12,
          }}>
            {/* BEFORE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                <CircularProgressbar
                  value={beforeScore}
                  text={`${beforeScore}`}
                  styles={buildStyles({
                    pathColor: beforeTone.color,
                    trailColor: '#f1f5f9',
                    textColor: beforeTone.color,
                    textSize: '22px',
                  })}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={pageStyles.sectionLabel}>Before</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '1.5rem', fontWeight: 700,
                  color: beforeTone.color, lineHeight: 1.1,
                }}>
                  {beforeScore}/100
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                  padding: '4px 10px', borderRadius: 999,
                  border: `1px solid ${beforeTone.border}`, background: beforeTone.bg,
                  color: beforeTone.color, fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.68rem', fontWeight: 600,
                }}>
                  {beforeTone.label}
                </div>
              </div>
            </div>

            {/* DELTA */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={heroInView ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.4 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 18px',
                background: delta >= 0
                  ? 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                color: '#fff', borderRadius: 14,
                boxShadow: '0 10px 24px rgba(16, 185, 129, 0.28)',
                minWidth: 120,
              }}
            >
              <TrendingUp size={18} />
              <AnimatedNumber
                value={delta}
                prefix={delta >= 0 ? '+' : ''}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '1.6rem', fontWeight: 800, lineHeight: 1,
                }}
              />
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.62rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', opacity: 0.9,
              }}>
                points
              </div>
            </motion.div>

            {/* AFTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <div style={pageStyles.sectionLabel}>After</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '1.5rem', fontWeight: 700,
                  color: afterTone.color, lineHeight: 1.1,
                }}>
                  {afterScore}/100
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                  padding: '4px 10px', borderRadius: 999,
                  border: `1px solid ${afterTone.border}`, background: afterTone.bg,
                  color: afterTone.color, fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.68rem', fontWeight: 600,
                }}>
                  {afterTone.label}
                </div>
              </div>
              <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                <CircularProgressbar
                  value={afterScore}
                  text={`${afterScore}`}
                  styles={buildStyles({
                    pathColor: afterTone.color,
                    trailColor: '#f1f5f9',
                    textColor: afterTone.color,
                    textSize: '22px',
                  })}
                />
              </div>
            </div>
          </div>

          {after.explanation && (
            <div style={{
              marginTop: 24,
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Sparkles size={16} color="#f59e0b" />
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem',
                  color: '#92400e', fontWeight: 600, letterSpacing: '0.08em',
                }}>
                  What changed
                </span>
              </div>
              <p style={{ margin: 0, color: '#78350f', fontSize: '0.88rem', lineHeight: 1.65 }}>
                {after.explanation}
              </p>
            </div>
          )}
        </motion.div>

        {/* ── PER-ATTRIBUTE DPD ── */}
        {attributeRows.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={pageStyles.sectionLabel}>Demographic Parity Difference (DPD) per attribute</div>
            <div style={pageStyles.sectionTitle}>Approval-rate spread across groups — lower is fairer</div>

            {attributeRows.map((row, idx) => {
              const dpdDelta = row.beforeDpd - row.afterDpd
              return (
                <motion.div
                  key={row.attribute}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18, delay: idx * 0.08 }}
                  style={{ ...pageStyles.card, padding: 20, marginBottom: 16 }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: 12, marginBottom: 14,
                  }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                        {row.attribute}
                      </div>
                      <div style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.72rem', color: '#64748b', marginTop: 4,
                      }}>
                        DPD: {row.beforeDpd.toFixed(2)} → {row.afterDpd.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 999,
                      background: dpdDelta >= 0 ? '#f0fdf4' : '#fef2f2',
                      color: dpdDelta >= 0 ? '#10b981' : '#ef4444',
                      border: `1px solid ${dpdDelta >= 0 ? '#bbf7d0' : '#fecaca'}`,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      <TrendingUp size={12} />
                      −{Math.abs(dpdDelta).toFixed(2)} DPD
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                    gap: 16,
                  }}>
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.62rem', color: '#991b1b',
                        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
                      }}>
                        Before
                      </div>
                      {row.beforeStats.map((g, i) => (
                        <MiniBar
                          key={`b-${g.group}`}
                          label={g.group}
                          value={g.approvalRate}
                          color="#ef4444"
                          delay={i * 0.06}
                        />
                      ))}
                    </div>
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.62rem', color: '#065f46',
                        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
                      }}>
                        After
                      </div>
                      {row.afterStats.map((g, i) => (
                        <MiniBar
                          key={`a-${g.group}`}
                          label={g.group}
                          value={g.approvalRate}
                          color="#10b981"
                          delay={0.3 + i * 0.06}
                        />
                      ))}
                    </div>
                  </div>

                  {row.projected && (
                    <div style={{
                      marginTop: 12,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.68rem', color: '#94a3b8',
                    }}>
                      * After rates projected from overall improvement — backend did not return per-attribute debiased stats.
                    </div>
                  )}
                </motion.div>
              )
            })}

            {anyProjected && (
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem', color: '#94a3b8', marginTop: 4,
              }}>
                Fairness score values come directly from the debiasing engine.
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 16, marginTop: 32, paddingTop: 24,
          borderTop: '1px solid #e2e8f0', flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => navigate('/report')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 8, padding: '12px 20px',
              border: '1px solid #e2e8f0', background: '#ffffff',
              color: '#475569', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 500,
            }}
          >
            <ArrowLeft size={15} />
            Back to Report
          </button>

          <button
            type="button"
            onClick={() => navigate('/debias')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 8, padding: '12px 24px',
              border: '1px solid #2563eb', background: '#2563eb',
              color: '#ffffff', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600,
              boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
            }}
          >
            <GitCompareArrows size={15} />
            Try Another Configuration
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
