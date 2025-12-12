import json
import pandas as pd

# Load hallmark genesets
with open('hallmark_genesets.json', 'r') as f:
    hallmarks = json.load(f)

# Find Notch signaling genes
notch_geneset = [gs for gs in hallmarks if 'NOTCH' in gs['name']][0]
print("=" * 80)
print("NOTCH SIGNALING HALLMARK GENES")
print("=" * 80)
print(f"Total genes: {notch_geneset['gene_count']}")
print(f"Genes: {', '.join(notch_geneset['gene_symbols'])}")

# Check which are in JUMP
notch_genes = notch_geneset['gene_symbols']
print(f"\n\nChecking availability in JUMP dataset...")
print("=" * 80)

# We'll use gene_to_jump to check
import subprocess
import os

# Create a file with notch genes
with open('notch_genes.txt', 'w') as f:
    for gene in notch_genes:
        f.write(f"{gene}\n")

print("\nQuerying JUMP database for Notch genes...")

