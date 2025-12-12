import pandas as pd
import json

# Load hallmark genesets
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/hallmark_genesets.json', 'r') as f:
    hallmarks = json.load(f)

# Get all genes from hallmarks
hallmark_genes = set()
for geneset in hallmarks:
    hallmark_genes.update(geneset['gene_symbols'])

print(f"Total hallmark genes: {len(hallmark_genes)}")

# Load CRISPR data
crispr_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')

# Load perturbation strengths
perturb_strength = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/perturbation_strengths.csv', index_col=0, header=None, names=['JCP_ID', 'strength'])

# Get top 200 perturbations
top_200 = perturb_strength.head(200)

# Map to genes
print("\nMapping top 200 perturbations to genes...")
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/top_200_jcp.txt', 'w') as f:
    for jcp_id in top_200['JCP_ID']:
        f.write(f"{jcp_id}\n")

print("Saved top 200 JCP IDs to top_200_jcp.txt")

# Load verified genes
verified_genes = set()
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Verified_Hypothesis.txt', 'r') as f:
    for line in f:
        if line.startswith('**Gene:**'):
            gene = line.split('**Gene:**')[1].strip().split()[0].split('(')[0]
            verified_genes.add(gene)

print(f"\nVerified genes: {verified_genes}")

# Look for specific disease-related genes
print("\nLooking for apoptosis-related genes...")
apoptosis_genes = None
for geneset in hallmarks:
    if 'APOPTOSIS' in geneset['name']:
        apoptosis_genes = set(geneset['gene_symbols'])
        print(f"Found {len(apoptosis_genes)} apoptosis genes")
        break

# Look for DNA repair genes
print("\nLooking for DNA repair genes...")
dna_repair_genes = None
for geneset in hallmarks:
    if 'DNA_REPAIR' in geneset['name']:
        dna_repair_genes = set(geneset['gene_symbols'])
        print(f"Found {len(dna_repair_genes)} DNA repair genes")
        break

# Look for inflammatory response genes
print("\nLooking for inflammatory response genes...")
inflammatory_genes = None
for geneset in hallmarks:
    if 'INFLAMMATORY' in geneset['name']:
        inflammatory_genes = set(geneset['gene_symbols'])
        print(f"Found {len(inflammatory_genes)} inflammatory genes")
        break

# Look for hypoxia genes
print("\nLooking for hypoxia genes...")
hypoxia_genes = None
for geneset in hallmarks:
    if 'HYPOXIA' in geneset['name']:
        hypoxia_genes = set(geneset['gene_symbols'])
        print(f"Found {len(hypoxia_genes)} hypoxia genes")
        break

print("\nDone!")
