import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Code2,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Scale,
} from 'lucide-react'

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
const spring = { type: 'spring', stiffness: 80, damping: 18 }

const TEAM = [
  {
    name: 'Medhansh Singh',
    github: 'Singhmedhansh',
    role: 'Frontend Engineer',
    days: 'Days 1–5, 10',
    description: 'Built the entire React frontend — Landing Page, Analysis flow, Report Page, animations, and design system.',
    color: blue,
  },
  {
    name: 'Tanmay Angarkar',
    github: 'angarkartanmay-ops',
    role: 'Backend Engineer',
    days: 'Days 6–10',
    description: 'Built the FastAPI backend, bias calculation logic, Gemini AI integration, and explainability layer.',
    color: '#7c3aed',
  },
  {
    name: 'Teammate 3',
    github: '',
    role: 'ML / Explainability',
    days: 'Days 11–15',
    description: 'ML explainability improvements, SHAP analysis, and final submission polish.',
    color: '#059669',
  },
]

const SDGs = [
  {
    number: 'SDG 8',
    title: 'Decent Work & Economic Growth',
    desc: 'Fair hiring practices ensure equal economic opportunity for all people, regardless of gender, age, or ethnicity.',
    icon: <BookOpen size={22} color="#2563eb" />,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    number: 'SDG 10',
    title: 'Reduced Inequalities',
    desc: 'By detecting and flagging discriminatory patterns, FairScan directly combats systemic inequality in automated decision systems.',
    icon: <HeartHandshake size={22} color="#7c3aed" />,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    number: 'SDG 16',
    title: 'Peace, Justice & Strong Institutions',
    desc: 'Accountable AI that can be audited and explained is essential for just institutions and fair governance.',
    icon: <Scale size={22} color="#059669" />,
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
]

const STACK = [
  { label: 'React 19', sub: 'Frontend framework' },
  { label: 'Vite', sub: 'Build tool' },
  { label: 'Framer Motion', sub: 'Animations' },
  { label: 'Python FastAPI', sub: 'Backend API' },
  { label: 'pandas + sklearn', sub: 'Bias analysis' },
  { label: 'Gemini API', sub: 'AI explanations' },
  { label: 'PapaParse', sub: 'CSV parsing' },
  { label: 'react-select', sub: 'Column selector' },
  { label: '@tanstack/table', sub: 'Data preview' },
  { label: 'react-dropzone', sub: 'File upload' },
  { label: 'react-hot-toast', sub: 'Notifications' },
  { label: 'lucide-react', sub: 'Icon system' },
]

export default function AboutPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const sdgRef = useRef(null)
  const stackRef = useRef(null)
  const teamRef = useRef(null)
  const ctaRef = useRef(null)

  const heroInView = useInView(heroRef, { once: true, margin: '-60px' })
  const sdgInView = useInView(sdgRef, { once: true, margin: '-60px' })
  const stackInView = useInView(stackRef, { once: true, margin: '-60px' })
  const teamInView = useInView(teamRef, { once: true, margin: '-60px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-60px' })

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: fontInter, color: textHead }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600;700;800&display=swap');
        body { background: ${bg}; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* ── HERO ── */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          style={{ marginBottom: 64, textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: fontMono, fontSize: '0.72rem', color: blue,
            background: blueBg, border: `1px solid ${blueBorder}`,
            borderRadius: 999, padding: '5px 16px', marginBottom: 20,
          }}>
            <ShieldCheck size={13} color={blue} />
            Google Solutions Challenge 2026 — GDG × Hack2Skill
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-0.02em', color: textHead, margin: '0 0 16px',
          }}>
            About <span style={{ color: blue }}>FairScan</span>
          </h1>

          <p style={{
            color: textMuted, fontSize: '1rem', maxWidth: 560,
            margin: '0 auto', lineHeight: 1.75,
          }}>
            An AI-powered bias detection tool that audits hiring datasets for hidden discrimination —
            before automated decisions impact real people. Built for the <strong>"Unbiased AI Decision"</strong> problem statement.
          </p>
        </motion.div>

        {/* ── PROBLEM STATEMENT ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.15 }}
          style={{
            background: card, border: `1px solid ${border}`, borderRadius: 12,
            padding: '28px 32px', marginBottom: 48,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          }}
        >
          <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
            Problem Statement
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.15rem', color: textHead, marginBottom: 12 }}>
            Unbiased AI Decision — Ensuring Fairness and Detecting Bias in Automated Systems
          </div>
          <p style={{ color: textMuted, fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
            Automated hiring systems trained on historical data often inherit and amplify human biases.
            FairScan addresses this by providing a transparent, explainable audit layer — computing
            Demographic Parity Differences, detecting proxy variables, and generating AI-powered
            mitigation recommendations using Google's Gemini API.
          </p>
        </motion.div>

        {/* ── UN SDGs ── */}
        <div ref={sdgRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={sdgInView ? { opacity: 1, y: 0 } : {}}
            transition={spring}
            style={{ marginBottom: 24 }}
          >
            <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              UN Sustainable Development Goals
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: textHead }}>
              SDG Alignment
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 48 }}>
            {SDGs.map((sdg, i) => (
              <motion.div
                key={sdg.number}
                initial={{ opacity: 0, y: 30 }}
                animate={sdgInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: i * 0.12 }}
                style={{
                  background: sdg.bg, border: `1px solid ${sdg.border}`,
                  borderRadius: 12, padding: '24px',
                }}
              >
                <div style={{ marginBottom: 12 }}>{sdg.icon}</div>
                <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: sdg.color, letterSpacing: '0.1em', marginBottom: 6 }}>
                  {sdg.number}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: textHead, marginBottom: 8 }}>
                  {sdg.title}
                </div>
                <p style={{ color: textMuted, fontSize: '0.85rem', lineHeight: 1.65, margin: 0 }}>
                  {sdg.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── TECH STACK ── */}
        <div ref={stackRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stackInView ? { opacity: 1, y: 0 } : {}}
            transition={spring}
            style={{ marginBottom: 24 }}
          >
            <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              Built With
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: textHead }}>
              Technology Stack
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stackInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.1 }}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 12,
              padding: '28px', marginBottom: 48,
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12,
            }}
          >
            {STACK.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={stackInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ ...spring, delay: i * 0.04 }}
                style={{
                  background: bg, border: `1px solid ${border}`, borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontFamily: fontMono, fontSize: '0.75rem', fontWeight: 600, color: textHead }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 2 }}>
                  {item.sub}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── TEAM ── */}
        <div ref={teamRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={spring}
            style={{ marginBottom: 24 }}
          >
            <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              Meet the Builders
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: textHead }}>
              Our Team
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16, marginBottom: 56 }}>
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: i * 0.12 }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 12,
                  padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: member.color + '20',
                  border: `2px solid ${member.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Users size={20} color={member.color} />
                </div>

                <div style={{ fontWeight: 700, fontSize: '1rem', color: textHead, marginBottom: 4 }}>
                  {member.name}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: fontMono, fontSize: '0.65rem', color: member.color,
                    background: member.color + '15', border: `1px solid ${member.color}30`,
                    borderRadius: 999, padding: '3px 10px',
                  }}>
                    {member.role}
                  </span>
                  <span style={{
                    fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8',
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 999, padding: '3px 10px',
                  }}>
                    {member.days}
                  </span>
                </div>

                <p style={{ color: textMuted, fontSize: '0.85rem', lineHeight: 1.65, margin: '0 0 14px' }}>
                  {member.description}
                </p>

                {member.github && (
                  <a
                    href={`https://github.com/${member.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: fontMono, fontSize: '0.72rem', color: blue,
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Code2 size={13} />
                    @{member.github}
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 30 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          style={{
            background: `linear-gradient(135deg, ${blueBg} 0%, #f0f4ff 100%)`,
            border: `1px solid ${blueBorder}`,
            borderRadius: 16, padding: '40px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: blue, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
            Ready to audit?
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.75rem', color: textHead, marginBottom: 12 }}>
            Try FairScan on your dataset
          </div>
          <p style={{ color: textMuted, fontSize: '0.95rem', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Upload any hiring CSV and get a detailed fairness report with Gemini AI-powered recommendations in seconds.
          </p>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/analyze')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: fontInter, fontWeight: 600, fontSize: '0.95rem',
              padding: '13px 28px', border: 'none', borderRadius: 8,
              background: blue, color: '#fff', cursor: 'pointer',
            }}
          >
            Analyze Dataset <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </div>

      <div style={{
        background: bg, padding: 24, borderTop: `1px solid ${border}`,
        textAlign: 'center', fontFamily: fontMono,
        fontSize: '0.65rem', color: '#cbd5e1', letterSpacing: '0.18em',
      }}>
        FairScan v1.0 — Solutions Challenge 2026 — GDG × Hack2Skill
      </div>
    </div>
  )
}
