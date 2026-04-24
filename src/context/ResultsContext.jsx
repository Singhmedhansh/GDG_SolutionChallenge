import { createContext, useContext, useState } from 'react'

const ResultsContext = createContext(null)

export function ResultsProvider({ children }) {
  const [results, setResults] = useState(null)
  const [debiasedResults, setDebiasedResults] = useState(null)
  const [datasetFile, setDatasetFile] = useState(null)

  return (
    <ResultsContext.Provider
      value={{
        results,
        setResults,
        debiasedResults,
        setDebiasedResults,
        datasetFile,
        setDatasetFile,
      }}
    >
      {children}
    </ResultsContext.Provider>
  )
}

export function useResults() {
  return useContext(ResultsContext)
}
