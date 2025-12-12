import json
import pandas as pd

# Load hallmark genesets
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/hallmark_genesets.json', 'r') as f:
    hallmarks = json.load(f)

# Get hypoxia genes
hypoxia_genes = set()
for geneset in hallmarks:
    if geneset['name'] == 'HALLMARK_HYPOXIA':
        hypoxia_genes = set(geneset['gene_symbols'])
        break

print(f"Hypoxia genes: {len(hypoxia_genes)}")

# Load mapped genes
genes_data = []
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/top_500_genes.jsonl', 'r') as f:
    for line in f:
        genes_data.append(json.loads(line))

# Find hypoxia genes in top 500
hypoxia_in_top500 = []
for entry in genes_data:
    if entry['gene'] in hypoxia_genes:
        hypoxia_in_top500.append(entry)

print(f"\nHypoxia genes in top 500 perturbations: {len(hypoxia_in_top500)}")
for entry in hypoxia_in_top500:
    print(f"  {entry['gene']} - {entry['jcp_id']}")

# Load verified genes
verified_genes = set()
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Verified_Hypothesis.txt', 'r') as f:
    content = f.read()
    # Extract gene names more carefully
    for line in content.split('\n'):
        if '**Gene:**' in line:
            # Extract gene name
            parts = line.split('**Gene:**')
            if len(parts) > 1:
                gene_part = parts[1].strip()
                # Get first word before space or parenthesis
                gene = gene_part.split()[0].split('(')[0]
                verified_genes.add(gene)

print(f"\nVerified genes: {verified_genes}")

# Filter out verified genes
novel_hypoxia = [entry for entry in hypoxia_in_top500 if entry['gene'] not in verified_genes]
print(f"\nNovel hypoxia genes in top 500: {len(novel_hypoxia)}")
for entry in novel_hypoxia:
    print(f"  {entry['gene']} - {entry['jcp_id']}")

# Save for further analysis
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/novel_hypoxia_genes.json', 'w') as f:
    json.dump(novel_hypoxia, f, indent=2)

# Also look at other interesting pathways
print("\n" + "="*80)
print("Looking at other disease-related pathways...")

pathways_of_interest = [
    'HALLMARK_INFLAMMATORY_RESPONSE',
    'HALLMARK_APOPTOSIS',
    'HALLMARK_DNA_REPAIR',
    'HALLMARK_UNFOLDED_PROTEIN_RESPONSE',
    'HALLMARK_OXIDATIVE_PHOSPHORYLATION',
    'HALLMARK_P53_PATHWAY'
]

for pathway_name in pathways_of_interest:
    pathway_genes = set()
    for geneset in hallmarks:
        if geneset['name'] == pathway_name:
            pathway_genes = set(geneset['gene_symbols'])
            break
    
    if not pathway_genes:
        continue
    
    # Find genes in top 500
    pathway_in_top500 = []
    for entry in genes_data:
        if entry['gene'] in pathway_genes:
            pathway_in_top500.append(entry)
    
    # Filter out verified
    novel_pathway = [entry for entry in pathway_in_top500 if entry['gene'] not in verified_genes]
    
    print(f"\n{pathway_name}:")
    print(f"  Total in top 500: {len(pathway_in_top500)}")
    print(f"  Novel: {len(novel_pathway)}")
    if novel_pathway:
        print(f"  Top 5 novel:")
        for entry in novel_pathway[:5]:
            print(f"    {entry['gene']} - {entry['jcp_id']}")

