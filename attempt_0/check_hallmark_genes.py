import json

# Load hallmark genesets
with open('hallmark_genesets.json', 'r') as f:
    hallmarks = json.load(f)

# Novel genes to check
novel_genes = []
with open('novel_strong_phenotype_genes.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        novel_genes.append(data['gene'])

print(f"Checking {len(novel_genes)} novel genes against hallmark genesets...\n")

# Check each gene
gene_hallmarks = {}
for gene in novel_genes[:20]:  # Check top 20
    gene_hallmarks[gene] = []
    for hallmark in hallmarks:
        if gene in hallmark['gene_symbols']:
            gene_hallmarks[gene].append(hallmark['name'])
    
    if gene_hallmarks[gene]:
        print(f"\n{gene}:")
        for h in gene_hallmarks[gene]:
            print(f"  - {h}")

# Find genes in interesting pathways
print("\n" + "="*80)
print("GENES IN DISEASE-RELEVANT PATHWAYS:")
print("="*80)

interesting_pathways = [
    'HALLMARK_APOPTOSIS',
    'HALLMARK_DNA_REPAIR', 
    'HALLMARK_INFLAMMATORY_RESPONSE',
    'HALLMARK_HYPOXIA',
    'HALLMARK_P53_PATHWAY',
    'HALLMARK_OXIDATIVE_PHOSPHORYLATION',
    'HALLMARK_GLYCOLYSIS',
    'HALLMARK_FATTY_ACID_METABOLISM'
]

for pathway in interesting_pathways:
    pathway_data = [h for h in hallmarks if h['name'] == pathway]
    if pathway_data:
        genes_in_pathway = [g for g in novel_genes[:20] if g in pathway_data[0]['gene_symbols']]
        if genes_in_pathway:
            print(f"\n{pathway}:")
            print(f"  Genes: {', '.join(genes_in_pathway)}")

