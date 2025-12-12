import json
import pandas as pd
from collections import defaultdict

# Load the JUMP results
with open('notch_genes_jump.jsonl', 'r') as f:
    notch_data = [json.loads(line) for line in f]

# Count genes and perturbations
gene_counts = defaultdict(lambda: {'crispr': 0, 'orf': 0, 'jcp_ids': set()})
for entry in notch_data:
    gene = entry['gene']
    plate_type = entry['plate_type']
    jcp_id = entry['jcp_id']
    gene_counts[gene][plate_type] += 1
    gene_counts[gene]['jcp_ids'].add(jcp_id)

print("=" * 80)
print("NOTCH PATHWAY GENES AVAILABLE IN JUMP")
print("=" * 80)
print(f"{'Gene':<15} {'CRISPR Wells':<15} {'ORF Wells':<15} {'Total JCP IDs':<15}")
print("-" * 80)

available_genes = []
for gene in sorted(gene_counts.keys()):
    crispr_count = gene_counts[gene]['crispr']
    orf_count = gene_counts[gene]['orf']
    jcp_count = len(gene_counts[gene]['jcp_ids'])
    print(f"{gene:<15} {crispr_count:<15} {orf_count:<15} {jcp_count:<15}")
    if crispr_count > 0 or orf_count > 0:
        available_genes.append(gene)

print("\n" + "=" * 80)
print(f"Total genes available: {len(available_genes)}")
print(f"Genes: {', '.join(available_genes)}")

# Now let's check which genes have the most dramatic morphological effects
# by looking at their similarity to negative controls
print("\n" + "=" * 80)
print("LOADING MORPHOLOGICAL PROFILES...")
print("=" * 80)

# Load batch-corrected data
crispr_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
orf_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')

# Get JCP IDs for Notch genes
notch_jcp_ids = set()
for entry in notch_data:
    notch_jcp_ids.add(entry['jcp_id'])

print(f"Total unique JCP IDs for Notch genes: {len(notch_jcp_ids)}")

# Filter for Notch genes
notch_crispr = crispr_df[crispr_df['Metadata_JCP2022'].isin(notch_jcp_ids)]
notch_orf = orf_df[orf_df['Metadata_JCP2022'].isin(notch_jcp_ids)]

print(f"CRISPR profiles for Notch genes: {len(notch_crispr)}")
print(f"ORF profiles for Notch genes: {len(notch_orf)}")

# Calculate magnitude of morphological change (distance from origin)
import numpy as np

def calculate_magnitude(df):
    feature_cols = [col for col in df.columns if col.startswith('X_')]
    magnitudes = np.sqrt((df[feature_cols] ** 2).sum(axis=1))
    return magnitudes

if len(notch_crispr) > 0:
    notch_crispr['magnitude'] = calculate_magnitude(notch_crispr)
    
if len(notch_orf) > 0:
    notch_orf['magnitude'] = calculate_magnitude(notch_orf)

# Aggregate by JCP ID
print("\n" + "=" * 80)
print("TOP NOTCH GENES BY MORPHOLOGICAL MAGNITUDE (CRISPR)")
print("=" * 80)
if len(notch_crispr) > 0:
    crispr_agg = notch_crispr.groupby('Metadata_JCP2022')['magnitude'].agg(['mean', 'std', 'count'])
    crispr_agg = crispr_agg.sort_values('mean', ascending=False)
    
    # Map back to gene names
    jcp_to_gene = {}
    for entry in notch_data:
        if entry['plate_type'] == 'crispr':
            jcp_to_gene[entry['jcp_id']] = entry['gene']
    
    print(f"{'JCP ID':<20} {'Gene':<15} {'Mean Mag':<12} {'Std':<12} {'Count':<8}")
    print("-" * 80)
    for jcp_id, row in crispr_agg.head(10).iterrows():
        gene = jcp_to_gene.get(jcp_id, 'Unknown')
        print(f"{jcp_id:<20} {gene:<15} {row['mean']:<12.4f} {row['std']:<12.4f} {int(row['count']):<8}")

print("\n" + "=" * 80)
print("TOP NOTCH GENES BY MORPHOLOGICAL MAGNITUDE (ORF)")
print("=" * 80)
if len(notch_orf) > 0:
    orf_agg = notch_orf.groupby('Metadata_JCP2022')['magnitude'].agg(['mean', 'std', 'count'])
    orf_agg = orf_agg.sort_values('mean', ascending=False)
    
    # Map back to gene names
    jcp_to_gene = {}
    for entry in notch_data:
        if entry['plate_type'] == 'orf':
            jcp_to_gene[entry['jcp_id']] = entry['gene']
    
    print(f"{'JCP ID':<20} {'Gene':<15} {'Mean Mag':<12} {'Std':<12} {'Count':<8}")
    print("-" * 80)
    for jcp_id, row in orf_agg.head(10).iterrows():
        gene = jcp_to_gene.get(jcp_id, 'Unknown')
        print(f"{jcp_id:<20} {gene:<15} {row['mean']:<12.4f} {row['std']:<12.4f} {int(row['count']):<8}")

# Save results
results = {
    'available_genes': available_genes,
    'gene_counts': {gene: {'crispr': gene_counts[gene]['crispr'], 
                           'orf': gene_counts[gene]['orf'],
                           'jcp_ids': list(gene_counts[gene]['jcp_ids'])} 
                    for gene in gene_counts}
}

with open('notch_analysis_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n" + "=" * 80)
print("Results saved to notch_analysis_results.json")
print("=" * 80)

