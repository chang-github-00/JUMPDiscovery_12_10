#!/usr/bin/env python3
"""
Comprehensive morphological analysis of ITGAV knockout vs negative control
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from skimage import io, filters, measure, morphology, segmentation, exposure
from scipy import ndimage
import os
import glob
from pathlib import Path

def load_and_normalize(filepath):
    """Load image and normalize"""
    img = io.imread(filepath)
    return img.astype(float) / img.max()

def segment_nuclei(dna_img):
    """Segment nuclei from DNA channel"""
    # Gaussian smoothing
    smoothed = filters.gaussian(dna_img, sigma=2)
    # Threshold
    thresh = filters.threshold_otsu(smoothed)
    binary = smoothed > thresh
    # Remove small objects
    binary = morphology.remove_small_objects(binary, min_size=200)
    # Fill holes
    binary = ndimage.binary_fill_holes(binary)
    # Label
    labeled = measure.label(binary)
    return labeled

def segment_cells(agp_img, nuclei_labels):
    """Segment cells using AGP channel and nuclei seeds"""
    # Smooth AGP
    smoothed = filters.gaussian(agp_img, sigma=2)
    # Threshold
    thresh = filters.threshold_otsu(smoothed)
    binary = smoothed > thresh
    # Watershed from nuclei
    distance = ndimage.distance_transform_edt(binary)
    cells = segmentation.watershed(-distance, nuclei_labels, mask=binary)
    return cells

def measure_cell_features(nuclei_labels, cell_labels, dna_img, agp_img, mito_img, er_img, rna_img):
    """Measure comprehensive cell features"""
    features = []
    
    for region in measure.regionprops(cell_labels):
        cell_id = region.label
        
        # Get corresponding nucleus
        nucleus_mask = nuclei_labels == cell_id
        cell_mask = cell_labels == cell_id
        cytoplasm_mask = cell_mask & ~nucleus_mask
        
        if not np.any(nucleus_mask) or not np.any(cytoplasm_mask):
            continue
        
        # Basic morphology
        cell_area = region.area
        nucleus_area = np.sum(nucleus_mask)
        cytoplasm_area = np.sum(cytoplasm_mask)
        
        # Shape features
        cell_perimeter = region.perimeter
        cell_eccentricity = region.eccentricity
        cell_solidity = region.solidity
        cell_extent = region.extent
        
        # Form factor (circularity)
        cell_formfactor = (4 * np.pi * cell_area) / (cell_perimeter ** 2) if cell_perimeter > 0 else 0
        
        # Nuclear/cytoplasmic ratio
        nc_ratio = nucleus_area / cell_area if cell_area > 0 else 0
        
        # Intensity features
        dna_nucleus_mean = np.mean(dna_img[nucleus_mask])
        dna_nucleus_std = np.std(dna_img[nucleus_mask])
        
        agp_cell_mean = np.mean(agp_img[cell_mask])
        agp_cell_std = np.std(agp_img[cell_mask])
        agp_cytoplasm_mean = np.mean(agp_img[cytoplasm_mask])
        
        mito_cell_mean = np.mean(mito_img[cell_mask])
        mito_cell_std = np.std(mito_img[cell_mask])
        mito_cytoplasm_mean = np.mean(mito_img[cytoplasm_mask])
        
        er_cell_mean = np.mean(er_img[cell_mask])
        er_cytoplasm_mean = np.mean(er_img[cytoplasm_mask])
        
        rna_cell_mean = np.mean(rna_img[cell_mask])
        rna_nucleus_mean = np.mean(rna_img[nucleus_mask])
        
        # Texture features (variance as proxy for granularity)
        dna_texture = np.var(dna_img[nucleus_mask])
        agp_texture = np.var(agp_img[cell_mask])
        mito_texture = np.var(mito_img[cell_mask])
        
        # Correlation between channels
        agp_flat = agp_img[cell_mask].flatten()
        mito_flat = mito_img[cell_mask].flatten()
        dna_flat = dna_img[nucleus_mask].flatten()
        
        agp_mito_corr = np.corrcoef(agp_flat, mito_flat)[0, 1] if len(agp_flat) > 1 else 0
        
        features.append({
            'cell_id': cell_id,
            'cell_area': cell_area,
            'nucleus_area': nucleus_area,
            'cytoplasm_area': cytoplasm_area,
            'nc_ratio': nc_ratio,
            'cell_perimeter': cell_perimeter,
            'cell_eccentricity': cell_eccentricity,
            'cell_solidity': cell_solidity,
            'cell_extent': cell_extent,
            'cell_formfactor': cell_formfactor,
            'dna_nucleus_mean': dna_nucleus_mean,
            'dna_nucleus_std': dna_nucleus_std,
            'dna_texture': dna_texture,
            'agp_cell_mean': agp_cell_mean,
            'agp_cell_std': agp_cell_std,
            'agp_cytoplasm_mean': agp_cytoplasm_mean,
            'agp_texture': agp_texture,
            'mito_cell_mean': mito_cell_mean,
            'mito_cell_std': mito_cell_std,
            'mito_cytoplasm_mean': mito_cytoplasm_mean,
            'mito_texture': mito_texture,
            'er_cell_mean': er_cell_mean,
            'er_cytoplasm_mean': er_cytoplasm_mean,
            'rna_cell_mean': rna_cell_mean,
            'rna_nucleus_mean': rna_nucleus_mean,
            'agp_mito_corr': agp_mito_corr,
        })
    
    return pd.DataFrame(features)

def analyze_condition(image_dir, condition_name):
    """Analyze all images in a condition"""
    all_features = []
    
    # Find all sites
    dna_files = sorted(glob.glob(os.path.join(image_dir, "*_DNA.tiff")))
    
    print(f"\nAnalyzing {condition_name}: {len(dna_files)} sites")
    
    for dna_file in dna_files:
        base = dna_file.replace("_DNA.tiff", "")
        
        # Load all channels
        dna_img = load_and_normalize(dna_file)
        agp_img = load_and_normalize(base + "_AGP.tiff")
        mito_img = load_and_normalize(base + "_Mito.tiff")
        er_img = load_and_normalize(base + "_ER.tiff")
        rna_img = load_and_normalize(base + "_RNA.tiff")
        
        # Segment
        nuclei_labels = segment_nuclei(dna_img)
        cell_labels = segment_cells(agp_img, nuclei_labels)
        
        # Measure
        features = measure_cell_features(nuclei_labels, cell_labels, dna_img, agp_img, mito_img, er_img, rna_img)
        
        if len(features) > 0:
            features['site'] = os.path.basename(dna_file)
            features['condition'] = condition_name
            all_features.append(features)
            print(f"  {os.path.basename(dna_file)}: {len(features)} cells")
    
    if all_features:
        return pd.concat(all_features, ignore_index=True)
    else:
        return pd.DataFrame()

# Analyze both conditions
base_dir = "/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_6/ITGAV_analysis"

print("="*60)
print("ITGAV Morphological Analysis")
print("="*60)

ko_features = analyze_condition(os.path.join(base_dir, "ITGAV_knockout"), "ITGAV_KO")
negcon_features = analyze_condition(os.path.join(base_dir, "negcon"), "NegCon")

# Combine
all_features = pd.concat([ko_features, negcon_features], ignore_index=True)

# Save
all_features.to_csv(os.path.join(base_dir, "../ITGAV_cell_features.csv"), index=False)
print(f"\nSaved features to ITGAV_cell_features.csv")
print(f"Total cells analyzed: {len(all_features)}")
print(f"  ITGAV KO: {len(ko_features)} cells")
print(f"  NegCon: {len(negcon_features)} cells")

# Statistical comparison
print("\n" + "="*60)
print("Statistical Comparison (Mean ± SD)")
print("="*60)

key_features = [
    'cell_area', 'nucleus_area', 'nc_ratio', 'cell_formfactor',
    'agp_cell_mean', 'agp_cytoplasm_mean', 'agp_texture',
    'mito_cell_mean', 'mito_cytoplasm_mean', 'mito_texture',
    'dna_nucleus_mean', 'dna_texture',
    'agp_mito_corr'
]

comparison = []
for feature in key_features:
    ko_mean = ko_features[feature].mean()
    ko_std = ko_features[feature].std()
    nc_mean = negcon_features[feature].mean()
    nc_std = negcon_features[feature].std()
    
    # Calculate fold change
    fold_change = ko_mean / nc_mean if nc_mean != 0 else np.nan
    
    # Calculate effect size (Cohen's d)
    pooled_std = np.sqrt((ko_std**2 + nc_std**2) / 2)
    cohens_d = (ko_mean - nc_mean) / pooled_std if pooled_std != 0 else np.nan
    
    comparison.append({
        'Feature': feature,
        'ITGAV_KO_mean': ko_mean,
        'ITGAV_KO_std': ko_std,
        'NegCon_mean': nc_mean,
        'NegCon_std': nc_std,
        'Fold_Change': fold_change,
        'Cohens_d': cohens_d
    })
    
    print(f"{feature:25s}: KO={ko_mean:8.4f}±{ko_std:7.4f}  NC={nc_mean:8.4f}±{nc_std:7.4f}  FC={fold_change:6.3f}  d={cohens_d:6.3f}")

comparison_df = pd.DataFrame(comparison)
comparison_df.to_csv(os.path.join(base_dir, "../ITGAV_feature_comparison.csv"), index=False)

# Create comprehensive visualization
fig = plt.figure(figsize=(20, 16))
gs = fig.add_gridspec(4, 4, hspace=0.3, wspace=0.3)

# Plot key features
plot_features = [
    ('cell_area', 'Cell Area (pixels)'),
    ('nc_ratio', 'Nuclear/Cytoplasmic Ratio'),
    ('cell_formfactor', 'Cell Form Factor (Circularity)'),
    ('agp_cell_mean', 'AGP Mean Intensity (Actin)'),
    ('agp_cytoplasm_mean', 'AGP Cytoplasm Intensity'),
    ('agp_texture', 'AGP Texture Variance'),
    ('mito_cell_mean', 'Mito Mean Intensity'),
    ('mito_cytoplasm_mean', 'Mito Cytoplasm Intensity'),
    ('mito_texture', 'Mito Texture Variance'),
    ('dna_nucleus_mean', 'DNA Nucleus Intensity'),
    ('dna_texture', 'DNA Texture Variance'),
    ('agp_mito_corr', 'AGP-Mito Correlation'),
]

for idx, (feature, label) in enumerate(plot_features):
    row = idx // 4
    col = idx % 4
    ax = fig.add_subplot(gs[row, col])
    
    # Violin plot
    data_to_plot = [negcon_features[feature].dropna(), ko_features[feature].dropna()]
    parts = ax.violinplot(data_to_plot, positions=[0, 1], showmeans=True, showmedians=True)
    
    # Color the violins
    for pc, color in zip(parts['bodies'], ['lightblue', 'lightcoral']):
        pc.set_facecolor(color)
        pc.set_alpha(0.7)
    
    ax.set_xticks([0, 1])
    ax.set_xticklabels(['NegCon', 'ITGAV KO'])
    ax.set_ylabel(label)
    ax.set_title(label, fontsize=10, fontweight='bold')
    ax.grid(True, alpha=0.3)
    
    # Add statistics
    ko_val = ko_features[feature].mean()
    nc_val = negcon_features[feature].mean()
    fc = ko_val / nc_val if nc_val != 0 else np.nan
    ax.text(0.5, 0.95, f'FC={fc:.2f}', transform=ax.transAxes, 
            ha='center', va='top', fontsize=8, bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

fig.suptitle('ITGAV Knockout vs Negative Control: Morphological Feature Comparison', 
             fontsize=16, fontweight='bold')
plt.savefig(os.path.join(base_dir, "../ITGAV_feature_comparison_plot.png"), dpi=300, bbox_inches='tight')
print(f"\nSaved comparison plot to ITGAV_feature_comparison_plot.png")

# Create scatter plots for key relationships
fig2, axes = plt.subplots(2, 3, figsize=(18, 12))
fig2.suptitle('ITGAV Knockout: Key Feature Relationships', fontsize=16, fontweight='bold')

scatter_pairs = [
    ('cell_area', 'agp_cell_mean', 'Cell Area vs AGP Intensity'),
    ('cell_area', 'mito_cell_mean', 'Cell Area vs Mito Intensity'),
    ('agp_cell_mean', 'mito_cell_mean', 'AGP vs Mito Intensity'),
    ('nc_ratio', 'cell_formfactor', 'NC Ratio vs Cell Circularity'),
    ('agp_texture', 'mito_texture', 'AGP vs Mito Texture'),
    ('cell_formfactor', 'agp_cell_mean', 'Cell Circularity vs AGP'),
]

for idx, (x_feat, y_feat, title) in enumerate(scatter_pairs):
    ax = axes[idx // 3, idx % 3]
    
    # Plot both conditions
    ax.scatter(negcon_features[x_feat], negcon_features[y_feat], 
              alpha=0.3, s=10, c='blue', label='NegCon')
    ax.scatter(ko_features[x_feat], ko_features[y_feat], 
              alpha=0.3, s=10, c='red', label='ITGAV KO')
    
    ax.set_xlabel(x_feat.replace('_', ' ').title())
    ax.set_ylabel(y_feat.replace('_', ' ').title())
    ax.set_title(title, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(base_dir, "../ITGAV_feature_relationships.png"), dpi=300, bbox_inches='tight')
print(f"Saved relationship plot to ITGAV_feature_relationships.png")

print("\n" + "="*60)
print("Analysis Complete!")
print("="*60)
