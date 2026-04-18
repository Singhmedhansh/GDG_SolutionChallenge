import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { getCoreRowModel, flexRender, useReactTable } from '@tanstack/react-table'
import Select from 'react-select'
import Papa from 'papaparse'
import { AnimatePresence, motion } from 'framer-motion'
import { Upload, FileText, ChevronRight, AlertCircle, CheckCircle2, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { analyzeDataset } from '../services/api'
import { useResults } from '../context/ResultsContext'

const bg = '#f8fafc'
const card = '#ffffff'
const border = '#e2e8f0'
const blue = '#2563eb'
const blueBg = '#eff6ff'
const blueBorder = '#bfdbfe'
const textHead = '#0f172a'
const textMuted = '#64748b'
const danger = '#ef4444'
const success = '#10b981'
const fontInter = `'Inter', sans-serif`
const fontMono = `'IBM Plex Mono', monospace`
const spring = { type: 'spring', stiffness: 100, damping: 20 }

const stepLabels = ['Upload File', 'Configure', 'Run Scan']

function formatFileSize(size) {
  if (!size) return '0 KB'
  return `${Math.max(size / 1024, 0.1).toFixed(size < 1024 ? 1 : 0)} KB`
}

function makeTableColumns(columnNames) {
  return columnNames.map((columnName) => ({
    accessorKey: columnName,
    header: columnName,
    cell: (info) => info.getValue() ?? '—',
  }))
}

function StepIndicator({ currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1
        const isActive = currentStep === stepNumber
        const isCompleted = currentStep > stepNumber

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: fontMono,
                fontSize: '0.72rem', fontWeight: 600,
                background: isCompleted ? success : isActive ? blue : '#e2e8f0',
                color: isCompleted || isActive ? '#ffffff' : textMuted,
                transition: 'all 0.2s ease'
              }}>
                {isCompleted ? <CheckCircle2 size={16} /> : stepNumber}
              </div>
              <span style={{
                fontFamily: fontMono, fontSize: '0.72rem',
                color: isActive ? blue : isCompleted ? textMuted : '#94a3b8',
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap'
              }}>
                {stepNumber}. {label}
              </span>
            </div>
            {index < stepLabels.length - 1 && (
              <div style={{
                width: 40, height: 1, background: currentStep > stepNumber ? blue : '#cbd5e1',
                margin: '0 12px'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AnalysisPage() {
  const navigate = useNavigate()
  const { setResults } = useResults()
  const [currentStep, setCurrentStep] = useState(1)
  const [file, setFile] = useState(null)
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [decisionColumn, setDecisionColumn] = useState(null)
  const [protectedAttributes, setProtectedAttributes] = useState([])
  const [isScanning, setIsScanning] = useState(false)

  const tableColumns = useMemo(() => makeTableColumns(columns), [columns])
  const previewRows = useMemo(() => rows.slice(0, 5), [rows])

  const table = useReactTable({
    data: previewRows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = Array.isArray(results.data) ? results.data : []
        const parsedColumns = results.meta?.fields?.filter(Boolean) ?? []
        const finalColumns = parsedColumns.length > 0 ? parsedColumns : Object.keys(parsedRows[0] ?? {})

        if (!finalColumns.length || !parsedRows.length) {
          toast.error('The CSV file is empty or missing headers.')
          return
        }

        setFile(selectedFile)
        setColumns(finalColumns)
        setRows(parsedRows)
        setDecisionColumn(null)
        setProtectedAttributes([])
        setCurrentStep(2)
        toast.success('File parsed successfully!')
      },
      error: () => {
        toast.error('Unable to parse this CSV file.')
      },
    })
  }, [])

  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles.length) return
    handleFile(acceptedFiles[0])
  }, [handleFile])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const decisionOptions = useMemo(
    () => columns.map((column) => ({ value: column, label: column })),
    [columns],
  )

  const protectedOptions = useMemo(
    () => columns
      .filter((column) => column !== decisionColumn)
      .map((column) => ({ value: column, label: column })),
    [columns, decisionColumn],
  )

  const decisionSelectValue = useMemo(
    () => decisionOptions.find((option) => option.value === decisionColumn) ?? null,
    [decisionOptions, decisionColumn],
  )

  const protectedSelectValue = useMemo(
    () => protectedOptions.filter((option) => protectedAttributes.includes(option.value)),
    [protectedOptions, protectedAttributes],
  )

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 44,
      borderRadius: 8,
      borderColor: state.isFocused ? blueBorder : border,
      boxShadow: state.isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
      '&:hover': {
        borderColor: blueBorder,
      },
      fontFamily: fontInter,
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: border }),
    menu: (base) => ({ ...base, borderRadius: 8, overflow: 'hidden', zIndex: 20 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? blue : state.isFocused ? blueBg : '#ffffff',
      color: state.isSelected ? '#ffffff' : textHead,
      fontFamily: fontInter,
    }),
    multiValue: (base) => ({ ...base, backgroundColor: blueBg, borderRadius: 999 }),
    multiValueLabel: (base) => ({ ...base, color: blue, fontFamily: fontMono, fontSize: '0.72rem' }),
    multiValueRemove: (base) => ({ ...base, color: blue, ':hover': { backgroundColor: blue, color: '#ffffff' } }),
    singleValue: (base) => ({ ...base, fontFamily: fontInter, color: textHead }),
    valueContainer: (base) => ({ ...base, padding: '2px 12px' }),
  }

  const runScan = async () => {
    if (!decisionColumn) {
      toast.error('Select a decision column before running the scan.')
      return
    }

    setIsScanning(true)
    const toastId = toast.loading('Running bias analysis...')

    try {
      const data = await analyzeDataset(file, decisionColumn, protectedAttributes)
      setResults(data)
      toast.success('Analysis complete!', { id: toastId })
      navigate('/report')
    } catch (err) {
      console.error('Scan failed:', err)
      // Backend might be down — store null and navigate with mock data
      toast.error(
        `Backend error: ${err.message || 'Could not connect to server'}. Showing demo results.`,
        { id: toastId, duration: 4000 },
      )
      setResults(null) // ReportPage will fall back to mockResults
      setTimeout(() => navigate('/report'), 1500)
    } finally {
      setIsScanning(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setColumns([])
    setRows([])
    setDecisionColumn(null)
    setProtectedAttributes([])
    setCurrentStep(1)
  }

  const dropzoneState = file ? 'uploaded' : isDragActive ? 'drag' : 'default'

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: bg, fontFamily: fontInter, color: textHead }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600;700;800&display=swap');
        body { background: ${bg}; }
        * { box-sizing: border-box; }
        @keyframes scanSpin { to { transform: rotate(360deg); } }
      `}</style>

      <Toaster position="top-right" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          style={{ marginBottom: 24 }}
        >
          <div style={{
            fontFamily: fontMono,
            fontSize: '0.72rem',
            color: '#94a3b8',
            marginBottom: 12,
          }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                fontFamily: fontMono,
                fontSize: '0.72rem',
                color: '#94a3b8',
              }}
            >
              Home
            </button>
            <span> / Analyze</span>
          </div>

          <h1 style={{ fontSize: '2rem', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0, color: textHead, fontWeight: 800 }}>
            Analyze Dataset
          </h1>
          <p style={{ margin: '10px 0 0', color: textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
            Upload a CSV hiring dataset to scan for hidden bias.
          </p>

          <div style={{ marginTop: 24, borderBottom: `1px solid ${border}` }} />
        </motion.div>

        <div style={{ marginBottom: 24 }}>
          <StepIndicator currentStep={currentStep} />
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={spring}
              style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div
                {...getRootProps()}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  border: dropzoneState === 'drag'
                    ? `2px dashed ${blue}`
                    : dropzoneState === 'uploaded'
                      ? `2px solid ${success}`
                      : `2px dashed ${border}`,
                  background: dropzoneState === 'drag'
                    ? blueBg
                    : dropzoneState === 'uploaded'
                      ? '#f0fdf4'
                      : bg,
                  padding: '60px 40px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <input {...getInputProps()} />

                {dropzoneState === 'uploaded' && (
                  <button
                    type="button"
                    onClick={clearFile}
                    aria-label="Remove file"
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: `1px solid ${blueBorder}`,
                      background: '#ffffff',
                      color: danger,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}

                {dropzoneState === 'drag' ? (
                  <div style={{ color: blue, fontFamily: fontInter, fontWeight: 600, fontSize: '1.05rem' }}>
                    Release to upload
                  </div>
                ) : dropzoneState === 'uploaded' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={48} color={success} />
                    <div style={{ fontFamily: fontInter, fontWeight: 600, fontSize: '1.05rem', color: textHead }}>
                      {file?.name}
                    </div>
                    <div style={{ fontFamily: fontInter, fontSize: '0.875rem', color: textMuted }}>
                      {formatFileSize(file?.size)}
                    </div>
                    <div style={{
                      fontFamily: fontMono,
                      fontSize: '0.65rem',
                      color: success,
                      background: '#ecfdf5',
                      border: `1px solid #bbf7d0`,
                      borderRadius: 999,
                      padding: '4px 10px',
                    }}>
                      CSV uploaded successfully
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Upload size={48} color="#94a3b8" />
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: textHead }}>
                      Drop your CSV file here
                    </div>
                    <div style={{ fontSize: '0.875rem', color: textMuted }}>
                      or click to browse files
                    </div>
                    <button
                      type="button"
                      onClick={open}
                      style={{
                        marginTop: 10,
                        border: `1px solid ${border}`,
                        background: '#ffffff',
                        color: textHead,
                        borderRadius: 8,
                        padding: '10px 18px',
                        fontFamily: fontInter,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Browse files
                    </button>
                    <div style={{
                      fontFamily: fontMono,
                      fontSize: '0.65rem',
                      color: '#64748b',
                      background: '#ffffff',
                      border: `1px solid ${border}`,
                      borderRadius: 999,
                      padding: '4px 10px',
                    }}>
                      Accepts .csv files only
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={spring}
              style={{ display: 'grid', gap: 20 }}
            >
              <div style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  fontFamily: fontMono,
                  fontSize: '0.65rem',
                  color: '#94a3b8',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}>
                  Data Preview
                </div>

                <div style={{ overflowX: 'auto', maxHeight: 280, border: `1px solid ${border}`, borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff' }}>
                    <thead style={{ position: 'sticky', top: 0, background: bg, zIndex: 1 }}>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              style={{
                                fontFamily: fontMono,
                                fontSize: '0.72rem',
                                color: textMuted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                textAlign: 'left',
                                padding: '10px 16px',
                                borderBottom: `1px solid ${border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row, rowIndex) => (
                        <tr key={row.id} style={{ background: rowIndex % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              style={{
                                fontFamily: fontInter,
                                fontSize: '0.875rem',
                                color: textHead,
                                padding: '10px 16px',
                                borderBottom: '1px solid #f1f5f9',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Decision Column
                </div>
                <p style={{ margin: '0 0 8px', color: textMuted, fontSize: '0.8rem', lineHeight: 1.6 }}>
                  Select the column that contains the hiring outcome, such as hired or approved.
                </p>
                <Select
                  options={decisionOptions}
                  value={decisionSelectValue}
                  onChange={(selected) => setDecisionColumn(selected?.value ?? null)}
                  placeholder="Select decision column..."
                  styles={selectStyles}
                />
              </div>

              <div style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontFamily: fontMono, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Protected Attributes
                </div>
                <p style={{ margin: '0 0 8px', color: textMuted, fontSize: '0.8rem', lineHeight: 1.6 }}>
                  Select columns that should not influence hiring decisions, such as gender, age, or race.
                </p>
                <Select
                  isMulti
                  options={protectedOptions}
                  value={protectedSelectValue}
                  onChange={(selected) => setProtectedAttributes((selected ?? []).map((item) => item.value))}
                  placeholder="Select protected attributes..."
                  styles={selectStyles}
                />
              </div>

              {decisionColumn && protectedAttributes.length > 0 && (
                <div style={{
                  background: blueBg,
                  border: `1px solid ${blueBorder}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  color: blue,
                  fontFamily: fontMono,
                  fontSize: '0.75rem',
                }}>
                  <div>✓ Decision: {decisionColumn}</div>
                  <div style={{ marginTop: 4 }}>✓ Protected: {protectedAttributes.join(', ')}</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: textMuted,
                    fontFamily: fontInter,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '10px 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  Back
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!decisionColumn}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    background: decisionColumn ? blue : '#93c5fd',
                    color: '#ffffff',
                    padding: '13px 22px',
                    fontFamily: fontInter,
                    fontWeight: 600,
                    cursor: decisionColumn ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  Continue to Scan <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={spring}
              style={{ display: 'grid', gap: 20 }}
            >
              <div style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 28,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: textHead, marginBottom: 20 }}>
                  Ready to Scan
                </div>

                <div style={{ display: 'grid', gap: 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${'#f1f5f9'}` }}>
                    <FileText size={16} color={blue} />
                    <div style={{ fontSize: '0.875rem', color: textHead }}>
                      Dataset: {file?.name ?? 'Selected CSV'}
                      <span style={{ color: textMuted }}> · {rows.length} rows, {columns.length} columns</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${'#f1f5f9'}` }}>
                    <CheckCircle2 size={16} color={blue} />
                    <div style={{ fontSize: '0.875rem', color: textHead }}>
                      Decision column: {decisionColumn ?? 'Not selected'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}>
                    <AlertCircle size={16} color={blue} />
                    <div style={{ fontSize: '0.875rem', color: textHead }}>
                      Protected attributes: {protectedAttributes.length ? protectedAttributes.join(', ') : 'None selected'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <motion.button
                  whileHover={isScanning ? undefined : { scale: 1.02 }}
                  whileTap={isScanning ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={runScan}
                  disabled={isScanning}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    background: isScanning ? '#1d4ed8' : blue,
                    color: '#ffffff',
                    padding: '16px 48px',
                    fontFamily: fontInter,
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 240,
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(37,99,235,0.18)',
                  }}
                >
                  {isScanning ? (
                    <>
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.45)',
                        borderTopColor: '#ffffff',
                        animation: 'scanSpin 1s linear infinite',
                        display: 'inline-block',
                      }} />
                      Analyzing dataset...
                    </>
                  ) : (
                    <>
                      Run Bias Scan <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: textMuted,
                    fontFamily: fontInter,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  Back to Configuration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}