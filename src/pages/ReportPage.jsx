import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
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
} from 'lucide-react'
import { mockResults } from '../data/mockResults'

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

function getScoreTone(score) {
  if (score < 50) return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: 'Bias Detected' }
  if (score < 75) return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: 'Needs Review' }
  return { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: 'No Bias Detected' }
}

function DownloadButton({ onClick, variant = 'secondary' }) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '8px',
        padding: isPrimary ? '12px 24px' : '10px 20px',
        border: isPrimary ? '1px solid #2563eb' : '1px solid #e2e8f0',
        background: isPrimary ? '#2563eb' : '#ffffff',
        color: isPrimary ? '#ffffff' : '#475569',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        fontSize: isPrimary ? '0.9rem' : '0.85rem',
        fontWeight: isPrimary ? 600 : 500,
        boxShadow: isPrimary ? '0 8px 18px rgba(37, 99, 235, 0.18)' : 'none',
      }}
    >
      <Download size={15} />
      <span>Download Report</span>
    </button>
  )
}

export default function ReportPage() {
  const navigate = useNavigate()
  const headerRef = useRef(null)
  const summaryRef = useRef(null)
  const breakdownRef = useRef(null)
  const proxiesRef = useRef(null)
  const recommendationsRef = useRef(null)

  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const summaryInView = useInView(summaryRef, { once: true, margin: '-60px' })
  const breakdownInView = useInView(breakdownRef, { once: true, margin: '-60px' })
  const proxiesInView = useInView(proxiesRef, { once: true, margin: '-60px' })
  const recommendationsInView = useInView(recommendationsRef, { once: true, margin: '-60px' })

  const scoreTone = getScoreTone(mockResults.fairnessScore)

  const handleDownloadReport = () => {
    const report = {
      ...mockResults,
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
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  marginBottom: '10px',
                }}
              >
                <a href="/" onClick={(event) => { event.preventDefault(); navigate('/') }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</a>
                <span> / </span>
                <a href="/analyze" onClick={(event) => { event.preventDefault(); navigate('/analyze') }} style={{ color: '#94a3b8', textDecoration: 'none' }}>Analyze</a>
                <span> / Report</span>
              </div>

              <h1 style={{ fontSize: '2rem', lineHeight: 1.1, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Bias Analysis Report
              </h1>
              <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                Hiring Dataset · {mockResults.decisionColumn} column · Scanned just now
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadReport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                padding: '10px 20px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <Download size={15} />
              <span>Download Report</span>
            </button>
          </div>

          <div style={{ borderBottom: '1px solid #e2e8f0', margin: '24px 0 0' }} />
        </motion.div>

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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={summaryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0 }}
            style={{ ...pageStyles.card, padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}
          >
            <div style={{ width: 100, height: 100, flexShrink: 0 }}>
              <CircularProgressbar
                value={mockResults.fairnessScore}
                text={`${mockResults.fairnessScore}`}
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
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: scoreTone.color,
                  lineHeight: 1.1,
                }}
              >
                {mockResults.fairnessScore}/100
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${scoreTone.border}`,
                  background: scoreTone.bg,
                  color: scoreTone.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={12} />
                {scoreTone.text}
              </div>
            </div>
          </motion.div>

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
                  {mockResults.protectedAttributes.length}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Attributes Scanned</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {mockResults.protectedAttributes.map((item) => (
                <span
                  key={item.attribute}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.attribute}
                </span>
              ))}
            </div>
          </motion.div>

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
                  {mockResults.flaggedProxies.length}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Proxy Columns Flagged</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {mockResults.flaggedProxies.map((proxy) => (
                <span
                  key={proxy}
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem',
                    borderRadius: '999px',
                    padding: '3px 10px',
                  }}
                >
                  {proxy}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div ref={breakdownRef} style={{ marginBottom: '24px' }}>
          <div style={pageStyles.sectionLabel}>Bias Breakdown</div>
          <div style={pageStyles.sectionTitle}>Approval rate comparison across protected groups</div>

          {mockResults.protectedAttributes.map((item, index) => {
            return (
              <div
                key={item.attribute}
                style={{ ...pageStyles.card, padding: '24px', marginBottom: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                      {item.attribute}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      {item.metric}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: item.biasDetected ? '1px solid #fecaca' : '1px solid #bbf7d0',
                      background: item.biasDetected ? '#fef2f2' : '#f0fdf4',
                      color: item.biasDetected ? '#ef4444' : '#10b981',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.biasDetected ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                    {item.biasDetected ? 'Bias Detected' : 'Fair'}
                  </div>
                </div>

                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={item.groupStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="group" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Approval Rate']}
                      contentStyle={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                      }}
                    />
                      <Bar dataKey="approvalRate" radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={false}>
                      {item.groupStats.map((entry, barIndex) => (
                        <Cell
                          key={`${item.attribute}-${entry.group}`}
                          fill={item.biasDetected ? (barIndex % 2 === 0 ? '#2563eb' : '#ef4444') : '#10b981'}
                        />
                      ))}
                    </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>

        <div ref={proxiesRef} style={{ marginBottom: '24px' }}>
          <div style={pageStyles.sectionLabel}>Flagged Proxy Columns</div>
          <div style={pageStyles.sectionTitle}>These columns appear neutral but may encode protected attributes</div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={proxiesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{ ...pageStyles.card, padding: '24px' }}
          >
            {mockResults.flaggedProxies.map((proxy, index) => (
              <div
                key={proxy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: index === mockResults.flaggedProxies.length - 1 ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#92400e',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.72rem',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    textTransform: 'none',
                  }}
                >
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

        <div ref={recommendationsRef} style={{ marginBottom: '32px' }}>
          <div style={pageStyles.sectionLabel}>Recommendations</div>
          <div style={pageStyles.sectionTitle}>Actionable steps to reduce bias in your hiring pipeline</div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={recommendationsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            style={{ ...pageStyles.card, padding: '24px' }}
          >
            {mockResults.recommendations.map((recommendation, index) => (
              <div
                key={recommendation}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px 0',
                  borderBottom: index === mockResults.recommendations.length - 1 ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/analyze')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
              padding: '12px 20px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={15} />
            <span>Analyze Another Dataset</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
              padding: '12px 24px',
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 600,
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