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

# Find HSPA5 JCP ID
hspa5_jcp = 'JCP2022_803268'
print(f"\nHSPA5 (BiP/GRP78) JCP ID: {hspa5_jcp}")

# Get HSPA5 data
hspa5_crispr = crispr_df[crispr_df['Metadata_JCP2022'] == hspa5_jcp]
hspa5_crispr_interp = crispr_interp[crispr_interp['Metadata_JCP2022'] == hspa5_jcp]

print(f"HSPA5 CRISPR wells: {len(hspa5_crispr)}")
print(f"Plates: {hspa5_crispr['Metadata_Plate'].unique()}")
print(f"Wells: {hspa5_crispr['Metadata_Well'].unique()}")

# Check if HSPA5 is in ORF
# First, let's search for HSPA5 in ORF by looking at all JCP IDs
print("\nSearching for HSPA5 in ORF dataset...")
# We need to map ORF JCP IDs to genes
# For now, let's focus on CRISPR

# Get feature columns
feature_cols = [col for col in crispr_df.columns if col.startswith('X_')]
interp_cols = [col for col in crispr_interp.columns if not col.startswith('Metadata_')]

# Calculate mean features for HSPA5
hspa5_mean = hspa5_crispr[feature_cols].mean()
hspa5_interp_mean = hspa5_crispr_interp[interp_cols].mean()

# Get all perturbations as background
all_means = crispr_df.groupby('Metadata_JCP2022')[feature_cols].mean()

# Calculate z-scores for HSPA5
hspa5_zscores = (hspa5_mean - all_means.mean()) / all_means.std()

# Find top changed features
top_features = hspa5_zscores.abs().sort_values(ascending=False).head(30)
print("\nTop 30 most changed features (z-scores):")
for feat, zscore in top_features.items():
    actual_zscore = hspa5_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

# Analyze interpretable features
print("\n" + "="*80)
print("INTERPRETABLE FEATURES ANALYSIS")
print("="*80)

# Get all interpretable features means
all_interp_means = crispr_interp.groupby('Metadata_JCP2022')[interp_cols].mean()

# Calculate z-scores for interpretable features
hspa5_interp_zscores = (hspa5_interp_mean - all_interp_means.mean()) / all_interp_means.std()

# Find features related to specific organelles
mito_features = [col for col in interp_cols if 'Mito' in col]
er_features = [col for col in interp_cols if 'ER' in col]
dna_features = [col for col in interp_cols if 'Nuclei' in col or 'DNA' in col]
cell_features = [col for col in interp_cols if 'Cells_' in col and 'Mito' not in col and 'ER' not in col]
agp_features = [col for col in interp_cols if 'AGP' in col]
rna_features = [col for col in interp_cols if 'RNA' in col]

print(f"\nMitochondria features: {len(mito_features)}")
print(f"ER features: {len(er_features)}")
print(f"DNA/Nuclei features: {len(dna_features)}")
print(f"Cell features: {len(cell_features)}")
print(f"AGP (cytoskeleton) features: {len(agp_features)}")
print(f"RNA features: {len(rna_features)}")

# Top changed features by organelle
print("\nTop 15 Mitochondria features:")
mito_zscores = hspa5_interp_zscores[mito_features].abs().sort_values(ascending=False).head(15)
for feat, zscore in mito_zscores.items():
    actual_zscore = hspa5_interp_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

print("\nTop 15 ER features:")
er_zscores = hspa5_interp_zscores[er_features].abs().sort_values(ascending=False).head(15)
for feat, zscore in er_zscores.items():
    actual_zscore = hspa5_interp_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

print("\nTop 15 Cell features:")
cell_zscores = hspa5_interp_zscores[cell_features].abs().sort_values(ascending=False).head(15)
for feat, zscore in cell_zscores.items():
    actual_zscore = hspa5_interp_zscores[feat]
    print(f"  {feat}: z={actual_zscore:.2f}")

# Look for specific phenotypes
print("\n" + "="*80)
print("SPECIFIC PHENOTYPE ANALYSIS")
print("="*80)

# Cell death indicators
cell_count_features = [col for col in interp_cols if 'Count' in col and 'Cells_' in col]
cell_area_features = [col for col in interp_cols if 'AreaShape_Area' in col and 'Cells_' in col]
cell_form_features = [col for col in interp_cols if 'FormFactor' in col and 'Cells_' in col]

print("\nCell count/density features:")
for feat in cell_count_features[:5]:
    if feat in hspa5_interp_zscores.index:
        print(f"  {feat}: z={hspa5_interp_zscores[feat]:.2f}")

print("\nCell area features:")
for feat in cell_area_features[:5]:
    if feat in hspa5_interp_zscores.index:
        print(f"  {feat}: z={hspa5_interp_zscores[feat]:.2f}")

print("\nCell form factor (roundness) features:")
for feat in cell_form_features[:5]:
    if feat in hspa5_interp_zscores.index:
        print(f"  {feat}: z={hspa5_interp_zscores[feat]:.2f}")

# ER stress indicators
er_intensity_features = [col for col in interp_cols if 'Intensity_' in col and 'ER' in col and 'Mean' in col]
er_texture_features = [col for col in interp_cols if 'Texture_' in col and 'ER' in col]

print("\nER intensity features:")
for feat in er_intensity_features[:10]:
    if feat in hspa5_interp_zscores.index:
        print(f"  {feat}: z={hspa5_interp_zscores[feat]:.2f}")

# Save HSPA5 analysis
analysis_results = {
    'gene': 'HSPA5',
    'jcp_id': hspa5_jcp,
    'n_wells_crispr': len(hspa5_crispr),
    'plates': hspa5_crispr['Metadata_Plate'].unique().tolist(),
    'wells': hspa5_crispr['Metadata_Well'].unique().tolist(),
    'top_mito_features': {feat: float(hspa5_interp_zscores[feat]) for feat in mito_zscores.index},
    'top_er_features': {feat: float(hspa5_interp_zscores[feat]) for feat in er_zscores.index},
    'top_cell_features': {feat: float(hspa5_interp_zscores[feat]) for feat in cell_zscores.index}
}

with open('hspa5_analysis.json', 'w') as f:
    json.dump(analysis_results, f, indent=2)

print("\nAnalysis saved to hspa5_analysis.json")

# Load similarity data
print("\n" + "="*80)
print("SIMILARITY ANALYSIS")
print("="*80)

crispr_sim = pd.read_parquet('JUMP_Similarity_Data/crispr_cosinesim_full.parquet')

# Find HSPA5 similarities
if hspa5_jcp in crispr_sim.index:
    hspa5_similarities = crispr_sim.loc[hspa5_jcp].sort_values(ascending=False)
    # Exclude self
    hspa5_similarities = hspa5_similarities[hspa5_similarities.index != hspa5_jcp]
    
    print(f"\nTop 30 most similar perturbations to HSPA5:")
    print(hspa5_similarities.head(30))
    
    # Save top similar JCP IDs
    top_similar_jcps = hspa5_similarities.head(50).index.tolist()
    with open('hspa5_similar_jcps.txt', 'w') as f:
        for jcp in top_similar_jcps:
            f.write(f"{jcp}\n")
    
    print("\nSaved top 50 similar JCP IDs to hspa5_similar_jcps.txt")
else:
    print(f"HSPA5 JCP ID {hspa5_jcp} not found in similarity matrix")

print("\nHSPA5 analysis complete!")
