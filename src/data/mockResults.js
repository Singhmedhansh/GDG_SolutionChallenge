export const mockResults = {
  fairnessScore: 42,
  status: "biased",
  decisionColumn: "hired",
  datasetInfo: {
    fileName: "hiring_data_2024.csv",
    totalRows: 1200,
    totalColumns: 8,
    scannedAt: "2026-04-03T10:30:00Z"
  },
  protectedAttributes: [
    {
      attribute: "gender",
      groupStats: [
        { group: "Male", approvalRate: 78 },
        { group: "Female", approvalRate: 41 },
      ],
      biasDetected: true,
      metric: "Demographic Parity Difference: 0.37",
      severity: "high"
    },
    {
      attribute: "age",
      groupStats: [
        { group: "Under 35", approvalRate: 74 },
        { group: "Over 35", approvalRate: 52 },
      ],
      biasDetected: true,
      metric: "Demographic Parity Difference: 0.22",
      severity: "medium"
    },
    {
      attribute: "race",
      groupStats: [
        { group: "Group A", approvalRate: 71 },
        { group: "Group B", approvalRate: 69 },
      ],
      biasDetected: false,
      metric: "Demographic Parity Difference: 0.02",
      severity: "none"
    }
  ],
  flaggedProxies: ["zipcode", "university_tier"],
  recommendations: [
    "Remove or re-weight the 'zipcode' column — it correlates strongly with gender in this dataset.",
    "Apply fairness constraints during model retraining to enforce demographic parity.",
    "Collect more balanced training samples across gender and age groups.",
    "Consider using a fairness-aware algorithm such as adversarial debiasing for future model versions."
  ]
}