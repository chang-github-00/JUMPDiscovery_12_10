import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import zscore
import warnings
warnings.filterwarnings('ignore')

# Load CRISPR data
print("Loading CRISPR data...")
crispr_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
print(f"CRISPR shape: {crispr_df.shape}")
print(f"Columns: {crispr_df.columns[:10].tolist()}")

# Load ORF data
print("\nLoading ORF data...")
orf_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')
print(f"ORF shape: {orf_df.shape}")

# Load similarity data
print("\nLoading similarity data...")
crispr_sim = pd.read_parquet('JUMP_Similarity_Data/crispr_cosinesim_full.parquet')
print(f"CRISPR similarity shape: {crispr_sim.shape}")

# Get feature columns (exclude metadata)
feature_cols = [col for col in crispr_df.columns if col.startswith('X_')]
print(f"\nNumber of features: {len(feature_cols)}")

# Calculate phenotype strength for each perturbation
# Group by JCP2022 ID and calculate mean
crispr_grouped = crispr_df.groupby('Metadata_JCP2022')[feature_cols].mean()
print(f"\nUnique CRISPR perturbations: {len(crispr_grouped)}")

# Calculate phenotype strength as L2 norm of feature vector
crispr_grouped['phenotype_strength'] = np.sqrt((crispr_grouped[feature_cols]**2).sum(axis=1))

# Sort by phenotype strength
top_phenotypes = crispr_grouped.sort_values('phenotype_strength', ascending=False)
print("\nTop 30 perturbations by phenotype strength:")
print(top_phenotypes['phenotype_strength'].head(30))

# Save top perturbations
top_jcp_ids = top_phenotypes.head(100).index.tolist()
with open('top_phenotype_perturbations.txt', 'w') as f:
    for jcp_id in top_jcp_ids:
        f.write(f"{jcp_id}\n")

print("\nSaved top 100 perturbations to top_phenotype_perturbations.txt")

# Also look for interesting patterns - genes with unusual similarity patterns
# For each gene, find its top similar genes
print("\nAnalyzing similarity patterns...")
interesting_patterns = []

for i, jcp_id in enumerate(crispr_sim.index[:500]):  # Check first 500
    if i % 100 == 0:
        print(f"Processed {i} perturbations...")
    
    similarities = crispr_sim.loc[jcp_id].sort_values(ascending=False)
    # Exclude self-similarity
    similarities = similarities[similarities.index != jcp_id]
    
    # Check if top similarity is very high (>0.8) or very low (<0.2)
    if len(similarities) > 0:
        top_sim = similarities.iloc[0]
        if top_sim > 0.85:
            interesting_patterns.append({
                'jcp_id': jcp_id,
                'pattern': 'high_similarity',
                'value': top_sim,
                'similar_to': similarities.index[0]
            })

print(f"\nFound {len(interesting_patterns)} interesting patterns")

# Save interesting patterns
if interesting_patterns:
    patterns_df = pd.DataFrame(interesting_patterns)
    patterns_df.to_csv('interesting_similarity_patterns.csv', index=False)
    print("\nTop 20 high similarity pairs:")
    print(patterns_df.sort_values('value', ascending=False).head(20))

print("\nAnalysis complete!")
