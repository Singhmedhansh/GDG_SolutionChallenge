import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ResultsProvider } from './context/ResultsContext'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import ReportPage from './pages/ReportPage'
import ReportComparisonPage from './pages/ReportComparisonPage'
import AboutPage from './pages/AboutPage'
import JobPostingPage from './pages/JobPostingPage'
import DebiasPage from './pages/DebiasPage'
import { AlertCircle } from 'lucide-react'

function NotFoundPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontFamily: "'Inter', sans-serif"
    }}>
      <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
      <h1 style={{ margin: '0 0 8px', fontSize: '2rem' }}>404 - Page Not Found</h1>
      <p style={{ margin: '0 0 24px', color: '#64748b' }}>The page you are looking for does not exist.</p>
      <Link to="/" style={{
        background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '10px 20px',
        borderRadius: 8, fontWeight: 600
      }}>
        Return Home
      </Link>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyze" element={<AnalysisPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/report/comparison" element={<ReportComparisonPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/jobposting" element={<JobPostingPage />} />
          <Route path="/debias" element={<DebiasPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ResultsProvider>
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
          <Navbar />
          <AnimatedRoutes />
        </div>
      </ResultsProvider>
    </BrowserRouter>
  )
}

export default App