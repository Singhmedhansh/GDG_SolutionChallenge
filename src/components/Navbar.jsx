import { Link, useLocation } from 'react-router-dom'

const navStyle = {
  background: '#0d1424',
  borderBottom: '1px solid #1e293b',
  padding: '0 2rem',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  fontFamily: "'IBM Plex Mono', monospace",
}

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontWeight: 700,
  fontSize: '1.1rem',
  color: '#f1f5f9',
  letterSpacing: '0.05em',
}

const pulseStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: '#ef4444',
  animation: 'pulse 1.5s infinite',
}

const linksStyle = {
  display: 'flex',
  gap: '2rem',
  listStyle: 'none',
}

export default function Navbar() {
  const location = useLocation()

  const linkStyle = (path) => ({
    color: location.pathname === path ? '#f59e0b' : '#94a3b8',
    borderBottom: location.pathname === path ? '2px solid #f59e0b' : '2px solid transparent',
    paddingBottom: '2px',
    fontSize: '0.85rem',
    letterSpacing: '0.05em',
    transition: 'color 0.2s',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
      <nav style={navStyle}>
        <div style={logoStyle}>
          <div style={pulseStyle} />
          FairScan
        </div>
        <ul style={linksStyle}>
          <li><Link to="/" style={linkStyle('/')}>Home</Link></li>
          <li><Link to="/analyze" style={linkStyle('/analyze')}>Analyze</Link></li>
          <li><Link to="/report" style={linkStyle('/report')}>Report</Link></li>
        </ul>
      </nav>
    </>
  )
}