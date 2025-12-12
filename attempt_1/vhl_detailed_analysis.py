import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# VHL JCP ID
vhl_jcp = 'JCP2022_807648'

print("="*80)
print("VHL (Von Hippel-Lindau) Detailed Analysis")
print("="*80)

# Load interpretable features
print("\nLoading interpretable CRISPR data...")
interp_df = pd.read_parquet('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_crispr.parquet')

# Get VHL data
vhl_interp = interp_df[interp_df['Metadata_JCP2022'] == vhl_jcp]
print(f"VHL wells: {len(vhl_interp)}")

# Get control data (sample)
# Use all non-VHL as control
control_interp = interp_df[interp_df['Metadata_JCP2022'] != vhl_jcp].sample(n=min(20000, len(interp_df)-len(vhl_interp)), random_state=42)
print(f"Control wells: {len(control_interp)}")

# Get feature columns
interp_features = [col for col in interp_df.columns if not col.startswith('Metadata')]

# Calculate statistics properly
print("\n" + "="*80)
print("Statistical Analysis")
print("="*80)

# Key features to analyze
key_features = {
    'Cell_Area': 'Cells_AreaShape_Area',
    'Nuclei_Area': 'Nuclei_AreaShape_Area',
    'Cytoplasm_Area': 'Cytoplasm_AreaShape_Area',
    'Cell_Count': 'Count_Cells',
    'Nuclei_Count': 'Count_Nuclei',
}

# Add intensity features
for channel in ['DNA', 'ER', 'AGP', 'Mito', 'RNA']:
    for compartment in ['Cells', 'Nuclei', 'Cytoplasm']:
        feat_name = f'{compartment}_Intensity_MeanIntensity_{channel}'
        if feat_name in interp_features:
            key_features[f'{compartment}_{channel}_Intensity'] = feat_name

results = {}

for name, feat in key_features.items():
    if feat not in interp_features:
        continue
    
    vhl_vals = vhl_interp[feat].values
    control_vals = control_interp[feat].values
    
    vhl_mean = np.mean(vhl_vals)
    control_mean = np.mean(control_vals)
    
    vhl_std = np.std(vhl_vals)
    control_std = np.std(control_vals)
    
    # Calculate fold change
    if control_mean != 0:
        fold_change = vhl_mean / control_mean
    else:
        fold_change = np.nan
    
    # T-test
    t_stat, p_val = stats.ttest_ind(vhl_vals, control_vals)
    
    # Cohen's d
    pooled_std = np.sqrt((vhl_std**2 + control_std**2) / 2)
    if pooled_std != 0:
        cohens_d = (vhl_mean - control_mean) / pooled_std
    else:
        cohens_d = np.nan
    
    results[name] = {
        'vhl_mean': vhl_mean,
        'control_mean': control_mean,
        'fold_change': fold_change,
        'p_value': p_val,
        'cohens_d': cohens_d
    }
    
    print(f"\n{name}:")
    print(f"  VHL: {vhl_mean:.2f} ± {vhl_std:.2f}")
    print(f"  Control: {control_mean:.2f} ± {control_std:.2f}")
    print(f"  Fold change: {fold_change:.3f}x")
    print(f"  P-value: {p_val:.2e}")
    print(f"  Cohen's d: {cohens_d:.3f}")

# Save results
with open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_detailed_results.json', 'w') as f:
    json.dump(results, f, indent=2, default=str)

print("\n" + "="*80)
print("Results saved to vhl_detailed_results.json")
print("="*80)

# Create visualization
print("\nCreating visualizations...")

# Select top features for plotting
plot_features = [
    ('Cell_Area', 'Cell Area'),
    ('Nuclei_Area', 'Nuclei Area'),
    ('Cytoplasm_Area', 'Cytoplasm Area'),
    ('Cells_Mito_Intensity', 'Mitochondria Intensity'),
    ('Cells_ER_Intensity', 'ER Intensity'),
    ('Cells_DNA_Intensity', 'DNA Intensity'),
    ('Cells_RNA_Intensity', 'RNA Intensity'),
    ('Cells_AGP_Intensity', 'AGP Intensity'),
]

fig, axes = plt.subplots(2, 4, figsize=(16, 8))
axes = axes.flatten()

for idx, (feat_key, feat_label) in enumerate(plot_features):
    if feat_key not in results:
        continue
    
    ax = axes[idx]
    
    # Get data
    feat_name = key_features[feat_key]
    vhl_vals = vhl_interp[feat_name].values
    control_vals = control_interp[feat_name].values
    
    # Create violin plot
    data_to_plot = [control_vals, vhl_vals]
    parts = ax.violinplot(data_to_plot, positions=[0, 1], showmeans=True, showmedians=True)
    
    ax.set_xticks([0, 1])
    ax.set_xticklabels(['Control', 'VHL KO'])
    ax.set_ylabel(feat_label)
    ax.set_title(f"{feat_label}\n(FC: {results[feat_key]['fold_change']:.2f}x, p={results[feat_key]['p_value']:.2e})")
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_feature_comparison.png', dpi=300, bbox_inches='tight')
print("Saved vhl_feature_comparison.png")

# Create summary plot
fig, ax = plt.subplots(figsize=(10, 8))

# Get fold changes for plotting
fc_data = []
for name, res in results.items():
    if not np.isnan(res['fold_change']) and not np.isinf(res['fold_change']):
        fc_data.append((name, res['fold_change'], res['p_value']))

# Sort by fold change
fc_data.sort(key=lambda x: abs(x[1] - 1), reverse=True)

# Take top 20
fc_data = fc_data[:20]

names = [x[0] for x in fc_data]
fcs = [x[1] for x in fc_data]
pvals = [x[2] for x in fc_data]

# Color by significance
colors = ['red' if p < 0.001 else 'orange' if p < 0.01 else 'yellow' if p < 0.05 else 'gray' for p in pvals]

y_pos = np.arange(len(names))
ax.barh(y_pos, fcs, color=colors, alpha=0.7)
ax.set_yticks(y_pos)
ax.set_yticklabels(names, fontsize=8)
ax.set_xlabel('Fold Change (VHL KO / Control)')
ax.set_title('VHL Knockout: Top 20 Changed Features')
ax.axvline(x=1, color='black', linestyle='--', linewidth=1)
ax.grid(True, alpha=0.3, axis='x')

# Add legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor='red', alpha=0.7, label='p < 0.001'),
    Patch(facecolor='orange', alpha=0.7, label='p < 0.01'),
    Patch(facecolor='yellow', alpha=0.7, label='p < 0.05'),
    Patch(facecolor='gray', alpha=0.7, label='p >= 0.05')
]
ax.legend(handles=legend_elements, loc='best')

plt.tight_layout()
plt.savefig('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_top_changes.png', dpi=300, bbox_inches='tight')
print("Saved vhl_top_changes.png")

print("\nAnalysis complete!")

