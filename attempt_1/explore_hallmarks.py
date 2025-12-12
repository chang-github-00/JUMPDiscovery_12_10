import json
import pandas as pd

# Load hallmark genesets
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/hallmark_genesets.json', 'r') as f:
    hallmarks = json.load(f)

print("Available hallmark genesets:")
for i, geneset in enumerate(hallmarks):
    print(f"{i+1}. {geneset['name']} ({geneset['gene_count']} genes)")
    print(f"   Description: {geneset['description']}")
    print()

# Focus on interesting disease-related pathways
interesting_pathways = [
    'HALLMARK_HYPOXIA',
    'HALLMARK_INFLAMMATORY_RESPONSE', 
    'HALLMARK_APOPTOSIS',
    'HALLMARK_DNA_REPAIR',
    'HALLMARK_P53_PATHWAY',
    'HALLMARK_UV_RESPONSE',
    'HALLMARK_OXIDATIVE_PHOSPHORYLATION',
    'HALLMARK_GLYCOLYSIS',
    'HALLMARK_UNFOLDED_PROTEIN_RESPONSE'
]

for pathway in interesting_pathways:
    for geneset in hallmarks:
        if geneset['name'] == pathway:
            print(f"\n{pathway}:")
            print(f"Genes: {', '.join(geneset['gene_symbols'][:20])}...")
            break
