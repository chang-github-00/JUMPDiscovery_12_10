import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.spatial.distance import pdist, squareform
from scipy.stats import zscore
import warnings
warnings.filterwarnings('ignore')

# Load batch-corrected CRISPR data
print("Loading CRISPR data...")
crispr_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
print(f"CRISPR shape: {crispr_df.shape}")
print(f"Columns: {crispr_df.columns[:10].tolist()}...")

# Load ORF data
print("\nLoading ORF data...")
orf_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')
print(f"ORF shape: {orf_df.shape}")

# Check metadata columns
print("\nMetadata columns:")
metadata_cols = [col for col in crispr_df.columns if col.startswith('Metadata_')]
print(metadata_cols)

# Get feature columns
feature_cols_crispr = [col for col in crispr_df.columns if col.startswith('X_')]
feature_cols_orf = [col for col in orf_df.columns if col.startswith('X_')]
print(f"\nCRISPR features: {len(feature_cols_crispr)}")
print(f"ORF features: {len(feature_cols_orf)}")

# Aggregate by perturbation (JCP2022 ID)
print("\nAggregating by perturbation...")
crispr_agg = crispr_df.groupby('Metadata_JCP2022')[feature_cols_crispr].mean()
orf_agg = orf_df.groupby('Metadata_JCP2022')[feature_cols_orf].mean()

print(f"Unique CRISPR perturbations: {len(crispr_agg)}")
print(f"Unique ORF perturbations: {len(orf_agg)}")

# Calculate magnitude of perturbation effect (L2 norm from origin)
print("\nCalculating perturbation magnitudes...")
crispr_agg['magnitude'] = np.sqrt((crispr_agg[feature_cols_crispr]**2).sum(axis=1))
orf_agg['magnitude'] = np.sqrt((orf_agg[feature_cols_orf]**2).sum(axis=1))

# Get top perturbations by magnitude
top_crispr = crispr_agg.nlargest(50, 'magnitude')
top_orf = orf_agg.nlargest(50, 'magnitude')

print("\nTop 30 CRISPR perturbations by magnitude:")
print(top_crispr['magnitude'].head(30))

print("\nTop 30 ORF perturbations by magnitude:")
print(top_orf['magnitude'].head(30))

# Save for later use
top_crispr.to_csv('top_crispr_perturbations.csv')
top_orf.to_csv('top_orf_perturbations.csv')

print("\nSaved top perturbations to CSV files")
