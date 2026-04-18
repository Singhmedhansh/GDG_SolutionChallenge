import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  width: '100%',
  height: '60px',
  padding: '0 2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backdropFilter: 'blur(12px) saturate(180%)',
  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
  background: 'rgba(255, 255, 255, 0.75)',
  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
}

const logoWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const pulseStyle = {
  width: '9px',
  height: '9px',
  borderRadius: '50%',
  background: '#ef4444',
  animation: 'pulse 2s ease infinite',
}

const logoTextStyle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontWeight: 700,
  fontSize: '1rem',
  color: '#0f172a',
  letterSpacing: '0.02em',
  textDecoration: 'none',
  cursor: 'pointer',
}

const linksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

export default function Navbar() {
  const location = useLocation()

  useEffect(() => {
    const fontLinkId = 'fairscan-navbar-fonts'
    if (document.getElementById(fontLinkId)) return

    const link = document.createElement('link')
    link.id = fontLinkId
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap'
    document.head.appendChild(link)
  }, [])

  const linkStyle = (path) => {
    const isActive = location.pathname === path
    return {
      fontFamily: "'Inter', sans-serif",
      fontSize: '0.875rem',
      fontWeight: 500,
      color: isActive ? '#2563eb' : '#64748b',
      paddingBottom: '2px',
      borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
      transition: 'color 0.2s, border-color 0.2s',
      textDecoration: 'none',
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap');

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        .navbar-link:hover {
          color: #0f172a;
        }
      `}</style>

      <nav style={navStyle}>
        <div style={logoWrapStyle}>
          <div style={pulseStyle} />
          <Link to="/" style={logoTextStyle}>FairScan</Link>
        </div>

        <ul style={linksStyle}>
          <li>
            <Link className="navbar-link" to="/" style={linkStyle('/')}>Home</Link>
          </li>
          <li>
            <Link className="navbar-link" to="/analyze" style={linkStyle('/analyze')}>Analyze</Link>
          </li>
          <li>
            <Link className="navbar-link" to="/report" style={linkStyle('/report')}>Report</Link>
          </li>
          <li>
            <Link className="navbar-link" to="/jobposting" style={linkStyle('/jobposting')}>Job Scanner</Link>
          </li>
          <li>
            <Link className="navbar-link" to="/debias" style={linkStyle('/debias')}>Debias Model</Link>
          </li>
          <li>
            <Link className="navbar-link" to="/about" style={linkStyle('/about')}>About</Link>
          </li>
        </ul>
      </nav>
    </>
  )
}