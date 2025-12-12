#!/usr/bin/env python3
"""
Comprehensive morphological analysis of NOTCH knockout cells
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import tifffile
from scipy import ndimage
from skimage import filters, measure, morphology, segmentation
from skimage.feature import peak_local_max
import warnings
warnings.filterwarnings('ignore')

# Set style
sns.set_style('whitegrid')
plt.rcParams['figure.dpi'] = 150

def load_images(base_dir, condition, site=1):
    """Load all channels for a given condition"""
    images = {}
    channels = ['DNA', 'ER', 'AGP', 'Mito', 'RNA']
    
    for channel in channels:
        pattern = f"*site{site}_{channel}.tiff"
        files = list(Path(base_dir).glob(pattern))
        if files:
            images[channel] = tifffile.imread(files[0])
    
    return images

def segment_nuclei(dna_image, min_size=100):
    """Segment nuclei from DNA channel"""
    # Gaussian smoothing
    smoothed = filters.gaussian(dna_image, sigma=2)
    
    # Otsu thresholding
    thresh = filters.threshold_otsu(smoothed)
    binary = smoothed > thresh
    
    # Remove small objects
    cleaned = morphology.remove_small_objects(binary, min_size=min_size)
    
    # Fill holes
    filled = ndimage.binary_fill_holes(cleaned)
    
    # Distance transform for watershed
    distance = ndimage.distance_transform_edt(filled)
    
    # Find peaks
    local_max = peak_local_max(distance, min_distance=20, labels=filled)
    markers = np.zeros_like(distance, dtype=bool)
    markers[tuple(local_max.T)] = True
    markers = ndimage.label(markers)[0]
    
    # Watershed segmentation
    labels = segmentation.watershed(-distance, markers, mask=filled)
    
    return labels

def segment_cells(dna_image, agp_image, min_size=200):
    """Segment cells using DNA and AGP channels"""
    # Combine DNA and AGP for cell boundary detection
    combined = filters.gaussian(dna_image, sigma=2) + filters.gaussian(agp_image, sigma=2)
    
    # Threshold
    thresh = filters.threshold_otsu(combined)
    binary = combined > thresh
    
    # Clean up
    cleaned = morphology.remove_small_objects(binary, min_size=min_size)
    filled = ndimage.binary_fill_holes(cleaned)
    
    # Label
    labels = measure.label(filled)
    
    return labels

def measure_cell_features(images, nuclei_labels, cell_labels):
    """Measure comprehensive morphological features"""
    features = []
    
    # Get region properties
    nuclei_props = measure.regionprops(nuclei_labels, intensity_image=images['DNA'])
    cell_props = measure.regionprops(cell_labels, intensity_image=images['DNA'])
    
    # Match nuclei to cells
    for nuc_prop in nuclei_props:
        nuc_centroid = nuc_prop.centroid
        nuc_y, nuc_x = int(nuc_centroid[0]), int(nuc_centroid[1])
        
        # Find corresponding cell
        if 0 <= nuc_y < cell_labels.shape[0] and 0 <= nuc_x < cell_labels.shape[1]:
            cell_label = cell_labels[nuc_y, nuc_x]
            
            if cell_label > 0:
                # Get cell properties
                cell_prop = [p for p in cell_props if p.label == cell_label]
                if not cell_prop:
                    continue
                cell_prop = cell_prop[0]
                
                # Create cell and nucleus masks
                cell_mask = cell_labels == cell_label
                nuc_mask = nuclei_labels == nuc_prop.label
                cyto_mask = cell_mask & ~nuc_mask
                
                # Basic morphology
                feature = {
                    'nucleus_area': nuc_prop.area,
                    'cell_area': cell_prop.area,
                    'cytoplasm_area': cyto_mask.sum(),
                    'nucleus_cell_ratio': nuc_prop.area / cell_prop.area if cell_prop.area > 0 else 0,
                    
                    # Shape features
                    'nucleus_eccentricity': nuc_prop.eccentricity,
                    'nucleus_solidity': nuc_prop.solidity,
                    'nucleus_extent': nuc_prop.extent,
                    'cell_eccentricity': cell_prop.eccentricity,
                    'cell_solidity': cell_prop.solidity,
                    'cell_extent': cell_prop.extent,
                    'cell_perimeter': cell_prop.perimeter,
                    'cell_compactness': (4 * np.pi * cell_prop.area) / (cell_prop.perimeter ** 2) if cell_prop.perimeter > 0 else 0,
                    
                    # Intensity features - DNA
                    'nucleus_dna_mean': nuc_prop.mean_intensity,
                    'nucleus_dna_std': np.std(images['DNA'][nuc_mask]),
                    'nucleus_dna_max': np.max(images['DNA'][nuc_mask]),
                    
                    # Intensity features - ER
                    'cell_er_mean': np.mean(images['ER'][cell_mask]),
                    'cell_er_std': np.std(images['ER'][cell_mask]),
                    'cyto_er_mean': np.mean(images['ER'][cyto_mask]) if cyto_mask.sum() > 0 else 0,
                    
                    # Intensity features - Mitochondria
                    'cell_mito_mean': np.mean(images['Mito'][cell_mask]),
                    'cell_mito_std': np.std(images['Mito'][cell_mask]),
                    'cyto_mito_mean': np.mean(images['Mito'][cyto_mask]) if cyto_mask.sum() > 0 else 0,
                    
                    # Intensity features - AGP (Actin/Golgi)
                    'cell_agp_mean': np.mean(images['AGP'][cell_mask]),
                    'cell_agp_std': np.std(images['AGP'][cell_mask]),
                    'cyto_agp_mean': np.mean(images['AGP'][cyto_mask]) if cyto_mask.sum() > 0 else 0,
                    
                    # Intensity features - RNA
                    'cell_rna_mean': np.mean(images['RNA'][cell_mask]),
                    'cell_rna_std': np.std(images['RNA'][cell_mask]),
                    'cyto_rna_mean': np.mean(images['RNA'][cyto_mask]) if cyto_mask.sum() > 0 else 0,
                    
                    # Texture features (granularity)
                    'nucleus_dna_granularity': np.std(ndimage.gaussian_filter(images['DNA'][nuc_mask].astype(float), sigma=1)),
                    'mito_granularity': np.std(ndimage.gaussian_filter(images['Mito'][cell_mask].astype(float), sigma=1)),
                }
                
                features.append(feature)
    
    return pd.DataFrame(features)

def analyze_condition(base_dir, condition_name):
    """Analyze all sites for a condition"""
    print(f"\nAnalyzing {condition_name}...")
    
    all_features = []
    
    for site in [1, 2, 3]:
        try:
            # Load images
            images = load_images(base_dir, condition_name, site=site)
            
            if len(images) < 5:
                print(f"  Site {site}: Missing channels, skipping")
                continue
            
            # Segment
            nuclei_labels = segment_nuclei(images['DNA'])
            cell_labels = segment_cells(images['DNA'], images['AGP'])
            
            n_nuclei = nuclei_labels.max()
            n_cells = cell_labels.max()
            print(f"  Site {site}: {n_nuclei} nuclei, {n_cells} cells")
            
            # Measure features
            features = measure_cell_features(images, nuclei_labels, cell_labels)
            features['site'] = site
            features['condition'] = condition_name
            
            all_features.append(features)
            
        except Exception as e:
            print(f"  Site {site}: Error - {e}")
            continue
    
    if all_features:
        return pd.concat(all_features, ignore_index=True)
    else:
        return pd.DataFrame()

def main():
    """Main analysis pipeline"""
    print("=" * 80)
    print("NOTCH RECEPTOR KNOCKOUT MORPHOLOGICAL ANALYSIS")
    print("=" * 80)
    
    # Define conditions
    conditions = {
        'NOTCH1_KO': 'images/NOTCH1_KO',
        'NOTCH2_KO': 'images/NOTCH2_KO',
        'NOTCH3_KO': 'images/NOTCH3_KO',
        'NegCon': 'images/negcon'
    }
    
    # Analyze each condition
    all_data = []
    for condition_name, base_dir in conditions.items():
        df = analyze_condition(base_dir, condition_name)
        if not df.empty:
            all_data.append(df)
    
    # Combine all data
    if not all_data:
        print("No data collected!")
        return
    
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Save raw data
    combined_df.to_csv('notch_morphology_features.csv', index=False)
    print(f"\nTotal cells analyzed: {len(combined_df)}")
    print(f"  NOTCH1_KO: {len(combined_df[combined_df['condition'] == 'NOTCH1_KO'])}")
    print(f"  NOTCH2_KO: {len(combined_df[combined_df['condition'] == 'NOTCH2_KO'])}")
    print(f"  NOTCH3_KO: {len(combined_df[combined_df['condition'] == 'NOTCH3_KO'])}")
    print(f"  NegCon: {len(combined_df[combined_df['condition'] == 'NegCon'])}")
    
    # Statistical summary
    print("\n" + "=" * 80)
    print("STATISTICAL SUMMARY")
    print("=" * 80)
    
    # Key features to compare
    key_features = [
        'nucleus_area', 'cell_area', 'nucleus_cell_ratio',
        'cell_eccentricity', 'cell_compactness',
        'nucleus_dna_mean', 'cell_er_mean', 'cell_mito_mean',
        'cell_agp_mean', 'cell_rna_mean', 'mito_granularity'
    ]
    
    summary = combined_df.groupby('condition')[key_features].agg(['mean', 'std'])
    print(summary)
    
    # Create visualizations
    print("\n" + "=" * 80)
    print("CREATING VISUALIZATIONS")
    print("=" * 80)
    
    # 1. Distribution plots for key features
    fig, axes = plt.subplots(3, 4, figsize=(20, 15))
    axes = axes.flatten()
    
    plot_features = [
        'nucleus_area', 'cell_area', 'nucleus_cell_ratio', 'cell_compactness',
        'nucleus_dna_mean', 'cell_er_mean', 'cell_mito_mean', 'cell_agp_mean',
        'cell_rna_mean', 'mito_granularity', 'nucleus_dna_granularity', 'cell_eccentricity'
    ]
    
    for idx, feature in enumerate(plot_features):
        ax = axes[idx]
        for condition in ['NegCon', 'NOTCH1_KO', 'NOTCH2_KO', 'NOTCH3_KO']:
            data = combined_df[combined_df['condition'] == condition][feature]
            if len(data) > 0:
                ax.hist(data, alpha=0.5, label=condition, bins=30, density=True)
        
        ax.set_xlabel(feature.replace('_', ' ').title())
        ax.set_ylabel('Density')
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('notch_feature_distributions.png', dpi=150, bbox_inches='tight')
    print("  Saved: notch_feature_distributions.png")
    plt.close()
    
    # 2. Box plots for comparison
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    axes = axes.flatten()
    
    comparison_features = [
        'nucleus_area', 'cell_area', 'nucleus_cell_ratio',
        'cell_mito_mean', 'cell_er_mean', 'mito_granularity'
    ]
    
    for idx, feature in enumerate(comparison_features):
        ax = axes[idx]
        sns.boxplot(data=combined_df, x='condition', y=feature, ax=ax,
                   order=['NegCon', 'NOTCH1_KO', 'NOTCH2_KO', 'NOTCH3_KO'])
        ax.set_xlabel('')
        ax.set_ylabel(feature.replace('_', ' ').title())
        ax.tick_params(axis='x', rotation=45)
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('notch_feature_boxplots.png', dpi=150, bbox_inches='tight')
    print("  Saved: notch_feature_boxplots.png")
    plt.close()
    
    # 3. Scatter plots for relationships
    fig, axes = plt.subplots(2, 2, figsize=(16, 16))
    
    scatter_pairs = [
        ('nucleus_area', 'cell_area'),
        ('cell_area', 'cell_mito_mean'),
        ('nucleus_cell_ratio', 'cell_compactness'),
        ('cell_er_mean', 'cell_mito_mean')
    ]
    
    for idx, (x_feat, y_feat) in enumerate(scatter_pairs):
        ax = axes[idx // 2, idx % 2]
        for condition in ['NegCon', 'NOTCH1_KO', 'NOTCH2_KO', 'NOTCH3_KO']:
            data = combined_df[combined_df['condition'] == condition]
            ax.scatter(data[x_feat], data[y_feat], alpha=0.5, label=condition, s=20)
        
        ax.set_xlabel(x_feat.replace('_', ' ').title())
        ax.set_ylabel(y_feat.replace('_', ' ').title())
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('notch_feature_scatter.png', dpi=150, bbox_inches='tight')
    print("  Saved: notch_feature_scatter.png")
    plt.close()
    
    # 4. Heatmap of mean differences from control
    print("\n" + "=" * 80)
    print("FOLD CHANGES RELATIVE TO NEGATIVE CONTROL")
    print("=" * 80)
    
    # Calculate fold changes
    negcon_means = combined_df[combined_df['condition'] == 'NegCon'][key_features].mean()
    
    fold_changes = {}
    for condition in ['NOTCH1_KO', 'NOTCH2_KO', 'NOTCH3_KO']:
        condition_means = combined_df[combined_df['condition'] == condition][key_features].mean()
        fold_changes[condition] = condition_means / negcon_means
    
    fc_df = pd.DataFrame(fold_changes).T
    
    print(fc_df)
    
    # Plot heatmap
    fig, ax = plt.subplots(figsize=(12, 6))
    sns.heatmap(fc_df, annot=True, fmt='.2f', cmap='RdBu_r', center=1.0,
                vmin=0.5, vmax=1.5, ax=ax, cbar_kws={'label': 'Fold Change'})
    ax.set_xlabel('Feature')
    ax.set_ylabel('Condition')
    ax.set_title('Fold Changes Relative to Negative Control')
    plt.tight_layout()
    plt.savefig('notch_fold_changes_heatmap.png', dpi=150, bbox_inches='tight')
    print("\n  Saved: notch_fold_changes_heatmap.png")
    plt.close()
    
    # Save fold changes
    fc_df.to_csv('notch_fold_changes.csv')
    print("  Saved: notch_fold_changes.csv")
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    main()
