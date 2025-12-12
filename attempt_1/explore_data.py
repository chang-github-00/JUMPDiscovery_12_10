import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import zscore
import warnings
warnings.filterwarnings('ignore')

# Load CRISPR data
print("Loading CRISPR data...")
crispr_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
print(f"CRISPR shape: {crispr_df.shape}")
print(f"CRISPR columns: {crispr_df.columns[:10].tolist()}")

# Load ORF data
print("\nLoading ORF data...")
orf_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')
print(f"ORF shape: {orf_df.shape}")

# Load similarity data
print("\nLoading similarity data...")
crispr_sim = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/JUMP_Similarity_Data/crispr_cosinesim_full.parquet')
print(f"CRISPR similarity shape: {crispr_sim.shape}")

# Check for negative controls
print("\nChecking for negative controls...")
negcon_crispr = crispr_df[crispr_df['Metadata_JCP2022'].str.contains('negcon', na=False)]
print(f"Negative controls in CRISPR: {len(negcon_crispr)}")

# Get unique perturbations
unique_perturbs = crispr_df['Metadata_JCP2022'].unique()
print(f"\nTotal unique perturbations: {len(unique_perturbs)}")

# Calculate variance for each perturbation (excluding negcon)
print("\nCalculating perturbation strengths...")
feature_cols = [col for col in crispr_df.columns if col.startswith('X_')]
print(f"Number of features: {len(feature_cols)}")

# Calculate mean profile for each perturbation
perturb_profiles = crispr_df.groupby('Metadata_JCP2022')[feature_cols].mean()

# Calculate distance from origin (strength of perturbation)
perturb_strength = np.sqrt((perturb_profiles ** 2).sum(axis=1))
perturb_strength = perturb_strength.sort_values(ascending=False)

# Filter out negcon
perturb_strength_filtered = perturb_strength[~perturb_strength.index.str.contains('negcon')]

print("\nTop 30 strongest perturbations:")
print(perturb_strength_filtered.head(30))

# Save for further analysis
perturb_strength_filtered.to_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/perturbation_strengths.csv')

# Look at similarity patterns - find perturbations with unusual similarity patterns
print("\nAnalyzing similarity patterns...")

# Get top 100 strongest perturbations
top_perturbs = perturb_strength_filtered.head(100).index.tolist()

# Filter similarity matrix
top_sim = crispr_sim.loc[top_perturbs, top_perturbs]

# Find perturbations with high average similarity to others (potential functional groups)
avg_sim = top_sim.mean(axis=1).sort_values(ascending=False)
print("\nPerturbations with highest average similarity to top 100:")
print(avg_sim.head(20))

# Find perturbations with low average similarity (unique phenotypes)
print("\nPerturbations with lowest average similarity (unique phenotypes):")
print(avg_sim.tail(20))

# Save
avg_sim.to_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/similarity_patterns.csv')

print("\nAnalysis complete!")
