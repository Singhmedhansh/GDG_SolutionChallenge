import pandas as pd
import numpy as np

np.random.seed(42)
n_samples = 2000

# Generate protected attributes
gender = np.random.choice(['Male', 'Female', 'Non-binary'], p=[0.55, 0.40, 0.05], size=n_samples)
age = np.random.choice(['Under-30', '30-45', 'Over-45'], p=[0.4, 0.4, 0.2], size=n_samples)
race = np.random.choice(['Majority', 'MinorityA', 'MinorityB'], p=[0.6, 0.25, 0.15], size=n_samples)

# Generate skill score (independent)
skill_score = np.random.normal(loc=70, scale=15, size=n_samples)
skill_score = np.clip(skill_score, 0, 100)

# Generate proxy columns
# Proxy 1: "zipcode" perfectly/strongly correlates with "race" (Categorical proxy for Cramers V)
zipcode = []
for r in race:
    if r == 'Majority':
        zipcode.append(np.random.choice(['10001', '10002'], p=[0.8, 0.2]))
    elif r == 'MinorityA':
        zipcode.append(np.random.choice(['10003', '10004'], p=[0.9, 0.1]))
    else:
        zipcode.append(np.random.choice(['10005', '10001'], p=[0.8, 0.2]))

# Proxy 2: "years_of_experience" strongly correlates with "age" (Numerical proxy for Pearson)
years_of_experience = []
for a in age:
    if a == 'Under-30':
        years_of_experience.append(max(0, int(np.random.normal(2, 1))))
    elif a == '30-45':
        years_of_experience.append(max(4, int(np.random.normal(8, 3))))
    else:
        years_of_experience.append(max(10, int(np.random.normal(18, 5))))

# Calculate decision ('hired') with explicit bias
# Bias formula: Base probability + skill + gender bias + age bias
prob = (skill_score / 100.0) * 0.4

# Bias 1: Gender (Male favored)
prob += np.where(gender == 'Male', 0.25, 0)
prob += np.where(gender == 'Female', 0.05, 0)
prob += np.where(gender == 'Non-binary', 0.0, 0)

# Bias 2: Age (Young favored)
prob += np.where(age == 'Under-30', 0.2, 0)
prob += np.where(age == '30-45', 0.1, 0)
prob += np.where(age == 'Over-45', -0.1, 0)

# Bias 3: Race indirectly via zipcode
prob += np.where(np.array(zipcode) == '10001', 0.15, 0)
prob += np.where(np.array(zipcode) == '10003', -0.1, 0)

# Add some randomness
prob += np.random.normal(0, 0.1, size=n_samples)
prob = np.clip(prob, 0, 1)

# Convert to binary decision
hired = np.where(prob > 0.5, 1, 0)

# Build DataFrame
df = pd.DataFrame({
    'candidate_id': range(1, n_samples + 1),
    'gender': gender,
    'age': age,
    'race': race,
    'skill_score': skill_score.astype(int),
    'years_of_experience': years_of_experience,
    'zipcode': zipcode,
    'hired': hired
})

# Save to CSV
df.to_csv('d:/fairscan/rigorous_test.csv', index=False)
print("Saved rigorous_test.csv with 2000 rows.")
