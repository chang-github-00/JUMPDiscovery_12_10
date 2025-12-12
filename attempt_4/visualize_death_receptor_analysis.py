import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Load measurements
df = pd.read_csv('death_receptor_cell_measurements.csv')

# Remove FADD outliers (likely debris)
df_clean = df[df['nc_ratio'] < 1.0].copy()

print("="*80)
print("CELL COUNT ANALYSIS")
print("="*80)
print("\nCell counts per condition:")
print(df.groupby('condition')['cell_id'].count())
print("\nCell counts after filtering (nc_ratio < 1.0):")
print(df_clean.groupby('condition')['cell_id'].count())

# Create comprehensive visualization
fig = plt.figure(figsize=(20, 12))
gs = fig.add_gridspec(3, 4, hspace=0.3, wspace=0.3)

# 1. Cell count comparison
ax1 = fig.add_subplot(gs[0, 0])
cell_counts = df.groupby('condition')['cell_id'].count()
colors = ['#2ecc71', '#e74c3c', '#9b59b6', '#3498db']
ax1.bar(range(len(cell_counts)), cell_counts.values, color=colors)
ax1.set_xticks(range(len(cell_counts)))
ax1.set_xticklabels(cell_counts.index, rotation=45, ha='right')
ax1.set_ylabel('Cell Count', fontsize=12, fontweight='bold')
ax1.set_title('Cell Density (Total Cells Detected)', fontsize=12, fontweight='bold')
ax1.grid(axis='y', alpha=0.3)

# Add percentage labels
negcon_count = cell_counts['NegCon']
for i, (cond, count) in enumerate(cell_counts.items()):
    pct = (count / negcon_count) * 100
    ax1.text(i, count + 1, f'{pct:.0f}%', ha='center', va='bottom', fontweight='bold')

# 2. Cell area distribution
ax2 = fig.add_subplot(gs[0, 1])
for condition in ['NegCon', 'CASP8_OE', 'FADD_OE', 'TNFRSF10B_OE']:
    data = df_clean[df_clean['condition'] == condition]['cell_area']
    if len(data) > 0:
        ax2.hist(data, bins=20, alpha=0.6, label=condition)
ax2.set_xlabel('Cell Area (pixels)', fontsize=11)
ax2.set_ylabel('Frequency', fontsize=11)
ax2.set_title('Cell Area Distribution', fontsize=12, fontweight='bold')
ax2.legend()
ax2.grid(alpha=0.3)

# 3. Nuclear/Cytoplasmic ratio
ax3 = fig.add_subplot(gs[0, 2])
df_clean.boxplot(column='nc_ratio', by='condition', ax=ax3)
ax3.set_xlabel('Condition', fontsize=11)
ax3.set_ylabel('Nuclear/Cytoplasmic Ratio', fontsize=11)
ax3.set_title('Nuclear/Cytoplasmic Ratio', fontsize=12, fontweight='bold')
plt.sca(ax3)
plt.xticks(rotation=45, ha='right')
ax3.get_figure().suptitle('')  # Remove default title

# 4. DNA intensity
ax4 = fig.add_subplot(gs[0, 3])
df_clean.boxplot(column='dna_nucleus_intensity', by='condition', ax=ax4)
ax4.set_xlabel('Condition', fontsize=11)
ax4.set_ylabel('DNA Intensity (Nucleus)', fontsize=11)
ax4.set_title('Nuclear DNA Intensity', fontsize=12, fontweight='bold')
plt.sca(ax4)
plt.xticks(rotation=45, ha='right')
ax4.get_figure().suptitle('')

# 5. Mitochondrial intensity
ax5 = fig.add_subplot(gs[1, 0])
df_clean.boxplot(column='mito_intensity', by='condition', ax=ax5)
ax5.set_xlabel('Condition', fontsize=11)
ax5.set_ylabel('Mitochondrial Intensity', fontsize=11)
ax5.set_title('Mitochondrial Intensity', fontsize=12, fontweight='bold')
plt.sca(ax5)
plt.xticks(rotation=45, ha='right')
ax5.get_figure().suptitle('')

# 6. Cell eccentricity (roundness)
ax6 = fig.add_subplot(gs[1, 1])
df_clean.boxplot(column='eccentricity', by='condition', ax=ax6)
ax6.set_xlabel('Condition', fontsize=11)
ax6.set_ylabel('Eccentricity', fontsize=11)
ax6.set_title('Cell Eccentricity (0=round, 1=elongated)', fontsize=12, fontweight='bold')
plt.sca(ax6)
plt.xticks(rotation=45, ha='right')
ax6.get_figure().suptitle('')

# 7. Cell solidity (membrane integrity)
ax7 = fig.add_subplot(gs[1, 2])
df_clean.boxplot(column='solidity', by='condition', ax=ax7)
ax7.set_xlabel('Condition', fontsize=11)
ax7.set_ylabel('Solidity', fontsize=11)
ax7.set_title('Cell Solidity (Membrane Integrity)', fontsize=12, fontweight='bold')
plt.sca(ax7)
plt.xticks(rotation=45, ha='right')
ax7.get_figure().suptitle('')

# 8. DNA texture (chromatin condensation)
ax8 = fig.add_subplot(gs[1, 3])
df_clean.boxplot(column='dna_texture', by='condition', ax=ax8)
ax8.set_xlabel('Condition', fontsize=11)
ax8.set_ylabel('DNA Texture (Std Dev)', fontsize=11)
ax8.set_title('DNA Texture (Chromatin Condensation)', fontsize=12, fontweight='bold')
plt.sca(ax8)
plt.xticks(rotation=45, ha='right')
ax8.get_figure().suptitle('')

# 9. ER intensity
ax9 = fig.add_subplot(gs[2, 0])
df_clean.boxplot(column='er_intensity', by='condition', ax=ax9)
ax9.set_xlabel('Condition', fontsize=11)
ax9.set_ylabel('ER Intensity', fontsize=11)
ax9.set_title('ER Intensity', fontsize=12, fontweight='bold')
plt.sca(ax9)
plt.xticks(rotation=45, ha='right')
ax9.get_figure().suptitle('')

# 10. RNA intensity
ax10 = fig.add_subplot(gs[2, 1])
df_clean.boxplot(column='rna_intensity', by='condition', ax=ax10)
ax10.set_xlabel('Condition', fontsize=11)
ax10.set_ylabel('RNA Intensity', fontsize=11)
ax10.set_title('RNA Intensity', fontsize=12, fontweight='bold')
plt.sca(ax10)
plt.xticks(rotation=45, ha='right')
ax10.get_figure().suptitle('')

# 11. Mitochondrial texture
ax11 = fig.add_subplot(gs[2, 2])
df_clean.boxplot(column='mito_texture', by='condition', ax=ax11)
ax11.set_xlabel('Condition', fontsize=11)
ax11.set_ylabel('Mito Texture (Std Dev)', fontsize=11)
ax11.set_title('Mitochondrial Texture (Fragmentation)', fontsize=12, fontweight='bold')
plt.sca(ax11)
plt.xticks(rotation=45, ha='right')
ax11.get_figure().suptitle('')

# 12. Summary statistics table
ax12 = fig.add_subplot(gs[2, 3])
ax12.axis('off')

# Calculate fold changes relative to NegCon
summary_data = []
for condition in ['CASP8_OE', 'FADD_OE', 'TNFRSF10B_OE']:
    cond_data = df_clean[df_clean['condition'] == condition]
    negcon_data = df_clean[df_clean['condition'] == 'NegCon']
    
    if len(cond_data) > 0 and len(negcon_data) > 0:
        cell_count_fc = len(cond_data) / len(negcon_data)
        dna_fc = cond_data['dna_nucleus_intensity'].mean() / negcon_data['dna_nucleus_intensity'].mean()
        mito_fc = cond_data['mito_intensity'].mean() / negcon_data['mito_intensity'].mean()
        
        summary_data.append([
            condition.replace('_OE', ''),
            f'{cell_count_fc:.2f}x',
            f'{dna_fc:.2f}x',
            f'{mito_fc:.2f}x'
        ])

table_text = [['Gene', 'Cell\nCount', 'DNA\nIntensity', 'Mito\nIntensity']] + summary_data
table = ax12.table(cellText=table_text, cellLoc='center', loc='center',
                   colWidths=[0.3, 0.2, 0.2, 0.2])
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 2)

# Style header row
for i in range(4):
    table[(0, i)].set_facecolor('#3498db')
    table[(0, i)].set_text_props(weight='bold', color='white')

ax12.set_title('Fold Change vs NegCon', fontsize=12, fontweight='bold', pad=20)

plt.suptitle('Death Receptor Pathway Overexpression - Comprehensive Morphological Analysis', 
             fontsize=16, fontweight='bold', y=0.995)

plt.savefig('death_receptor_comprehensive_analysis.png', dpi=150, bbox_inches='tight')
print("\nSaved: death_receptor_comprehensive_analysis.png")
plt.close()

# Statistical summary
print("\n" + "="*80)
print("STATISTICAL SUMMARY (Fold Change vs NegCon)")
print("="*80)

negcon_data = df_clean[df_clean['condition'] == 'NegCon']

for condition in ['CASP8_OE', 'FADD_OE', 'TNFRSF10B_OE']:
    cond_data = df_clean[df_clean['condition'] == condition]
    
    if len(cond_data) > 0:
        print(f"\n{condition}:")
        print(f"  Cell count: {len(cond_data)} ({len(cond_data)/len(negcon_data):.2f}x)")
        print(f"  Mean cell area: {cond_data['cell_area'].mean():.1f} ({cond_data['cell_area'].mean()/negcon_data['cell_area'].mean():.2f}x)")
        print(f"  Mean N/C ratio: {cond_data['nc_ratio'].mean():.3f} ({cond_data['nc_ratio'].mean()/negcon_data['nc_ratio'].mean():.2f}x)")
        print(f"  Mean DNA intensity: {cond_data['dna_nucleus_intensity'].mean():.1f} ({cond_data['dna_nucleus_intensity'].mean()/negcon_data['dna_nucleus_intensity'].mean():.2f}x)")
        print(f"  Mean Mito intensity: {cond_data['mito_intensity'].mean():.1f} ({cond_data['mito_intensity'].mean()/negcon_data['mito_intensity'].mean():.2f}x)")
        print(f"  Mean eccentricity: {cond_data['eccentricity'].mean():.3f} ({cond_data['eccentricity'].mean()/negcon_data['eccentricity'].mean():.2f}x)")
        print(f"  Mean solidity: {cond_data['solidity'].mean():.3f} ({cond_data['solidity'].mean()/negcon_data['solidity'].mean():.2f}x)")

print("\nAnalysis complete!")
