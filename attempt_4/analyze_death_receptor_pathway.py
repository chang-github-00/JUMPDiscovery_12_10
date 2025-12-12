import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json

# Death receptor pathway genes
death_receptor_genes = [
    'CASP8',  # Initiator caspase
    'FADD',   # Adaptor protein
    'TNFRSF10B',  # TRAIL-R2/DR5
    'TNFRSF10A',  # TRAIL-R1/DR4
    'FAS',    # Fas receptor/CD95
    'TNFRSF1A',  # TNF-R1
    'TRADD',  # TNF-R1 adaptor
    'RIPK1',  # Necroptosis regulator
    'RIPK3',  # Necroptosis executor
    'MLKL',   # Necroptosis executor
    'CFLAR',  # FLIP - caspase-8 inhibitor
    'CASP10', # Initiator caspase
    'CASP3',  # Executioner caspase
    'CASP7',  # Executioner caspase
    'BID',    # Links extrinsic to intrinsic pathway
    'BIRC2',  # cIAP1
    'BIRC3',  # cIAP2
    'XIAP',   # X-linked IAP
]

print("=" * 80)
print("DEATH RECEPTOR PATHWAY ANALYSIS")
print("=" * 80)

# Load batch-corrected data
print("\nLoading JUMP data...")
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

# Map JCP IDs to genes
print("\nMapping JCP IDs to genes...")
crispr_gene_map = {}
orf_gene_map = {}

# Load from our previous mapping
with open('top_crispr_genes.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        crispr_gene_map[data['jcp_id']] = data['gene']

with open('top_orf_genes.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        orf_gene_map[data['jcp_id']] = data['gene']

# Find death receptor genes in JUMP
print("\n" + "=" * 80)
print("DEATH RECEPTOR GENES IN JUMP")
print("=" * 80)

found_genes = []
for gene in death_receptor_genes:
    # Check CRISPR
    crispr_matches = [jcp for jcp, g in crispr_gene_map.items() if g == gene]
    # Check ORF
    orf_matches = [jcp for jcp, g in orf_gene_map.items() if g == gene]
    
    if crispr_matches or orf_matches:
        found_genes.append(gene)
        print(f"\n{gene}:")
        if crispr_matches:
            for jcp in crispr_matches:
                mag = crispr_agg.loc[jcp, 'magnitude']
                print(f"  CRISPR KO: {jcp} - Magnitude: {mag:.2f}")
        if orf_matches:
            for jcp in orf_matches:
                mag = orf_agg.loc[jcp, 'magnitude']
                print(f"  ORF OE: {jcp} - Magnitude: {mag:.2f}")

print(f"\n\nFound {len(found_genes)} death receptor pathway genes in JUMP")
print(f"Genes found: {', '.join(found_genes)}")

# Save results
results = {
    'pathway': 'Death Receptor Signaling',
    'genes_searched': death_receptor_genes,
    'genes_found': found_genes,
    'crispr_map': crispr_gene_map,
    'orf_map': orf_gene_map
}

with open('death_receptor_analysis.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nResults saved to death_receptor_analysis.json")
