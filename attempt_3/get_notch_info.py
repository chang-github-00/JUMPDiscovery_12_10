import json

# Load notch data
with open('notch_genes_jump.jsonl', 'r') as f:
    notch_data = [json.loads(line) for line in f]

# Get NOTCH1, NOTCH2, NOTCH3 CRISPR data
notch_receptors = {}
for entry in notch_data:
    gene = entry['gene']
    if gene in ['NOTCH1', 'NOTCH2', 'NOTCH3'] and entry['plate_type'] == 'crispr':
        if gene not in notch_receptors:
            notch_receptors[gene] = []
        notch_receptors[gene].append(entry)

print("NOTCH Receptor CRISPR Knockouts:")
for gene, entries in notch_receptors.items():
    print(f"\n{gene}:")
    print(f"  JCP IDs: {set([e['jcp_id'] for e in entries])}")
    print(f"  Total wells: {len(entries)}")
    if entries:
        print(f"  Example: Plate {entries[0]['plate']}, Well {entries[0]['well']}")

# Save for image download
with open('notch_receptors_crispr.json', 'w') as f:
    json.dump(notch_receptors, f, indent=2)

