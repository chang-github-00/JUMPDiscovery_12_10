import json

# Genes already studied
studied_genes = [
    'SQLE', 'NXF1', 'CUL3', 'LONP1', 'VCP', 'GCH1', 'ATP6V1G1', 'GSTM3', 'FDPS',
    'KARS', 'HARS', 'NARS', 'FARSA', 'FARSB', 'EPRS', 'SARS',  # aaRS genes
    'ESPL1', 'GFM1', 'ZNF804A', 'BIRC5', 'ZBTB20', 'CA4', 'PTCH1', 'EIF4A3',
    'SOD1', 'PHB2', 'PARK2', 'C1GALT1', 'NLRC5', 'IRF3', 'POLA1', 'SIRT6', 'RECQL4',
    'PEX1', 'PEX6', 'PEX10'  # Peroxisome genes
]

# Load top genes
novel_genes = []
with open('top_genes_mapping.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        gene = data['gene']
        if gene not in studied_genes:
            novel_genes.append(data)

print(f"Found {len(novel_genes)} novel genes with strong phenotypes")
print("\nTop 20 novel genes:")
for i, gene_data in enumerate(novel_genes[:20]):
    print(f"{i+1}. {gene_data['gene']} (JCP: {gene_data['jcp_id']})")

# Save novel genes
with open('novel_strong_phenotype_genes.jsonl', 'w') as f:
    for gene_data in novel_genes[:50]:
        f.write(json.dumps(gene_data) + '\n')

print("\nSaved top 50 novel genes to novel_strong_phenotype_genes.jsonl")
