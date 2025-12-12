import tifffile
import numpy as np
from pathlib import Path
from scipy import ndimage
from skimage import filters, measure, morphology, segmentation
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def segment_nuclei(dna_img, min_size=50):
    """Segment nuclei from DNA channel"""
    smoothed = filters.gaussian(dna_img, sigma=2)
    thresh = filters.threshold_otsu(smoothed)
    binary = smoothed > thresh
    binary = morphology.remove_small_objects(binary, min_size=min_size)
    binary = morphology.remove_small_holes(binary, area_threshold=100)
    labeled = measure.label(binary)
    return labeled

def count_cells_in_image(dna_path):
    """Count cells in a single image"""
    dna = tifffile.imread(dna_path)
    nuclei = segment_nuclei(dna)
    return nuclei.max()  # Number of labeled objects

# Analyze all sites for each condition
conditions = {
    'NegCon': 'images_death_receptor/NEGCON',
    'CASP8_OE': 'images_death_receptor/CASP8_OE',
    'FADD_OE': 'images_death_receptor/FADD_OE',
    'TNFRSF10B_OE': 'images_death_receptor/TNFRSF10B_OE',
}

results = []

print("="*80)
print("ANALYZING MULTIPLE SITES FOR CELL COUNTING")
print("="*80)

for condition_name, dir_path in conditions.items():
    dir_obj = Path(dir_path)
    dna_files = sorted(dir_obj.glob('*_DNA.tiff'))
    
    print(f"\n{condition_name}:")
    site_counts = []
    
    for dna_file in dna_files:
        site = dna_file.stem.split('_site')[1].split('_')[0]
        cell_count = count_cells_in_image(dna_file)
        site_counts.append(cell_count)
        
        results.append({
            'condition': condition_name,
            'site': site,
            'cell_count': cell_count
        })
        
        print(f"  Site {site}: {cell_count} cells")
    
    if site_counts:
        print(f"  Mean: {np.mean(site_counts):.1f} ± {np.std(site_counts):.1f} cells")

# Create DataFrame
df = pd.DataFrame(results)
df.to_csv('death_receptor_cell_counts_all_sites.csv', index=False)

# Calculate statistics
print("\n" + "="*80)
print("SUMMARY STATISTICS ACROSS ALL SITES")
print("="*80)

summary = df.groupby('condition')['cell_count'].agg(['mean', 'std', 'count'])
print(summary)

# Calculate fold changes
negcon_mean = summary.loc['NegCon', 'mean']
print("\n" + "="*80)
print("FOLD CHANGE VS NEGCON")
print("="*80)

for condition in ['CASP8_OE', 'FADD_OE', 'TNFRSF10B_OE']:
    if condition in summary.index:
        fold_change = summary.loc[condition, 'mean'] / negcon_mean
        print(f"{condition}: {fold_change:.2f}x ({summary.loc[condition, 'mean']:.1f} vs {negcon_mean:.1f} cells)")

# Visualization
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Bar plot with error bars
ax1 = axes[0]
conditions_order = ['NegCon', 'CASP8_OE', 'FADD_OE', 'TNFRSF10B_OE']
means = [summary.loc[c, 'mean'] for c in conditions_order if c in summary.index]
stds = [summary.loc[c, 'std'] for c in conditions_order if c in summary.index]
colors = ['#2ecc71', '#e74c3c', '#9b59b6', '#3498db']

x_pos = range(len(means))
ax1.bar(x_pos, means, yerr=stds, color=colors, capsize=5, alpha=0.8)
ax1.set_xticks(x_pos)
ax1.set_xticklabels([c.replace('_OE', '') for c in conditions_order if c in summary.index], 
                     rotation=45, ha='right')
ax1.set_ylabel('Cell Count', fontsize=12, fontweight='bold')
ax1.set_title('Mean Cell Count Across All Sites', fontsize=13, fontweight='bold')
ax1.grid(axis='y', alpha=0.3)

# Add fold change labels
for i, (mean, cond) in enumerate(zip(means, [c for c in conditions_order if c in summary.index])):
    if cond != 'NegCon':
        fc = mean / negcon_mean
        ax1.text(i, mean + stds[i] + 1, f'{fc:.2f}x', ha='center', va='bottom', 
                fontweight='bold', fontsize=10)

# Box plot
ax2 = axes[1]
df.boxplot(column='cell_count', by='condition', ax=ax2)
ax2.set_xlabel('Condition', fontsize=12, fontweight='bold')
ax2.set_ylabel('Cell Count', fontsize=12, fontweight='bold')
ax2.set_title('Cell Count Distribution Across Sites', fontsize=13, fontweight='bold')
plt.sca(ax2)
plt.xticks(rotation=45, ha='right')
ax2.get_figure().suptitle('')

plt.tight_layout()
plt.savefig('death_receptor_cell_counts_summary.png', dpi=150, bbox_inches='tight')
print("\nSaved: death_receptor_cell_counts_summary.png")
plt.close()

print("\nAnalysis complete!")
