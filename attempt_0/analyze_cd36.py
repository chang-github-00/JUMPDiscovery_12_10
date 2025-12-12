import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import json

# Load CRISPR data
print("Loading CRISPR data...")
crispr_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
crispr_interp = pd.read_parquet('Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_crispr.parquet')

# Load ORF data
orf_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')
orf_interp = pd.read_parquet('Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_orf.parquet')

# Find CD36 JCP ID
cd36_jcp = 'JCP2022_801155'
print(f"\nCD36 JCP ID: {cd36_jcp}")

# Get CD36 data
cd36_crispr = crispr_df[crispr_df['Metadata_JCP2022'] == cd36_jcp]
cd36_crispr_interp = crispr_interp[crispr_interp['Metadata_JCP2022'] == cd36_jcp]

print(f"CD36 CRISPR wells: {len(cd36_crispr)}")
print(f"Plates: {cd36_crispr['Metadata_Plate'].unique()}")
print(f"Wells: {cd36_crispr['Metadata_Well'].unique()}")

# Check if CD36 is in ORF
cd36_orf = orf_df[orf_df['Metadata_JCP2022'] == cd36_jcp]
print(f"\nCD36 ORF wells: {len(cd36_orf)}")

# Get feature columns
feature_cols = [col for col in crispr_df.columns if col.startswith('X_')]
interp_cols = [col for col in crispr_interp.columns if not col.startswith('Metadata_')]

# Calculate mean features for CD36
cd36_mean = cd36_crispr[feature_cols].mean()
cd36_interp_mean = cd36_crispr_interp[interp_cols].mean()

# Get negative controls (assuming they have specific JCP IDs or can be identified)
# For now, let's use all perturbations as background and identify outliers
all_means = crispr_df.groupby('Metadata_JCP2022')[feature_cols].mean()

# Calculate z-scores for CD36
cd36_zscores = (cd36_mean - all_means.mean()) / all_means.std()

# Find top changed features
top_features = cd36_zscores.abs().sort_values(ascending=False).head(20)
print("\nTop 20 most changed features (z-scores):")
print(top_features)

# Analyze interpretable features
print("\n" + "="*80)
print("INTERPRETABLE FEATURES ANALYSIS")
print("="*80)

# Get all interpretable features means
all_interp_means = crispr_interp.groupby('Metadata_JCP2022')[interp_cols].mean()

# Calculate z-scores for interpretable features
cd36_interp_zscores = (cd36_interp_mean - all_interp_means.mean()) / all_interp_means.std()

# Find features related to specific organelles
mito_features = [col for col in interp_cols if 'Mito' in col]
er_features = [col for col in interp_cols if 'ER' in col]
dna_features = [col for col in interp_cols if 'Nuclei' in col or 'DNA' in col]
cell_features = [col for col in interp_cols if 'Cells_' in col and 'Mito' not in col and 'ER' not in col]

print(f"\nMitochondria features: {len(mito_features)}")
print(f"ER features: {len(er_features)}")
print(f"DNA/Nuclei features: {len(dna_features)}")
print(f"Cell features: {len(cell_features)}")

# Top changed features by organelle
print("\nTop 10 Mitochondria features:")
mito_zscores = cd36_interp_zscores[mito_features].abs().sort_values(ascending=False).head(10)
for feat, zscore in mito_zscores.items():
    actual_zscore = cd36_interp_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

print("\nTop 10 ER features:")
er_zscores = cd36_interp_zscores[er_features].abs().sort_values(ascending=False).head(10)
for feat, zscore in er_zscores.items():
    actual_zscore = cd36_interp_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

print("\nTop 10 Cell features:")
cell_zscores = cd36_interp_zscores[cell_features].abs().sort_values(ascending=False).head(10)
for feat, zscore in cell_zscores.items():
    actual_zscore = cd36_interp_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

# Save CD36 analysis
analysis_results = {
    'gene': 'CD36',
    'jcp_id': cd36_jcp,
    'n_wells_crispr': len(cd36_crispr),
    'n_wells_orf': len(cd36_orf),
    'plates': cd36_crispr['Metadata_Plate'].unique().tolist(),
    'wells': cd36_crispr['Metadata_Well'].unique().tolist(),
    'top_mito_features': {feat: float(cd36_interp_zscores[feat]) for feat in mito_zscores.index},
    'top_er_features': {feat: float(cd36_interp_zscores[feat]) for feat in er_zscores.index},
    'top_cell_features': {feat: float(cd36_interp_zscores[feat]) for feat in cell_zscores.index}
}

with open('cd36_analysis.json', 'w') as f:
    json.dump(analysis_results, f, indent=2)

print("\nAnalysis saved to cd36_analysis.json")

# Load similarity data
print("\n" + "="*80)
print("SIMILARITY ANALYSIS")
print("="*80)

crispr_sim = pd.read_parquet('JUMP_Similarity_Data/crispr_cosinesim_full.parquet')

# Find CD36 similarities
if cd36_jcp in crispr_sim.index:
    cd36_similarities = crispr_sim.loc[cd36_jcp].sort_values(ascending=False)
    # Exclude self
    cd36_similarities = cd36_similarities[cd36_similarities.index != cd36_jcp]
    
    print(f"\nTop 20 most similar perturbations to CD36:")
    print(cd36_similarities.head(20))
    
    # Save top similar JCP IDs
    top_similar_jcps = cd36_similarities.head(30).index.tolist()
    with open('cd36_similar_jcps.txt', 'w') as f:
        for jcp in top_similar_jcps:
            f.write(f"{jcp}\n")
    
    print("\nSaved top 30 similar JCP IDs to cd36_similar_jcps.txt")

print("\nCD36 analysis complete!")
