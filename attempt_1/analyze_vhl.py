import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# VHL JCP ID
vhl_jcp = 'JCP2022_807648'

print("="*80)
print("VHL (Von Hippel-Lindau) Analysis")
print("="*80)

# Load CRISPR data
print("\nLoading CRISPR data...")
crispr_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')

# Load interpretable features
print("Loading interpretable CRISPR data...")
interp_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_crispr.parquet')

# Get VHL data
vhl_data = crispr_df[crispr_df['Metadata_JCP2022'] == vhl_jcp]
print(f"\nVHL wells: {len(vhl_data)}")
print(f"Plates: {vhl_data['Metadata_Plate'].unique()}")
print(f"Wells: {vhl_data['Metadata_Well'].unique()}")

# Get VHL interpretable features
vhl_interp = interp_df[interp_df['Metadata_JCP2022'] == vhl_jcp]
print(f"VHL interpretable wells: {len(vhl_interp)}")

# Calculate perturbation strength
feature_cols = [col for col in crispr_df.columns if col.startswith('X_')]
vhl_profile = vhl_data[feature_cols].mean()
vhl_strength = np.sqrt((vhl_profile ** 2).sum())
print(f"\nVHL perturbation strength: {vhl_strength:.2f}")

# Get rank
perturb_profiles = crispr_df.groupby('Metadata_JCP2022')[feature_cols].mean()
perturb_strength = np.sqrt((perturb_profiles ** 2).sum(axis=1))
perturb_strength_sorted = perturb_strength.sort_values(ascending=False)
vhl_rank = list(perturb_strength_sorted.index).index(vhl_jcp) + 1
print(f"VHL rank: {vhl_rank} out of {len(perturb_strength_sorted)}")

# Analyze interpretable features
print("\n" + "="*80)
print("Analyzing interpretable features...")
print("="*80)

# Get feature columns
interp_features = [col for col in interp_df.columns if not col.startswith('Metadata')]

# Calculate mean for VHL and all other perturbations (excluding negcon)
vhl_means = vhl_interp[interp_features].mean()

# Get non-VHL data (sample to make it manageable)
non_vhl = interp_df[interp_df['Metadata_JCP2022'] != vhl_jcp].sample(n=min(10000, len(interp_df)-len(vhl_interp)), random_state=42)
non_vhl_means = non_vhl[interp_features].mean()

# Calculate fold changes
fold_changes = vhl_means / non_vhl_means

# Get top changed features
top_increased = fold_changes.sort_values(ascending=False).head(30)
top_decreased = fold_changes.sort_values(ascending=True).head(30)

print("\nTop 30 increased features:")
for feat, fc in top_increased.items():
    print(f"  {feat}: {fc:.3f}x")

print("\nTop 30 decreased features:")
for feat, fc in top_decreased.items():
    print(f"  {feat}: {fc:.3f}x")

# Focus on key cellular components
print("\n" + "="*80)
print("Key cellular component analysis:")
print("="*80)

# Mitochondria
mito_features = [col for col in interp_features if 'Mito' in col and 'Intensity' in col]
if mito_features:
    vhl_mito = vhl_means[mito_features].mean()
    non_vhl_mito = non_vhl_means[mito_features].mean()
    print(f"\nMitochondria intensity: {vhl_mito/non_vhl_mito:.3f}x")

# ER
er_features = [col for col in interp_features if 'ER' in col and 'Intensity' in col]
if er_features:
    vhl_er = vhl_means[er_features].mean()
    non_vhl_er = non_vhl_means[er_features].mean()
    print(f"ER intensity: {vhl_er/non_vhl_er:.3f}x")

# DNA
dna_features = [col for col in interp_features if 'DNA' in col and 'Intensity' in col]
if dna_features:
    vhl_dna = vhl_means[dna_features].mean()
    non_vhl_dna = non_vhl_means[dna_features].mean()
    print(f"DNA intensity: {vhl_dna/non_vhl_dna:.3f}x")

# RNA
rna_features = [col for col in interp_features if 'RNA' in col and 'Intensity' in col]
if rna_features:
    vhl_rna = vhl_means[rna_features].mean()
    non_vhl_rna = non_vhl_means[rna_features].mean()
    print(f"RNA intensity: {vhl_rna/non_vhl_rna:.3f}x")

# AGP (Actin/Golgi/Plasma membrane)
agp_features = [col for col in interp_features if 'AGP' in col and 'Intensity' in col]
if agp_features:
    vhl_agp = vhl_means[agp_features].mean()
    non_vhl_agp = non_vhl_means[agp_features].mean()
    print(f"AGP intensity: {vhl_agp/non_vhl_agp:.3f}x")

# Cell size
cell_area_features = [col for col in interp_features if 'Cells_AreaShape_Area' == col]
if cell_area_features:
    vhl_area = vhl_means[cell_area_features[0]]
    non_vhl_area = non_vhl_means[cell_area_features[0]]
    print(f"Cell area: {vhl_area/non_vhl_area:.3f}x")

# Nuclei size
nuclei_area_features = [col for col in interp_features if 'Nuclei_AreaShape_Area' == col]
if nuclei_area_features:
    vhl_nuclei = vhl_means[nuclei_area_features[0]]
    non_vhl_nuclei = non_vhl_means[nuclei_area_features[0]]
    print(f"Nuclei area: {vhl_nuclei/non_vhl_nuclei:.3f}x")

# Cell count
cell_count_features = [col for col in interp_features if 'Count_Cells' in col]
if cell_count_features:
    vhl_count = vhl_means[cell_count_features[0]]
    non_vhl_count = non_vhl_means[cell_count_features[0]]
    print(f"Cell count: {vhl_count/non_vhl_count:.3f}x")

# Save results
results = {
    'gene': 'VHL',
    'jcp_id': vhl_jcp,
    'strength': float(vhl_strength),
    'rank': int(vhl_rank),
    'wells': int(len(vhl_data)),
    'top_increased': {k: float(v) for k, v in top_increased.head(10).items()},
    'top_decreased': {k: float(v) for k, v in top_decreased.head(10).items()}
}

with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_analysis.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n" + "="*80)
print("Analysis saved to vhl_analysis.json")
print("="*80)

