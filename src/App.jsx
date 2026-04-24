import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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