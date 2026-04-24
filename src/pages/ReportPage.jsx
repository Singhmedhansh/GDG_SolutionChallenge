import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  Download,
  ArrowLeft,
  ArrowRight,
  Flag,
  Sparkles,
  TrendingUp,
  Wand2,
  GitCompareArrows,
  Link2,
  Zap,
} from 'lucide-react'
import { Component } from 'react'
import { useResults } from '../context/ResultsContext'
import { mockResults } from '../data/mockResults'

// ── Design tokens ──────────────────────────────────────────
const pageStyles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    background: '#f8fafc',
    color: '#0f172a',
    padding: '40px 24px',
    fontFamily: "'Inter', sans-serif",
  },
  shell: {
    maxWidth: '960px',
    margin: '0 auto',
  },
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

// ── Score tone helper ──────────────────────────────────────
function getScoreTone(score) {
  if (score < 50) return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: 'Bias Detected' }
  if (score < 75) return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: 'Needs Review' }
  return { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: 'No Bias Detected' }
}

// ── Custom SVG Progress Bar (replaces broken Recharts) ─────
function SvgBarChart({ data, biasDetected }) {
  const maxRate = Math.max(...data.map((d) => d.approvalRate), 1)
  const barColors = biasDetected
    ? ['#2563eb', '#ef4444', '#f59e0b', '#8b5cf6']
    : ['#10b981', '#059669', '#34d399', '#6ee7b7']

  return (
    <div style={{ padding: '16px 0' }}>
      {data.map((entry, i) => (
        <div key={entry.group} style={{ marginBottom: 12 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 6,
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem', color: '#64748b',
            }}>
              {entry.group}
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem', fontWeight: 600,
              color: barColors[i % barColors.length],
            }}>
              {entry.approvalRate}%
            </span>
          </div>
          <div style={{
            height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(entry.approvalRate / maxRate) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
              style={{
                height: '100%',
                background: barColors[i % barColors.length],
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Group breakdown table ──────────────────────────────────
function GroupTable({ groupDetails }) {
  if (!groupDetails?.length) return null
  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.65rem', color: '#94a3b8',
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Group Breakdown
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['Group', 'Total', 'Approved', 'Rejected', 'Rate'].map((h) => (
              <th key={h} style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.65rem', color: '#94a3b8',
                textAlign: 'left', padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupDetails.map((row, i) => (
            <tr key={row.group} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 500 }}>{row.group}</td>
              <td style={{ padding: '8px 12px', color: '#64748b' }}>{row.total ?? '—'}</td>
              <td style={{ padding: '8px 12px', color: '#10b981' }}>{row.approved ?? '—'}</td>
              <td style={{ padding: '8px 12px', color: '#ef4444' }}>{row.rejected ?? '—'}</td>
              <td style={{ padding: '8px 12px', fontFamily: "'IBM Plex Mono', monospace", color: '#0f172a' }}>
                {row.rate !== undefined ? `${row.rate}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Top influencing factors table ──────────────────────────
function InfluenceTable({ factors }) {
  if (!factors?.length) return null
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.65rem', color: '#94a3b8',
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Top Contributing Factors
      </div>
      {factors.map((f, i) => (
        <div key={f.feature ?? i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: i < factors.length - 1 ? '1px solid #f1f5f9' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={13} color="#2563eb" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#0f172a' }}>
              {f.feature ?? f}
            </span>
          </div>
          {f.influence !== undefined && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.72rem', color: '#64748b',
            }}>
              {(f.influence * 100).toFixed(1)}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Proxy normalization (supports legacy string[] and enriched objects) ─
function normalizeProxies(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') {
      return { column: item, correlatesWith: null, correlation: null, explanation: null }
    }
    return {
      column: item.column ?? item.name ?? 'unknown',
      correlatesWith: item.correlatesWith ?? item.correlates_with ?? null,
      correlation: item.correlation ?? item.pearson ?? null,
      explanation: item.explanation ?? item.reason ?? null,
    }
  })
}

function correlationTone(r) {
  const abs = Math.abs(Number(r) || 0)
  if (abs >= 0.6) return { label: 'Strong', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' }
  if (abs >= 0.3) return { label: 'Moderate', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
  return { label: 'Weak', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
}

// ── Key Insight Card ───────────────────────────────────────
function KeyInsightCard({ proxies }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      style={{
        position: 'relative',
        marginBottom: 24,
        borderRadius: 16,
        padding: '2px',
        background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 45%, #7c3aed 100%)',
        boxShadow: '0 18px 40px rgba(239, 68, 68, 0.18)',
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: '24px 26px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            color: '#ffffff',
          }}>
            <Zap size={18} />
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.68rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#ef4444', fontWeight: 700,
          }}>
            Key Insight — Hidden Proxy Columns
          </div>
        </div>
        <p style={{
          margin: '6px 0 18px', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6,
        }}>
          Columns that look neutral but carry protected-attribute signal. Removing the protected
          column isn't enough — these proxies let bias sneak back in.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: proxies.length > 1 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
          gap: 14,
        }}>
          {proxies.map((proxy, i) => {
            const tone = correlationTone(proxy.correlation)
            const rValue = proxy.correlation != null
              ? Number(proxy.correlation).toFixed(2)
              : '—'
            return (
              <motion.div
                key={proxy.column}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 + i * 0.08 }}
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  border: `1px solid ${tone.border}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.95rem', fontWeight: 700, color: '#0f172a',
                  }}>
                    <Flag size={14} color="#f59e0b" />
                    {proxy.column}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', borderRadius: 999,
                    background: tone.bg, color: tone.color,
                    border: `1px solid ${tone.border}`,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {tone.label}
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.78rem', color: '#475569',
                  }}>
                    <Link2 size={12} color="#64748b" />
                    <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>
                      {proxy.column}
                    </span>
                    <span>↔</span>
                    <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>
                      {proxy.correlatesWith ?? 'protected attribute'}
                    </span>
                  </div>
                  <div style={{
                    marginLeft: 'auto',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '1.25rem', fontWeight: 800, color: tone.color,
                    letterSpacing: '-0.01em',
                  }}>
                    r = {rValue}
                  </div>
                </div>

                {proxy.explanation && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <Sparkles size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{
                      margin: 0, color: '#78350f',
                      fontSize: '0.82rem', lineHeight: 1.55,
                    }}>
                      {proxy.explanation}
                    </p>
                  </div>
                )}

                {!proxy.explanation && proxy.correlation == null && (
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.7rem', color: '#94a3b8',
                  }}>
                    Correlation and explanation unavailable — backend returned only the column name.
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Error Boundary ─────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fef2f2', color: '#ef4444', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main Component ─────────────────────────────────────────
export default function ReportPage() {
  const navigate = useNavigate()
  const { results: apiResults, debiasedResults } = useResults() || {}
  const data = apiResults || mockResults
  const hasDebiased = Boolean(debiasedResults)

  const headerRef = useRef(null)
  const summaryRef = useRef(null)
  const geminiRef = useRef(null)
  const breakdownRef = useRef(null)
  const recommendationsRef = useRef(null)

  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const summaryInView = useInView(summaryRef, { once: true, margin: '-60px' })
  const geminiInView = useInView(geminiRef, { once: true, margin: '-60px' })
  const breakdownInView = useInView(breakdownRef, { once: true, margin: '-60px' })
  const recommendationsInView = useInView(recommendationsRef, { once: true, margin: '-60px' })

  const scoreTone = getScoreTone(data.fairnessScore)
  const isUsingMock = !apiResults
  const normalizedProxies = normalizeProxies(data.flaggedProxies)

  const handleDownloadReport = () => {
    const report = {
      ...data,
      generatedAt: new Date().toISOString(),
      reportType: 'FairScan Bias Analysis Report',
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fairscan-bias-report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ErrorBoundary>
    <div style={pageStyles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`}</style>
      <div style={pageStyles.shell}>

        {/* ── HEADER ── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          {isUsingMock && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 8, padding: '8px 14px', marginBottom: 16,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#92400e',
            }}>
              ⚠ Demo mode — showing mock data. Connect the backend to see real results.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem', color: '#94a3b8', marginBottom: '10px',
              }}>
                <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</a>
                <span> / </span>
                <a href="/analyze" onClick={(e) => { e.preventDefault(); navigate('/analyze') }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Analyze</a>
                <span> / Report</span>
              </div>
              <h1 style={{ fontSize: '2rem', lineHeight: 1.1, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Bias Analysis Report
              </h1>
              <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                {data.datasetInfo?.fileName ?? 'Hiring Dataset'} · {data.decisionColumn} column · {data.datasetInfo?.totalRows?.toLocaleString() ?? '—'} rows
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadReport}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                borderRadius: '8px', padding: '10px 20px',
                border: '1px solid #e2e8f0', background: '#ffffff',
                color: '#475569', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              <Download size={15} />
              <span>Download Report</span>
            </button>
          </div>
          <div style={{ borderBottom: '1px solid #e2e8f0', margin: '24px 0 0' }} />
        </motion.div>

        {/* ── SUMMARY CARDS ── */}
        <motion.div
          ref={summaryRef}
          initial={{ opacity: 0, y: 30 }}
          animate={summaryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '16px',
            marginTop: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Fairness Score */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={summaryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0 }}
            style={{ ...pageStyles.card, padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}
          >
            <div style={{ width: 90, height: 90, flexShrink: 0 }}>
              <CircularProgressbar
                value={data.fairnessScore}
                text={`${data.fairnessScore}`}
                styles={buildStyles({
                  pathColor: scoreTone.color,
                  trailColor: '#f1f5f9',
                  textColor: scoreTone.color,
                  textSize: '22px',
                })}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={pageStyles.sectionLabel}>Fairness Score</div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '1.8rem', fontWeight: 700,
                color: scoreTone.color, lineHeight: 1.1,
              }}>
                {data.fairnessScore}/100
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '10px', padding: '4px 12px',
                borderRadius: '999px', border: `1px solid ${scoreTone.border}`,
                background: scoreTone.bg, color: scoreTone.color,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', fontWeight: 600,
              }}>
                <AlertTriangle size={12} />
                {scoreTone.text}
              </div>
            </div>
          </motion.div>

          {/* Attributes Scanned */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={summaryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
            style={{ ...pageStyles.card, padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <ShieldAlert size={28} color="#2563eb" />
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                  {data.protectedAttributes.length}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Attributes Scanned</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.protectedAttributes.map((item) => (
                <span
                  key={item.attribute}
                  style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    color: '#2563eb', fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem', borderRadius: '999px',
                    padding: '3px 10px', textTransform: 'capitalize',
                  }}
                >
                  {item.attribute}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Proxy Columns */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={summaryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
            style={{ ...pageStyles.card, padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <Flag size={28} color="#f59e0b" />
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                  {data.flaggedProxies.length}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Proxy Columns Flagged</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {normalizedProxies.map((proxy) => (
                <span
                  key={proxy.column}
                  style={{
                    background: '#fffbeb', border: '1px solid #fde68a',
                    color: '#92400e', fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem', borderRadius: '999px', padding: '3px 10px',
                  }}
                >
                  {proxy.column}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── KEY INSIGHT: Proxy Columns (our differentiator) ── */}
        {normalizedProxies.length > 0 && (
          <KeyInsightCard proxies={normalizedProxies} />
        )}

        {/* ── HERO CTA: Fix This Bias / View Comparison ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
          style={{
            marginBottom: 24,
            borderRadius: 14,
            padding: '22px 26px',
            background: hasDebiased
              ? 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            boxShadow: hasDebiased
              ? '0 14px 30px rgba(16, 185, 129, 0.28)'
              : '0 14px 30px rgba(37, 99, 235, 0.28)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {hasDebiased ? <GitCompareArrows size={24} /> : <Wand2 size={24} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', opacity: 0.85, marginBottom: 4,
              }}>
                {hasDebiased ? 'Debiased model ready' : 'Next step'}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 }}>
                {hasDebiased
                  ? 'See how much fairer your model got'
                  : 'Fix this bias — apply fairness constraints to your model'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(hasDebiased ? '/report/comparison' : '/debias')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 22px',
              background: '#ffffff',
              color: hasDebiased ? '#10b981' : '#2563eb',
              border: 'none', borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 14px rgba(15, 23, 42, 0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            {hasDebiased ? 'View Before / After' : 'Fix This Bias'}
            <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* ── GEMINI AI SUMMARY ── */}
        {data.overallSummary && (
          <motion.div
            ref={geminiRef}
            initial={{ opacity: 0, y: 24 }}
            animate={geminiInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 12, padding: '20px 24px', marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={18} color="#f59e0b" />
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem',
                color: '#92400e', fontWeight: 600, letterSpacing: '0.08em',
              }}>
                Gemini AI Summary
              </span>
            </div>
            <p style={{ margin: 0, color: '#78350f', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {data.overallSummary}
            </p>
          </motion.div>
        )}

        {/* ── BIAS BREAKDOWN ── */}
        <div ref={breakdownRef} style={{ marginBottom: '24px' }}>
          <div style={pageStyles.sectionLabel}>Bias Breakdown</div>
          <div style={pageStyles.sectionTitle}>Approval rate comparison across protected groups</div>

          {data.protectedAttributes.map((item) => (
            <motion.div
              key={item.attribute}
              initial={{ opacity: 0, y: 30 }}
              animate={breakdownInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              style={{ ...pageStyles.card, padding: '24px', marginBottom: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                    {item.attribute}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    {item.metric}
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '999px',
                  border: item.biasDetected ? '1px solid #fecaca' : '1px solid #bbf7d0',
                  background: item.biasDetected ? '#fef2f2' : '#f0fdf4',
                  color: item.biasDetected ? '#ef4444' : '#10b981',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  {item.biasDetected ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  {item.biasDetected ? 'Bias Detected' : 'Fair'}
                </div>
              </div>

              {/* Gemini plain English explanation */}
              {data.attributeExplanations?.[item.attribute] && (
                <div style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                  fontSize: '0.85rem', color: '#1d4ed8', lineHeight: 1.65,
                }}>
                  {data.attributeExplanations[item.attribute]}
                </div>
              )}

              {/* SVG bar chart */}
              <SvgBarChart data={item.groupStats} biasDetected={item.biasDetected} />

              {/* Top influencing factors */}
              <InfluenceTable factors={item.topInfluencingFactors} />

              {/* Group breakdown table */}
              <GroupTable groupDetails={item.groupDetails} />
            </motion.div>
          ))}
        </div>

        {/* ── RECOMMENDATIONS ── */}
        <div ref={recommendationsRef} style={{ marginBottom: '32px' }}>
          <div style={pageStyles.sectionLabel}>Recommendations</div>
          <div style={pageStyles.sectionTitle}>Actionable steps to reduce bias in your hiring pipeline</div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={recommendationsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{ ...pageStyles.card, padding: '24px' }}
          >
            {data.recommendations.map((recommendation, index) => (
              <div
                key={recommendation}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '14px 0',
                  borderBottom: index === data.recommendations.length - 1 ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem',
                  fontWeight: 600, flexShrink: 0, marginTop: '2px',
                }}>
                  {index + 1}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Lightbulb size={16} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {recommendation}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', marginTop: '32px', paddingTop: '24px',
          borderTop: '1px solid #e2e8f0', flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => navigate('/analyze')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '8px', padding: '12px 20px',
              border: '1px solid #e2e8f0', background: '#ffffff',
              color: '#475569', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 500,
            }}
          >
            <ArrowLeft size={15} />
            <span>Analyze Another Dataset</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '8px', padding: '12px 24px',
              border: '1px solid #2563eb', background: '#2563eb',
              color: '#ffffff', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600,
              boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
            }}
          >
            <Download size={15} />
            <span>Download Report</span>
          </button>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}