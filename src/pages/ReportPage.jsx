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
  Flag,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
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

// ── Main Component ─────────────────────────────────────────
export default function ReportPage() {
  const navigate = useNavigate()
  const { results: apiResults } = useResults() || {}
  const data = apiResults || mockResults

  const headerRef = useRef(null)
  const summaryRef = useRef(null)
  const geminiRef = useRef(null)
  const breakdownRef = useRef(null)
  const proxiesRef = useRef(null)
  const recommendationsRef = useRef(null)

  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const summaryInView = useInView(summaryRef, { once: true, margin: '-60px' })
  const geminiInView = useInView(geminiRef, { once: true, margin: '-60px' })
  const breakdownInView = useInView(breakdownRef, { once: true, margin: '-60px' })
  const proxiesInView = useInView(proxiesRef, { once: true, margin: '-60px' })
  const recommendationsInView = useInView(recommendationsRef, { once: true, margin: '-60px' })

  const scoreTone = getScoreTone(data.fairnessScore)
  const isUsingMock = !apiResults

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
              {data.flaggedProxies.map((proxy) => (
                <span
                  key={proxy}
                  style={{
                    background: '#fffbeb', border: '1px solid #fde68a',
                    color: '#92400e', fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem', borderRadius: '999px', padding: '3px 10px',
                  }}
                >
                  {proxy}
                </span>
              ))}
            </div>
          </motion.div>
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

        {/* ── FLAGGED PROXIES ── */}
        <div ref={proxiesRef} style={{ marginBottom: '24px' }}>
          <div style={pageStyles.sectionLabel}>Flagged Proxy Columns</div>
          <div style={pageStyles.sectionTitle}>These columns appear neutral but may encode protected attributes</div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={proxiesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{ ...pageStyles.card, padding: '24px' }}
          >
            {data.flaggedProxies.map((proxy, index) => (
              <div
                key={proxy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', padding: '10px 0',
                  borderBottom: index === data.flaggedProxies.length - 1 ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  color: '#92400e', fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.72rem', borderRadius: '4px', padding: '3px 8px',
                  background: '#fffbeb', border: '1px solid #fde68a',
                }}>
                  <Flag size={12} />
                  {proxy}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Correlates with protected attributes — consider removing or re-weighting
                </div>
              </div>
            ))}
          </motion.div>
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
          
          {/* DEBIAS CTA */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/debias')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', background: '#eff6ff', border: '1px solid #bfdbfe',
                color: '#2563eb', borderRadius: '8px', fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Have a trained model? Debias it here <ArrowRight size={16} />
            </button>
          </div>
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
  )
}