import tifffile
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from scipy import ndimage
from skimage import filters, measure, morphology, segmentation
import pandas as pd

# Load images
conditions = {
    'NegCon': {
        'DNA': tifffile.imread('images_death_receptor/NEGCON/BR00126386_P11_site1_DNA.tiff'),
        'ER': tifffile.imread('images_death_receptor/NEGCON/BR00126386_P11_site1_ER.tiff'),
        'AGP': tifffile.imread('images_death_receptor/NEGCON/BR00126386_P11_site1_AGP.tiff'),
        'Mito': tifffile.imread('images_death_receptor/NEGCON/BR00126386_P11_site1_Mito.tiff'),
        'RNA': tifffile.imread('images_death_receptor/NEGCON/BR00126386_P11_site1_RNA.tiff'),
    },
    'CASP8_OE': {
        'DNA': tifffile.imread('images_death_receptor/CASP8_OE/CASP8_BR00126387_P11_site1_DNA.tiff'),
        'ER': tifffile.imread('images_death_receptor/CASP8_OE/CASP8_BR00126387_P11_site1_ER.tiff'),
        'AGP': tifffile.imread('images_death_receptor/CASP8_OE/CASP8_BR00126387_P11_site1_AGP.tiff'),
        'Mito': tifffile.imread('images_death_receptor/CASP8_OE/CASP8_BR00126387_P11_site1_Mito.tiff'),
        'RNA': tifffile.imread('images_death_receptor/CASP8_OE/CASP8_BR00126387_P11_site1_RNA.tiff'),
    },
    'FADD_OE': {
        'DNA': tifffile.imread('images_death_receptor/FADD_OE/FADD_BR00123528A_H21_site1_DNA.tiff'),
        'ER': tifffile.imread('images_death_receptor/FADD_OE/FADD_BR00123528A_H21_site1_ER.tiff'),
        'AGP': tifffile.imread('images_death_receptor/FADD_OE/FADD_BR00123528A_H21_site1_AGP.tiff'),
        'Mito': tifffile.imread('images_death_receptor/FADD_OE/FADD_BR00123528A_H21_site1_Mito.tiff'),
        'RNA': tifffile.imread('images_death_receptor/FADD_OE/FADD_BR00123528A_H21_site1_RNA.tiff'),
    },
    'TNFRSF10B_OE': {
        'DNA': tifffile.imread('images_death_receptor/TNFRSF10B_OE/TNFRSF10B_BR00126708_C07_site1_DNA.tiff'),
        'ER': tifffile.imread('images_death_receptor/TNFRSF10B_OE/TNFRSF10B_BR00126708_C07_site1_ER.tiff'),
        'AGP': tifffile.imread('images_death_receptor/TNFRSF10B_OE/TNFRSF10B_BR00126708_C07_site1_AGP.tiff'),
        'Mito': tifffile.imread('images_death_receptor/TNFRSF10B_OE/TNFRSF10B_BR00126708_C07_site1_Mito.tiff'),
        'RNA': tifffile.imread('images_death_receptor/TNFRSF10B_OE/TNFRSF10B_BR00126708_C07_site1_RNA.tiff'),
    },
}

def segment_nuclei(dna_img, min_size=50):
    """Segment nuclei from DNA channel"""
    # Apply Gaussian filter
    smoothed = filters.gaussian(dna_img, sigma=2)
    
    # Threshold
    thresh = filters.threshold_otsu(smoothed)
    binary = smoothed > thresh
    
    # Clean up
    binary = morphology.remove_small_objects(binary, min_size=min_size)
    binary = morphology.remove_small_holes(binary, area_threshold=100)
    
    # Label nuclei
    labeled = measure.label(binary)
    
    return labeled

def segment_cells(dna_img, agp_img, nuclei_labels):
    """Segment cells using nuclei as seeds and cytoplasm markers"""
    # Create cytoplasm mask from AGP (actin/cytoskeleton)
    cyto_smoothed = filters.gaussian(agp_img, sigma=3)
    cyto_thresh = filters.threshold_otsu(cyto_smoothed)
    cyto_mask = cyto_smoothed > cyto_thresh * 0.5  # Lower threshold for cytoplasm
    
    # Watershed segmentation
    distance = ndimage.distance_transform_edt(cyto_mask)
    cells = segmentation.watershed(-distance, nuclei_labels, mask=cyto_mask)
    
    return cells

def measure_cell_features(condition_name, dna, er, agp, mito, rna):
    """Measure features for all cells in an image"""
    # Segment nuclei
    nuclei = segment_nuclei(dna)
    
    # Segment cells
    cells = segment_cells(dna, agp, nuclei)
    
    # Measure properties
    results = []
    
    for region in measure.regionprops(cells):
        cell_id = region.label
        
        # Get masks
        cell_mask = cells == cell_id
        nucleus_mask = nuclei == cell_id
        cytoplasm_mask = cell_mask & ~nucleus_mask
        
        # Basic morphology
        cell_area = region.area
        nucleus_area = np.sum(nucleus_mask)
        cytoplasm_area = np.sum(cytoplasm_mask)
        
        # Nuclear/cytoplasmic ratio
        nc_ratio = nucleus_area / cell_area if cell_area > 0 else 0
        
        # Intensity measurements
        dna_intensity = np.mean(dna[cell_mask])
        dna_nucleus_intensity = np.mean(dna[nucleus_mask]) if nucleus_area > 0 else 0
        
        er_intensity = np.mean(er[cell_mask])
        agp_intensity = np.mean(agp[cell_mask])
        mito_intensity = np.mean(mito[cell_mask])
        rna_intensity = np.mean(rna[cell_mask])
        
        # Shape features
        eccentricity = region.eccentricity
        solidity = region.solidity
        
        # Texture - standard deviation as proxy for granularity
        dna_texture = np.std(dna[nucleus_mask]) if nucleus_area > 0 else 0
        mito_texture = np.std(mito[cell_mask])
        
        results.append({
            'condition': condition_name,
            'cell_id': cell_id,
            'cell_area': cell_area,
            'nucleus_area': nucleus_area,
            'cytoplasm_area': cytoplasm_area,
            'nc_ratio': nc_ratio,
            'dna_intensity': dna_intensity,
            'dna_nucleus_intensity': dna_nucleus_intensity,
            'er_intensity': er_intensity,
            'agp_intensity': agp_intensity,
            'mito_intensity': mito_intensity,
            'rna_intensity': rna_intensity,
            'eccentricity': eccentricity,
            'solidity': solidity,
            'dna_texture': dna_texture,
            'mito_texture': mito_texture,
        })
    
    return pd.DataFrame(results), nuclei, cells

# Analyze all conditions
print("="*80)
print("ANALYZING DEATH RECEPTOR PATHWAY PERTURBATIONS")
print("="*80)

all_results = []
segmentations = {}

for condition_name, images in conditions.items():
    print(f"\nAnalyzing {condition_name}...")
    
    df, nuclei, cells = measure_cell_features(
        condition_name,
        images['DNA'],
        images['ER'],
        images['AGP'],
        images['Mito'],
        images['RNA']
    )
    
    all_results.append(df)
    segmentations[condition_name] = {'nuclei': nuclei, 'cells': cells}
    
    print(f"  Found {len(df)} cells")
    print(f"  Mean cell area: {df['cell_area'].mean():.1f} pixels")
    print(f"  Mean N/C ratio: {df['nc_ratio'].mean():.3f}")

# Combine all results
combined_df = pd.concat(all_results, ignore_index=True)
combined_df.to_csv('death_receptor_cell_measurements.csv', index=False)
print(f"\nSaved measurements for {len(combined_df)} total cells")

# Summary statistics
print("\n" + "="*80)
print("SUMMARY STATISTICS")
print("="*80)

summary = combined_df.groupby('condition').agg({
    'cell_id': 'count',
    'cell_area': ['mean', 'std'],
    'nucleus_area': ['mean', 'std'],
    'nc_ratio': ['mean', 'std'],
    'dna_intensity': ['mean', 'std'],
    'mito_intensity': ['mean', 'std'],
    'eccentricity': ['mean', 'std'],
    'solidity': ['mean', 'std'],
}).round(2)

print(summary)

# Save segmentation masks
print("\n" + "="*80)
print("SAVING SEGMENTATION MASKS")
print("="*80)

fig, axes = plt.subplots(2, 4, figsize=(20, 10))

for idx, condition_name in enumerate(['NegCon', 'CASP8_OE', 'FADD_OE', 'TNFRSF10B_OE']):
    # Original DNA
    axes[0, idx].imshow(conditions[condition_name]['DNA'], cmap='gray')
    axes[0, idx].set_title(f'{condition_name} - DNA', fontsize=12, fontweight='bold')
    axes[0, idx].axis('off')
    
    # Segmented cells
    cells_colored = segmentations[condition_name]['cells']
    axes[1, idx].imshow(cells_colored, cmap='nipy_spectral')
    axes[1, idx].set_title(f'{condition_name} - Segmented Cells', fontsize=12, fontweight='bold')
    axes[1, idx].axis('off')

plt.tight_layout()
plt.savefig('death_receptor_segmentation.png', dpi=150, bbox_inches='tight')
print("Saved: death_receptor_segmentation.png")
plt.close()

print("\nAnalysis complete!")
