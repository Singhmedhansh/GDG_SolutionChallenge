export const mockResults = {
  fairnessScore: 42,
  status: 'biased',
  decisionColumn: 'hired',
  datasetInfo: {
    fileName: 'demo_hiring.csv',
    totalRows: 1200,
    totalColumns: 8,
    scannedAt: '2026-04-03T10:30:00Z',
  },
  overallSummary:
    'This hiring dataset shows significant bias against female candidates and older applicants. ' +
    'Male candidates are approved at nearly double the rate of female candidates (78% vs 41%), ' +
    'which constitutes a severe Demographic Parity violation. Age discrimination is also present — ' +
    'candidates under 35 are approved at a 74% rate vs 52% for those over 35. ' +
    'The columns "zipcode" and "university_tier" appear to be acting as proxies for protected attributes. ' +
    'Immediate action is recommended before using this dataset to train any hiring model.',
  protectedAttributes: [
    {
      attribute: 'gender',
      groupStats: [
        { group: 'Male', approvalRate: 78 },
        { group: 'Female', approvalRate: 41 },
      ],
      biasDetected: true,
      metric: 'Demographic Parity Difference: 0.37',
      severity: 'high',
      topInfluencingFactors: [
        { feature: 'zipcode', influence: 0.62 },
        { feature: 'years_experience', influence: 0.45 },
        { feature: 'university_tier', influence: 0.38 },
      ],
      groupDetails: [
        { group: 'Male', total: 720, approved: 562, rejected: 158, rate: 78 },
        { group: 'Female', total: 480, approved: 197, rejected: 283, rate: 41 },
      ],
    },
    {
      attribute: 'age',
      groupStats: [
        { group: 'Under 35', approvalRate: 74 },
        { group: 'Over 35', approvalRate: 52 },
      ],
      biasDetected: true,
      metric: 'Demographic Parity Difference: 0.22',
      severity: 'medium',
      topInfluencingFactors: [
        { feature: 'years_experience', influence: 0.55 },
        { feature: 'university_tier', influence: 0.29 },
        { feature: 'zipcode', influence: 0.21 },
      ],
      groupDetails: [
        { group: 'Under 35', total: 680, approved: 503, rejected: 177, rate: 74 },
        { group: 'Over 35', total: 520, approved: 270, rejected: 250, rate: 52 },
      ],
    },
    {
      attribute: 'race',
      groupStats: [
        { group: 'Group A', approvalRate: 71 },
        { group: 'Group B', approvalRate: 69 },
      ],
      biasDetected: false,
      metric: 'Demographic Parity Difference: 0.02',
      severity: 'none',
      topInfluencingFactors: [],
      groupDetails: [
        { group: 'Group A', total: 600, approved: 426, rejected: 174, rate: 71 },
        { group: 'Group B', total: 600, approved: 414, rejected: 186, rate: 69 },
      ],
    },
  ],
  attributeExplanations: {
    gender:
      'Female candidates are hired at a rate 37 percentage points lower than male candidates. ' +
      'This is among the most severe gender gaps seen in hiring datasets and likely reflects historical ' +
      'patterns in the training data rather than genuine performance differences.',
    age:
      'There is a statistically significant 22 percentage point gap between approval rates for candidates ' +
      'under 35 (74%) and those over 35 (52%). This may reflect implicit ageism in the hiring pipeline ' +
      'or correlation with experience metrics that disadvantage older workers.',
    race:
      'No significant racial bias was detected. Both groups show nearly identical approval rates (71% and 69%), ' +
      'with a Demographic Parity Difference of only 0.02 — well below the 0.10 threshold.',
  },
  flaggedProxies: ['zipcode', 'university_tier'],
  recommendations: [
    "Remove or re-weight the 'zipcode' column — it correlates strongly with gender (r=0.62) in this dataset and acts as a hidden proxy variable.",
    "Audit the 'university_tier' field for geographic and socioeconomic bias before including it as a feature in any hiring model.",
    'Apply fairness constraints during model retraining to enforce Demographic Parity across all protected groups.',
    'Collect more balanced training samples across gender and age groups to reduce the class imbalance driving these disparities.',
    'Consider using a fairness-aware algorithm such as adversarial debiasing or reweighing for future model versions.',
  ],
}