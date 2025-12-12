import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Load CellProfiler results
cells = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Cells.csv')
nuclei = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Nuclei.csv')
cytoplasm = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Cytoplasm.csv')
nucleoli = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Nucleoli.csv')
image = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Image.csv')

print("=== Dataset Overview ===")
print(f"Number of images: {len(image)}")
print(f"Number of cells: {len(cells)}")
print(f"Number of nuclei: {len(nuclei)}")
print(f"Number of nucleoli: {len(nucleoli)}")

# Identify VHL KO vs control
print("\n=== Image Metadata ===")
print(image[['Metadata_Plate', 'Metadata_Well']].to_string())

# Add condition labels
cells['Condition'] = cells['Metadata_Plate'].apply(
    lambda x: 'VHL_CRISPR_KO' if 'CP-CC9' in str(x) else 'Negative_Control'
)
nuclei['Condition'] = nuclei['Metadata_Plate'].apply(
    lambda x: 'VHL_CRISPR_KO' if 'CP-CC9' in str(x) else 'Negative_Control'
)
cytoplasm['Condition'] = cytoplasm['Metadata_Plate'].apply(
    lambda x: 'VHL_CRISPR_KO' if 'CP-CC9' in str(x) else 'Negative_Control'
)
nucleoli['Condition'] = nucleoli['Metadata_Plate'].apply(
    lambda x: 'VHL_CRISPR_KO' if 'CP-CC9' in str(x) else 'Negative_Control'
)

print(f"\nVHL CRISPR KO cells: {len(cells[cells['Condition']=='VHL_CRISPR_KO'])}")
print(f"Negative control cells: {len(cells[cells['Condition']=='Negative_Control'])}")

# Key morphological features to analyze
features_to_analyze = {
    'Cell Size': 'AreaShape_Area',
    'Cell Perimeter': 'AreaShape_Perimeter',
    'Cell Compactness': 'AreaShape_Compactness',
    'Cell FormFactor': 'AreaShape_FormFactor',
    'Cell Eccentricity': 'AreaShape_Eccentricity',
}

nuclei_features = {
    'Nuclei Area': 'AreaShape_Area',
    'Nuclei Perimeter': 'AreaShape_Perimeter',
    'Nuclei Compactness': 'AreaShape_Compactness',
    'Nuclei FormFactor': 'AreaShape_FormFactor',
    'Nuclei DNA Intensity': 'Intensity_MeanIntensity_OrigDNA',
    'Nuclei DNA Texture': 'Texture_InfoMeas2_OrigDNA_3_00_256',
}

# Calculate statistics
print("\n=== Cell Morphology Statistics ===")
results = []
for name, feature in features_to_analyze.items():
    if feature in cells.columns:
        vhl_vals = cells[cells['Condition']=='VHL_CRISPR_KO'][feature].dropna()
        ctrl_vals = cells[cells['Condition']=='Negative_Control'][feature].dropna()
        
        vhl_mean = vhl_vals.mean()
        ctrl_mean = ctrl_vals.mean()
        fold_change = vhl_mean / ctrl_mean if ctrl_mean != 0 else np.nan
        
        # Statistical test
        t_stat, p_val = stats.ttest_ind(vhl_vals, ctrl_vals)
        
        print(f"\n{name}:")
        print(f"  VHL KO: {vhl_mean:.2f} ± {vhl_vals.std():.2f}")
        print(f"  Control: {ctrl_mean:.2f} ± {ctrl_vals.std():.2f}")
        print(f"  Fold Change: {fold_change:.3f}")
        print(f"  P-value: {p_val:.2e}")
        
        results.append({
            'Feature': name,
            'VHL_KO_Mean': vhl_mean,
            'Control_Mean': ctrl_mean,
            'Fold_Change': fold_change,
            'P_value': p_val
        })

print("\n=== Nuclei Morphology Statistics ===")
for name, feature in nuclei_features.items():
    if feature in nuclei.columns:
        vhl_vals = nuclei[nuclei['Condition']=='VHL_CRISPR_KO'][feature].dropna()
        ctrl_vals = nuclei[nuclei['Condition']=='Negative_Control'][feature].dropna()
        
        vhl_mean = vhl_vals.mean()
        ctrl_mean = ctrl_vals.mean()
        fold_change = vhl_mean / ctrl_mean if ctrl_mean != 0 else np.nan
        
        t_stat, p_val = stats.ttest_ind(vhl_vals, ctrl_vals)
        
        print(f"\n{name}:")
        print(f"  VHL KO: {vhl_mean:.2f} ± {vhl_vals.std():.2f}")
        print(f"  Control: {ctrl_mean:.2f} ± {ctrl_vals.std():.2f}")
        print(f"  Fold Change: {fold_change:.3f}")
        print(f"  P-value: {p_val:.2e}")
        
        results.append({
            'Feature': name,
            'VHL_KO_Mean': vhl_mean,
            'Control_Mean': ctrl_mean,
            'Fold_Change': fold_change,
            'P_value': p_val
        })

# Nucleoli analysis
print("\n=== Nucleoli Analysis ===")
nucleoli_per_cell_vhl = nucleoli[nucleoli['Condition']=='VHL_CRISPR_KO'].groupby(['Metadata_Plate', 'Metadata_Well', 'Parent_Nuclei']).size()
nucleoli_per_cell_ctrl = nucleoli[nucleoli['Condition']=='Negative_Control'].groupby(['Metadata_Plate', 'Metadata_Well', 'Parent_Nuclei']).size()

print(f"Nucleoli per cell (VHL KO): {nucleoli_per_cell_vhl.mean():.2f} ± {nucleoli_per_cell_vhl.std():.2f}")
print(f"Nucleoli per cell (Control): {nucleoli_per_cell_ctrl.mean():.2f} ± {nucleoli_per_cell_ctrl.std():.2f}")

# Nucleoli size
if 'AreaShape_Area' in nucleoli.columns:
    vhl_nucleoli_area = nucleoli[nucleoli['Condition']=='VHL_CRISPR_KO']['AreaShape_Area']
    ctrl_nucleoli_area = nucleoli[nucleoli['Condition']=='Negative_Control']['AreaShape_Area']
    print(f"Nucleoli area (VHL KO): {vhl_nucleoli_area.mean():.2f} ± {vhl_nucleoli_area.std():.2f}")
    print(f"Nucleoli area (Control): {ctrl_nucleoli_area.mean():.2f} ± {ctrl_nucleoli_area.std():.2f}")

# Save results
results_df = pd.DataFrame(results)
results_df.to_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_morphology_stats.csv', index=False)
print("\n✓ Saved morphology statistics to vhl_morphology_stats.csv")

# Create visualizations
fig, axes = plt.subplots(3, 3, figsize=(18, 15))
axes = axes.flatten()

# Plot 1: Cell Area Distribution
ax = axes[0]
cells[cells['Condition']=='Negative_Control']['AreaShape_Area'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
cells[cells['Condition']=='VHL_CRISPR_KO']['AreaShape_Area'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
ax.set_xlabel('Cell Area (pixels²)')
ax.set_ylabel('Frequency')
ax.set_title('Cell Area Distribution')
ax.legend()

# Plot 2: Cell FormFactor
ax = axes[1]
cells[cells['Condition']=='Negative_Control']['AreaShape_FormFactor'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
cells[cells['Condition']=='VHL_CRISPR_KO']['AreaShape_FormFactor'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
ax.set_xlabel('Cell FormFactor')
ax.set_ylabel('Frequency')
ax.set_title('Cell FormFactor (Circularity)')
ax.legend()

# Plot 3: Nuclei Area
ax = axes[2]
nuclei[nuclei['Condition']=='Negative_Control']['AreaShape_Area'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
nuclei[nuclei['Condition']=='VHL_CRISPR_KO']['AreaShape_Area'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
ax.set_xlabel('Nuclei Area (pixels²)')
ax.set_ylabel('Frequency')
ax.set_title('Nuclei Area Distribution')
ax.legend()

# Plot 4: Nuclei DNA Intensity
ax = axes[3]
if 'Intensity_MeanIntensity_OrigDNA' in nuclei.columns:
    nuclei[nuclei['Condition']=='Negative_Control']['Intensity_MeanIntensity_OrigDNA'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
    nuclei[nuclei['Condition']=='VHL_CRISPR_KO']['Intensity_MeanIntensity_OrigDNA'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
    ax.set_xlabel('DNA Mean Intensity')
    ax.set_ylabel('Frequency')
    ax.set_title('Nuclear DNA Intensity')
    ax.legend()

# Plot 5: Nucleoli per cell
ax = axes[4]
ax.hist([nucleoli_per_cell_ctrl, nucleoli_per_cell_vhl], bins=range(0, 10), alpha=0.5, label=['Control', 'VHL KO'], color=['blue', 'red'])
ax.set_xlabel('Nucleoli per Cell')
ax.set_ylabel('Frequency')
ax.set_title('Nucleoli Count Distribution')
ax.legend()

# Plot 6: Nucleoli Area
ax = axes[5]
if 'AreaShape_Area' in nucleoli.columns:
    nucleoli[nucleoli['Condition']=='Negative_Control']['AreaShape_Area'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
    nucleoli[nucleoli['Condition']=='VHL_CRISPR_KO']['AreaShape_Area'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
    ax.set_xlabel('Nucleoli Area (pixels²)')
    ax.set_ylabel('Frequency')
    ax.set_title('Nucleoli Size Distribution')
    ax.legend()

# Plot 7: Cell Eccentricity
ax = axes[6]
cells[cells['Condition']=='Negative_Control']['AreaShape_Eccentricity'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
cells[cells['Condition']=='VHL_CRISPR_KO']['AreaShape_Eccentricity'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
ax.set_xlabel('Cell Eccentricity')
ax.set_ylabel('Frequency')
ax.set_title('Cell Eccentricity (Elongation)')
ax.legend()

# Plot 8: Nuclei/Cell Area Ratio
ax = axes[7]
# Merge cells and nuclei data
merged = cells.merge(nuclei, on=['ImageNumber', 'ObjectNumber'], suffixes=('_cell', '_nuclei'))
merged['NC_Ratio'] = merged['AreaShape_Area_nuclei'] / merged['AreaShape_Area_cell']
merged[merged['Condition_cell']=='Negative_Control']['NC_Ratio'].hist(bins=50, alpha=0.5, label='Control', ax=ax, color='blue')
merged[merged['Condition_cell']=='VHL_CRISPR_KO']['NC_Ratio'].hist(bins=50, alpha=0.5, label='VHL KO', ax=ax, color='red')
ax.set_xlabel('Nuclei/Cell Area Ratio')
ax.set_ylabel('Frequency')
ax.set_title('Nuclear-Cytoplasmic Ratio')
ax.legend()

# Plot 9: Fold changes bar plot
ax = axes[8]
top_features = results_df.nsmallest(8, 'P_value')
colors = ['red' if fc > 1 else 'blue' for fc in top_features['Fold_Change']]
ax.barh(range(len(top_features)), top_features['Fold_Change'], color=colors, alpha=0.7)
ax.set_yticks(range(len(top_features)))
ax.set_yticklabels(top_features['Feature'], fontsize=8)
ax.axvline(x=1, color='black', linestyle='--', linewidth=1)
ax.set_xlabel('Fold Change (VHL KO / Control)')
ax.set_title('Top Morphological Changes')
ax.grid(axis='x', alpha=0.3)

plt.suptitle('VHL CRISPR Knockout - Morphological Analysis', fontsize=16, fontweight='bold', y=0.995)
plt.tight_layout()
plt.savefig('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_morphology_analysis.png', dpi=300, bbox_inches='tight')
print("✓ Saved visualization to vhl_morphology_analysis.png")

