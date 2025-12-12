import tifffile
import numpy as np
from pathlib import Path
from scipy import ndimage
from skimage import filters, measure, morphology
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

def analyze_condition(condition_name, dir_path):
    """Analyze all sites for a condition"""
    dir_obj = Path(dir_path)
    dna_files = sorted(dir_obj.glob('*_DNA.tiff'))
    mito_files = sorted(dir_obj.glob('*_Mito.tiff'))
    
    results = []
    
    for dna_file, mito_file in zip(dna_files, mito_files):
        # Extract site number
        site = dna_file.stem.split('_site')[1].split('_')[0]
        
        # Load images
        dna = tifffile.imread(dna_file)
        mito = tifffile.imread(mito_file)
        
        # Segment nuclei
        nuclei = segment_nuclei(dna)
        n_cells = nuclei.max()
        
        # Measure properties for each cell
        for region in measure.regionprops(nuclei, intensity_image=dna):
            nucleus_area = region.area
            nucleus_intensity = region.mean_intensity
            nucleus_eccentricity = region.eccentricity
            
            # Get mitochondrial intensity in nucleus region
            nucleus_mask = nuclei == region.label
            mito_intensity = np.mean(mito[nucleus_mask])
            
            results.append({
                'condition': condition_name,
                'site': site,
                'cell_id': region.label,
                'nucleus_area': nucleus_area,
                'nucleus_intensity': nucleus_intensity,
                'nucleus_eccentricity': nucleus_eccentricity,
                'mito_intensity': mito_intensity,
            })
    
    return pd.DataFrame(results)

# Define all conditions
conditions = {
    'NegCon': 'images_death_receptor/NEGCON',
    'CASP8_OE': 'images_death_receptor/CASP8_OE',
    'CASP8_OE_rep2': 'images_death_receptor/CASP8_OE_rep2',
    'CASP8_KO': 'images_death_receptor/CASP8_KO',
    'FADD_OE': 'images_death_receptor/FADD_OE',
    'TNFRSF10B_OE': 'images_death_receptor/TNFRSF10B_OE',
    'TNFRSF10B_OE_rep2': 'images_death_receptor/TNFRSF10B_OE_rep2',
    'TNFRSF10B_KO': 'images_death_receptor/TNFRSF10B_KO',
}

print("="*80)
print("COMPREHENSIVE DEATH RECEPTOR PATHWAY ANALYSIS")
print("="*80)

all_results = []

for condition_name, dir_path in conditions.items():
    if Path(dir_path).exists():
        print(f"\nAnalyzing {condition_name}...")
        df = analyze_condition(condition_name, dir_path)
        all_results.append(df)
        
        n_cells = len(df)
        n_sites = df['site'].nunique()
        print(f"  {n_cells} cells across {n_sites} sites")
        print(f"  Mean cells per site: {n_cells/n_sites:.1f}")

# Combine all results
combined_df = pd.concat(all_results, ignore_index=True)
combined_df.to_csv('comprehensive_death_receptor_measurements.csv', index=False)
print(f"\nTotal cells analyzed: {len(combined_df)}")

# Calculate summary statistics
print("\n" + "="*80)
print("CELL COUNT SUMMARY")
print("="*80)

cell_counts = combined_df.groupby('condition').agg({
    'cell_id': 'count',
    'site': 'nunique'
}).rename(columns={'cell_id': 'total_cells', 'site': 'n_sites'})
cell_counts['cells_per_site'] = cell_counts['total_cells'] / cell_counts['n_sites']
print(cell_counts)

# Calculate fold changes
negcon_cells_per_site = cell_counts.loc['NegCon', 'cells_per_site']

print("\n" + "="*80)
print("FOLD CHANGE VS NEGCON (Cells per Site)")
print("="*80)

for condition in cell_counts.index:
    if condition != 'NegCon':
        fc = cell_counts.loc[condition, 'cells_per_site'] / negcon_cells_per_site
        print(f"{condition}: {fc:.2f}x ({cell_counts.loc[condition, 'cells_per_site']:.1f} vs {negcon_cells_per_site:.1f})")

# Create comprehensive visualization
fig = plt.figure(figsize=(20, 12))
gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)

# 1. Cell count per site
ax1 = fig.add_subplot(gs[0, 0])
condition_order = ['NegCon', 'CASP8_KO', 'CASP8_OE', 'CASP8_OE_rep2', 
                   'FADD_OE', 'TNFRSF10B_KO', 'TNFRSF10B_OE', 'TNFRSF10B_OE_rep2']
condition_order = [c for c in condition_order if c in cell_counts.index]

cells_per_site = [cell_counts.loc[c, 'cells_per_site'] for c in condition_order]
colors = ['#2ecc71', '#95a5a6', '#e74c3c', '#e67e22', '#9b59b6', '#95a5a6', '#3498db', '#5dade2']

x_pos = range(len(cells_per_site))
bars = ax1.bar(x_pos, cells_per_site, color=colors[:len(cells_per_site)], alpha=0.8)
ax1.set_xticks(x_pos)
ax1.set_xticklabels([c.replace('_', '\n') for c in condition_order], rotation=0, ha='center', fontsize=9)
ax1.set_ylabel('Cells per Site', fontsize=12, fontweight='bold')
ax1.set_title('Cell Density Comparison', fontsize=13, fontweight='bold')
ax1.grid(axis='y', alpha=0.3)
ax1.axhline(y=negcon_cells_per_site, color='green', linestyle='--', linewidth=2, alpha=0.5, label='NegCon')

# Add fold change labels
for i, (cps, cond) in enumerate(zip(cells_per_site, condition_order)):
    if cond != 'NegCon':
        fc = cps / negcon_cells_per_site
        ax1.text(i, cps + 1, f'{fc:.2f}x', ha='center', va='bottom', 
                fontweight='bold', fontsize=9)

# 2. Nucleus area distribution
ax2 = fig.add_subplot(gs[0, 1])
for condition in condition_order:
    data = combined_df[combined_df['condition'] == condition]['nucleus_area']
    ax2.hist(data, bins=30, alpha=0.5, label=condition.replace('_', ' '))
ax2.set_xlabel('Nucleus Area (pixels)', fontsize=11)
ax2.set_ylabel('Frequency', fontsize=11)
ax2.set_title('Nucleus Area Distribution', fontsize=12, fontweight='bold')
ax2.legend(fontsize=8)
ax2.grid(alpha=0.3)

# 3. Nucleus intensity boxplot
ax3 = fig.add_subplot(gs[0, 2])
data_to_plot = [combined_df[combined_df['condition'] == c]['nucleus_intensity'].values 
                for c in condition_order]
bp = ax3.boxplot(data_to_plot, labels=[c.replace('_', '\n') for c in condition_order], patch_artist=True)
for patch, color in zip(bp['boxes'], colors[:len(condition_order)]):
    patch.set_facecolor(color)
    patch.set_alpha(0.6)
ax3.set_ylabel('Nucleus Intensity', fontsize=11)
ax3.set_title('Nuclear DNA Intensity', fontsize=12, fontweight='bold')
plt.setp(ax3.xaxis.get_majorticklabels(), rotation=0, ha='center', fontsize=9)
ax3.grid(axis='y', alpha=0.3)

# 4. Mitochondrial intensity boxplot
ax4 = fig.add_subplot(gs[1, 0])
data_to_plot = [combined_df[combined_df['condition'] == c]['mito_intensity'].values 
                for c in condition_order]
bp = ax4.boxplot(data_to_plot, labels=[c.replace('_', '\n') for c in condition_order], patch_artist=True)
for patch, color in zip(bp['boxes'], colors[:len(condition_order)]):
    patch.set_facecolor(color)
    patch.set_alpha(0.6)
ax4.set_ylabel('Mitochondrial Intensity', fontsize=11)
ax4.set_title('Mitochondrial Intensity', fontsize=12, fontweight='bold')
plt.setp(ax4.xaxis.get_majorticklabels(), rotation=0, ha='center', fontsize=9)
ax4.grid(axis='y', alpha=0.3)

# 5. Nucleus eccentricity
ax5 = fig.add_subplot(gs[1, 1])
data_to_plot = [combined_df[combined_df['condition'] == c]['nucleus_eccentricity'].values 
                for c in condition_order]
bp = ax5.boxplot(data_to_plot, labels=[c.replace('_', '\n') for c in condition_order], patch_artist=True)
for patch, color in zip(bp['boxes'], colors[:len(condition_order)]):
    patch.set_facecolor(color)
    patch.set_alpha(0.6)
ax5.set_ylabel('Nucleus Eccentricity', fontsize=11)
ax5.set_title('Nuclear Shape (0=round, 1=elongated)', fontsize=12, fontweight='bold')
plt.setp(ax5.xaxis.get_majorticklabels(), rotation=0, ha='center', fontsize=9)
ax5.grid(axis='y', alpha=0.3)

# 6. Scatter plot: Nucleus area vs intensity
ax6 = fig.add_subplot(gs[1, 2])
for condition, color in zip(condition_order, colors[:len(condition_order)]):
    data = combined_df[combined_df['condition'] == condition]
    ax6.scatter(data['nucleus_area'], data['nucleus_intensity'], 
               alpha=0.3, s=20, color=color, label=condition.replace('_', ' '))
ax6.set_xlabel('Nucleus Area (pixels)', fontsize=11)
ax6.set_ylabel('Nucleus Intensity', fontsize=11)
ax6.set_title('Nucleus Area vs Intensity', fontsize=12, fontweight='bold')
ax6.legend(fontsize=7, loc='best')
ax6.grid(alpha=0.3)

# 7. Summary statistics table
ax7 = fig.add_subplot(gs[2, :])
ax7.axis('off')

# Calculate mean values for each condition
summary_data = []
for condition in condition_order:
    cond_data = combined_df[combined_df['condition'] == condition]
    
    cells_per_site_val = cell_counts.loc[condition, 'cells_per_site']
    fc = cells_per_site_val / negcon_cells_per_site
    
    summary_data.append([
        condition.replace('_', ' '),
        f'{cells_per_site_val:.1f}',
        f'{fc:.2f}x',
        f'{cond_data["nucleus_area"].mean():.0f}',
        f'{cond_data["nucleus_intensity"].mean():.1f}',
        f'{cond_data["mito_intensity"].mean():.1f}',
        f'{cond_data["nucleus_eccentricity"].mean():.2f}'
    ])

table_text = [['Condition', 'Cells/Site', 'Fold Change', 'Nucleus\nArea', 
               'DNA\nIntensity', 'Mito\nIntensity', 'Nucleus\nEccentricity']] + summary_data
table = ax7.table(cellText=table_text, cellLoc='center', loc='center',
                  colWidths=[0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.12])
table.auto_set_font_size(False)
table.set_fontsize(9)
table.scale(1, 2)

# Style header row
for i in range(7):
    table[(0, i)].set_facecolor('#3498db')
    table[(0, i)].set_text_props(weight='bold', color='white')

# Color code rows
for i, color in enumerate(colors[:len(condition_order)], start=1):
    table[(i, 0)].set_facecolor(color)
    table[(i, 0)].set_alpha(0.3)

ax7.set_title('Summary Statistics', fontsize=13, fontweight='bold', pad=20)

plt.suptitle('Death Receptor Pathway: Comprehensive Analysis (OE vs KO)', 
             fontsize=16, fontweight='bold', y=0.995)

plt.savefig('comprehensive_death_receptor_analysis.png', dpi=150, bbox_inches='tight')
print("\nSaved: comprehensive_death_receptor_analysis.png")
plt.close()

print("\nAnalysis complete!")
