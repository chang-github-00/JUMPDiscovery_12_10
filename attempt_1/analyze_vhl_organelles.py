import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Load CellProfiler results
cells = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Cells.csv')
nuclei = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Nuclei.csv')
cytoplasm = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_cp_output/Cytoplasm.csv')

# Add condition labels
for df in [cells, nuclei, cytoplasm]:
    df['Condition'] = df['Metadata_Plate'].apply(
        lambda x: 'VHL_CRISPR_KO' if 'CP-CC9' in str(x) else 'Negative_Control'
    )

print("=== Mitochondrial Analysis ===")
# Mitochondrial features
mito_features = [col for col in cells.columns if 'Mito' in col and 'Intensity' in col]
print(f"Found {len(mito_features)} mitochondrial features")

mito_results = []
for feature in mito_features[:10]:  # Top 10 features
    vhl_vals = cells[cells['Condition']=='VHL_CRISPR_KO'][feature].dropna()
    ctrl_vals = cells[cells['Condition']=='Negative_Control'][feature].dropna()
    
    if len(vhl_vals) > 0 and len(ctrl_vals) > 0:
        vhl_mean = vhl_vals.mean()
        ctrl_mean = ctrl_vals.mean()
        fold_change = vhl_mean / ctrl_mean if ctrl_mean != 0 else np.nan
        
        t_stat, p_val = stats.ttest_ind(vhl_vals, ctrl_vals)
        
        mito_results.append({
            'Feature': feature.replace('Intensity_', '').replace('OrigMito', 'Mito'),
            'VHL_KO': vhl_mean,
            'Control': ctrl_mean,
            'Fold_Change': fold_change,
            'P_value': p_val
        })

mito_df = pd.DataFrame(mito_results).sort_values('P_value')
print("\nTop Mitochondrial Changes:")
print(mito_df.head(10).to_string(index=False))

print("\n=== ER Analysis ===")
# ER features
er_features = [col for col in cells.columns if 'ER' in col and 'Intensity' in col]
print(f"Found {len(er_features)} ER features")

er_results = []
for feature in er_features[:10]:
    vhl_vals = cells[cells['Condition']=='VHL_CRISPR_KO'][feature].dropna()
    ctrl_vals = cells[cells['Condition']=='Negative_Control'][feature].dropna()
    
    if len(vhl_vals) > 0 and len(ctrl_vals) > 0:
        vhl_mean = vhl_vals.mean()
        ctrl_mean = ctrl_vals.mean()
        fold_change = vhl_mean / ctrl_mean if ctrl_mean != 0 else np.nan
        
        t_stat, p_val = stats.ttest_ind(vhl_vals, ctrl_vals)
        
        er_results.append({
            'Feature': feature.replace('Intensity_', '').replace('OrigER', 'ER'),
            'VHL_KO': vhl_mean,
            'Control': ctrl_mean,
            'Fold_Change': fold_change,
            'P_value': p_val
        })

er_df = pd.DataFrame(er_results).sort_values('P_value')
print("\nTop ER Changes:")
print(er_df.head(10).to_string(index=False))

print("\n=== RNA/Transcription Analysis ===")
# RNA features
rna_features = [col for col in cells.columns if 'RNA' in col and 'Intensity' in col]
print(f"Found {len(rna_features)} RNA features")

rna_results = []
for feature in rna_features[:10]:
    vhl_vals = cells[cells['Condition']=='VHL_CRISPR_KO'][feature].dropna()
    ctrl_vals = cells[cells['Condition']=='Negative_Control'][feature].dropna()
    
    if len(vhl_vals) > 0 and len(ctrl_vals) > 0:
        vhl_mean = vhl_vals.mean()
        ctrl_mean = ctrl_vals.mean()
        fold_change = vhl_mean / ctrl_mean if ctrl_mean != 0 else np.nan
        
        t_stat, p_val = stats.ttest_ind(vhl_vals, ctrl_vals)
        
        rna_results.append({
            'Feature': feature.replace('Intensity_', '').replace('OrigRNA', 'RNA'),
            'VHL_KO': vhl_mean,
            'Control': ctrl_mean,
            'Fold_Change': fold_change,
            'P_value': p_val
        })

rna_df = pd.DataFrame(rna_results).sort_values('P_value')
print("\nTop RNA Changes:")
print(rna_df.head(10).to_string(index=False))

# Create comprehensive visualization
fig, axes = plt.subplots(2, 3, figsize=(18, 12))

# Plot 1: Mitochondrial Intensity
ax = axes[0, 0]
if 'Intensity_MeanIntensity_OrigMito' in cells.columns:
    data = [
        cells[cells['Condition']=='Negative_Control']['Intensity_MeanIntensity_OrigMito'].dropna(),
        cells[cells['Condition']=='VHL_CRISPR_KO']['Intensity_MeanIntensity_OrigMito'].dropna()
    ]
    bp = ax.boxplot(data, labels=['Control', 'VHL KO'], patch_artist=True)
    bp['boxes'][0].set_facecolor('blue')
    bp['boxes'][1].set_facecolor('red')
    ax.set_ylabel('Mean Intensity')
    ax.set_title('Mitochondrial Intensity')
    ax.grid(axis='y', alpha=0.3)

# Plot 2: ER Intensity
ax = axes[0, 1]
if 'Intensity_MeanIntensity_OrigER' in cells.columns:
    data = [
        cells[cells['Condition']=='Negative_Control']['Intensity_MeanIntensity_OrigER'].dropna(),
        cells[cells['Condition']=='VHL_CRISPR_KO']['Intensity_MeanIntensity_OrigER'].dropna()
    ]
    bp = ax.boxplot(data, labels=['Control', 'VHL KO'], patch_artist=True)
    bp['boxes'][0].set_facecolor('blue')
    bp['boxes'][1].set_facecolor('red')
    ax.set_ylabel('Mean Intensity')
    ax.set_title('ER Intensity')
    ax.grid(axis='y', alpha=0.3)

# Plot 3: RNA Intensity
ax = axes[0, 2]
if 'Intensity_MeanIntensity_OrigRNA' in cells.columns:
    data = [
        cells[cells['Condition']=='Negative_Control']['Intensity_MeanIntensity_OrigRNA'].dropna(),
        cells[cells['Condition']=='VHL_CRISPR_KO']['Intensity_MeanIntensity_OrigRNA'].dropna()
    ]
    bp = ax.boxplot(data, labels=['Control', 'VHL KO'], patch_artist=True)
    bp['boxes'][0].set_facecolor('blue')
    bp['boxes'][1].set_facecolor('red')
    ax.set_ylabel('Mean Intensity')
    ax.set_title('RNA Intensity')
    ax.grid(axis='y', alpha=0.3)

# Plot 4: Mitochondrial Texture (Granularity)
ax = axes[1, 0]
mito_texture_cols = [col for col in cells.columns if 'Texture' in col and 'Mito' in col and 'Correlation' in col]
if len(mito_texture_cols) > 0:
    feature = mito_texture_cols[0]
    data = [
        cells[cells['Condition']=='Negative_Control'][feature].dropna(),
        cells[cells['Condition']=='VHL_CRISPR_KO'][feature].dropna()
    ]
    bp = ax.boxplot(data, labels=['Control', 'VHL KO'], patch_artist=True)
    bp['boxes'][0].set_facecolor('blue')
    bp['boxes'][1].set_facecolor('red')
    ax.set_ylabel('Texture Correlation')
    ax.set_title('Mitochondrial Texture\n(Fragmentation Indicator)')
    ax.grid(axis='y', alpha=0.3)

# Plot 5: Top Fold Changes
ax = axes[1, 1]
all_results = pd.concat([mito_df.head(3), er_df.head(3), rna_df.head(3)])
all_results = all_results.sort_values('Fold_Change', ascending=False)
colors = ['red' if fc > 1 else 'blue' for fc in all_results['Fold_Change']]
y_pos = range(len(all_results))
ax.barh(y_pos, all_results['Fold_Change'], color=colors, alpha=0.7)
ax.set_yticks(y_pos)
ax.set_yticklabels([f.split('_')[0][:20] for f in all_results['Feature']], fontsize=8)
ax.axvline(x=1, color='black', linestyle='--', linewidth=1)
ax.set_xlabel('Fold Change (VHL KO / Control)')
ax.set_title('Top Organelle Changes')
ax.grid(axis='x', alpha=0.3)

# Plot 6: DNA Intensity in Nuclei
ax = axes[1, 2]
if 'Intensity_IntegratedIntensity_OrigDNA' in nuclei.columns:
    data = [
        nuclei[nuclei['Condition']=='Negative_Control']['Intensity_IntegratedIntensity_OrigDNA'].dropna(),
        nuclei[nuclei['Condition']=='VHL_CRISPR_KO']['Intensity_IntegratedIntensity_OrigDNA'].dropna()
    ]
    bp = ax.boxplot(data, labels=['Control', 'VHL KO'], patch_artist=True)
    bp['boxes'][0].set_facecolor('blue')
    bp['boxes'][1].set_facecolor('red')
    ax.set_ylabel('Integrated Intensity')
    ax.set_title('Nuclear DNA Content')
    ax.grid(axis='y', alpha=0.3)

plt.suptitle('VHL CRISPR Knockout - Organelle Analysis', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_organelle_analysis.png', dpi=300, bbox_inches='tight')
print("\n✓ Saved organelle analysis to vhl_organelle_analysis.png")

# Save all results
all_organelle_results = pd.concat([
    mito_df.assign(Organelle='Mitochondria'),
    er_df.assign(Organelle='ER'),
    rna_df.assign(Organelle='RNA')
])
all_organelle_results.to_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_organelle_stats.csv', index=False)
print("✓ Saved organelle statistics to vhl_organelle_stats.csv")

