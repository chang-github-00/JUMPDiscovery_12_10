import json
import pandas as pd
import numpy as np

# Load hallmark genesets
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/hallmark_genesets.json', 'r') as f:
    hallmarks = json.load(f)

# Get hypoxia genes
hypoxia_genes = None
for geneset in hallmarks:
    if geneset['name'] == 'HALLMARK_HYPOXIA':
        hypoxia_genes = geneset['gene_symbols']
        print(f"Found {len(hypoxia_genes)} hypoxia genes")
        print(f"First 30: {hypoxia_genes[:30]}")
        break

# Load CRISPR data
print("\nLoading CRISPR data...")
crispr_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')

# Load interpretable features for better analysis
print("Loading interpretable CRISPR data...")
interp_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_crispr.parquet')

# Map JCP IDs to genes
print("\nMapping JCP IDs to genes...")
# We need to use the API for this
# For now, let's calculate perturbation strengths for all genes

feature_cols = [col for col in crispr_df.columns if col.startswith('X_')]
perturb_profiles = crispr_df.groupby('Metadata_JCP2022')[feature_cols].mean()
perturb_strength = np.sqrt((perturb_profiles ** 2).sum(axis=1))

# Save top 500 for mapping
top_500 = perturb_strength.sort_values(ascending=False).head(500)
print(f"\nTop 500 perturbations by strength:")
print(top_500.head(20))

# Save JCP IDs for mapping
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/top_500_jcp.txt', 'w') as f:
    for jcp_id in top_500.index:
        f.write(f"{jcp_id}\n")

print("\nSaved top 500 JCP IDs to top_500_jcp.txt")
print("Use jump_to_gene to map these to gene names")

# Also look at interpretable features to understand what's changing
print("\nAnalyzing interpretable features...")
print(f"Interpretable features: {len([col for col in interp_df.columns if not col.startswith('Metadata')])}")

# Get feature names
feature_names = [col for col in interp_df.columns if not col.startswith('Metadata')]
print(f"\nSample feature names:")
for i, feat in enumerate(feature_names[:20]):
    print(f"  {feat}")

