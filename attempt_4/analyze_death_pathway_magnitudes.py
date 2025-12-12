import pandas as pd
import numpy as np
import json

# Load batch-corrected data
print("Loading JUMP data...")
crispr_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
orf_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')

# Get feature columns
feature_cols_crispr = [col for col in crispr_df.columns if col.startswith('X_')]
feature_cols_orf = [col for col in orf_df.columns if col.startswith('X_')]

# Aggregate by perturbation
crispr_agg = crispr_df.groupby('Metadata_JCP2022')[feature_cols_crispr].mean()
orf_agg = orf_df.groupby('Metadata_JCP2022')[feature_cols_orf].mean()

# Calculate magnitudes
crispr_agg['magnitude'] = np.sqrt((crispr_agg[feature_cols_crispr]**2).sum(axis=1))
orf_agg['magnitude'] = np.sqrt((orf_agg[feature_cols_orf]**2).sum(axis=1))

# Load death receptor genes
with open('death_receptor_genes_jump.jsonl', 'r') as f:
    death_genes = [json.loads(line) for line in f]

# Create gene-to-JCP mapping
gene_jcp_map = {}
for entry in death_genes:
    gene = entry['gene']
    jcp = entry['jcp_id']
    plate_type = entry['plate_type']
    
    if gene not in gene_jcp_map:
        gene_jcp_map[gene] = {'crispr': set(), 'orf': set()}
    gene_jcp_map[gene][plate_type].add(jcp)

# Get magnitudes for each gene
print("\n" + "=" * 80)
print("DEATH RECEPTOR PATHWAY GENE MAGNITUDES")
print("=" * 80)

results = []
for gene in sorted(gene_jcp_map.keys()):
    print(f"\n{gene}:")
    
    # CRISPR
    if gene_jcp_map[gene]['crispr']:
        jcp = list(gene_jcp_map[gene]['crispr'])[0]
        if jcp in crispr_agg.index:
            mag = crispr_agg.loc[jcp, 'magnitude']
            print(f"  CRISPR KO: {jcp} - Magnitude: {mag:.2f}")
            results.append({
                'gene': gene,
                'perturbation': 'CRISPR_KO',
                'jcp_id': jcp,
                'magnitude': float(mag)
            })
    
    # ORF
    if gene_jcp_map[gene]['orf']:
        jcp = list(gene_jcp_map[gene]['orf'])[0]
        if jcp in orf_agg.index:
            mag = orf_agg.loc[jcp, 'magnitude']
            print(f"  ORF OE: {jcp} - Magnitude: {mag:.2f}")
            results.append({
                'gene': gene,
                'perturbation': 'ORF_OE',
                'jcp_id': jcp,
                'magnitude': float(mag)
            })

# Sort by magnitude
results_df = pd.DataFrame(results)
results_df = results_df.sort_values('magnitude', ascending=False)

print("\n" + "=" * 80)
print("TOP DEATH RECEPTOR PERTURBATIONS BY MAGNITUDE")
print("=" * 80)
print(results_df.to_string(index=False))

# Save results
results_df.to_csv('death_receptor_magnitudes.csv', index=False)
print("\n\nResults saved to death_receptor_magnitudes.csv")

# Identify top candidates for detailed analysis
print("\n" + "=" * 80)
print("RECOMMENDED GENES FOR DETAILED ANALYSIS")
print("=" * 80)

# Focus on ORF overexpression with strong phenotypes
top_orf = results_df[results_df['perturbation'] == 'ORF_OE'].head(5)
print("\nTop 5 ORF overexpression perturbations:")
print(top_orf.to_string(index=False))

# Also check CRISPR knockouts
top_crispr = results_df[results_df['perturbation'] == 'CRISPR_KO'].head(5)
print("\nTop 5 CRISPR knockout perturbations:")
print(top_crispr.to_string(index=False))
