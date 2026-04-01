export const mockResults = {
  fairnessScore: 42,
  status: "biased",
  decisionColumn: "hired",
  protectedAttributes: [
    {
      attribute: "gender",
      groupStats: [
        { group: "Male", approvalRate: 78 },
        { group: "Female", approvalRate: 41 },
      ],
      biasDetected: true,
      metric: "Demographic Parity Difference: 0.37"
    },
    {
      attribute: "age",
      groupStats: [
        { group: "Under 35", approvalRate: 74 },
        { group: "Over 35", approvalRate: 52 },
      ],
      biasDetected: true,
      metric: "Demographic Parity Difference: 0.22"
    }
  ],
  flaggedProxies: ["zipcode", "university_tier"],
  recommendations: [
    "Remove or re-weight the 'zipcode' column — it correlates strongly with gender in this dataset.",
    "Apply fairness constraints during model retraining to enforce demographic parity.",
    "Collect more balanced training samples across gender and age groups."
  ]
};
