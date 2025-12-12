#!/usr/bin/env python3
"""
Create single-cell image crops for visualization
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from skimage import io, filters, measure, morphology, exposure
from scipy import ndimage
import os

def load_and_normalize(filepath):
    """Load image and normalize"""
    img = io.imread(filepath)
    return img.astype(float) / img.max()

def segment_nuclei(dna_img):
    """Segment nuclei from DNA channel"""
    smoothed = filters.gaussian(dna_img, sigma=2)
    thresh = filters.threshold_otsu(smoothed)
    binary = smoothed > thresh
    binary = morphology.remove_small_objects(binary, min_size=200)
    binary = ndimage.binary_fill_holes(binary)
    labeled = measure.label(binary)
    return labeled

def create_cell_crops(condition_name, image_dir, site_file, num_cells=10):
    """Create crops of individual cells"""
    base = site_file.replace("_DNA.tiff", "")
    
    # Load all channels
    dna_img = load_and_normalize(os.path.join(image_dir, site_file))
    agp_img = load_and_normalize(os.path.join(image_dir, base + "_AGP.tiff"))
    mito_img = load_and_normalize(os.path.join(image_dir, base + "_Mito.tiff"))
    er_img = load_and_normalize(os.path.join(image_dir, base + "_ER.tiff"))
    
    # Segment nuclei
    nuclei_labels = segment_nuclei(dna_img)
    
    # Get cell regions
    regions = measure.regionprops(nuclei_labels)
    
    # Sort by area and select diverse cells
    regions = sorted(regions, key=lambda x: x.area, reverse=True)
    selected_regions = regions[:num_cells]
    
    crops = []
    for region in selected_regions:
        # Get bounding box with padding
        minr, minc, maxr, maxc = region.bbox
        pad = 20
        minr = max(0, minr - pad)
        minc = max(0, minc - pad)
        maxr = min(dna_img.shape[0], maxr + pad)
        maxc = min(dna_img.shape[1], maxc + pad)
        
        # Crop all channels
        dna_crop = dna_img[minr:maxr, minc:maxc]
        agp_crop = agp_img[minr:maxr, minc:maxc]
        mito_crop = mito_img[minr:maxr, minc:maxc]
        er_crop = er_img[minr:maxr, minc:maxc]
        
        # Create composite
        composite = np.zeros((*dna_crop.shape, 3))
        composite[:, :, 0] = agp_crop  # Red
        composite[:, :, 1] = mito_crop  # Green
        composite[:, :, 2] = dna_crop  # Blue
        
        crops.append({
            'dna': dna_crop,
            'agp': agp_crop,
            'mito': mito_crop,
            'er': er_crop,
            'composite': composite,
            'area': region.area,
            'condition': condition_name
        })
    
    return crops

# Create crops for both conditions
base_dir = "/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_6/ITGAV_analysis"

print("Creating single-cell crops...")

# ITGAV knockout
ko_crops = create_cell_crops("ITGAV_KO", 
                             os.path.join(base_dir, "ITGAV_knockout"),
                             "ITGAV_CP-CC9-R1-18_A03_site1_DNA.tiff",
                             num_cells=8)

# Negative control
nc_crops = create_cell_crops("NegCon",
                             os.path.join(base_dir, "negcon"),
                             "CP-CC9-R1-18_A02_site1_DNA.tiff",
                             num_cells=8)

# Create comparison figure
fig, axes = plt.subplots(4, 8, figsize=(24, 12))
fig.suptitle('Single-Cell Comparison: ITGAV Knockout vs Negative Control', 
             fontsize=16, fontweight='bold')

# Plot negative control cells (top 2 rows)
for i in range(8):
    # Composite
    axes[0, i].imshow(nc_crops[i]['composite'])
    axes[0, i].set_title(f"NegCon Cell {i+1}\nArea: {nc_crops[i]['area']:.0f}px", fontsize=9)
    axes[0, i].axis('off')
    
    # AGP channel
    axes[1, i].imshow(nc_crops[i]['agp'], cmap='gray')
    axes[1, i].set_title(f"AGP (Actin)", fontsize=8)
    axes[1, i].axis('off')

# Plot ITGAV knockout cells (bottom 2 rows)
for i in range(8):
    # Composite
    axes[2, i].imshow(ko_crops[i]['composite'])
    axes[2, i].set_title(f"ITGAV KO Cell {i+1}\nArea: {ko_crops[i]['area']:.0f}px", fontsize=9)
    axes[2, i].axis('off')
    
    # AGP channel
    axes[3, i].imshow(ko_crops[i]['agp'], cmap='gray')
    axes[3, i].set_title(f"AGP (Actin)", fontsize=8)
    axes[3, i].axis('off')

# Add row labels
axes[0, 0].text(-0.3, 0.5, 'Negative Control\nComposite', transform=axes[0, 0].transAxes,
                fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)
axes[1, 0].text(-0.3, 0.5, 'Negative Control\nAGP Channel', transform=axes[1, 0].transAxes,
                fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)
axes[2, 0].text(-0.3, 0.5, 'ITGAV Knockout\nComposite', transform=axes[2, 0].transAxes,
                fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)
axes[3, 0].text(-0.3, 0.5, 'ITGAV Knockout\nAGP Channel', transform=axes[3, 0].transAxes,
                fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)

plt.tight_layout()
plt.savefig(os.path.join(base_dir, "../ITGAV_single_cell_comparison.png"), dpi=300, bbox_inches='tight')
print(f"Saved single-cell comparison to ITGAV_single_cell_comparison.png")

# Create a focused comparison on mitochondria
fig2, axes2 = plt.subplots(2, 8, figsize=(24, 6))
fig2.suptitle('Mitochondrial Morphology: ITGAV Knockout vs Negative Control', 
              fontsize=16, fontweight='bold')

for i in range(8):
    # Negative control mito
    axes2[0, i].imshow(nc_crops[i]['mito'], cmap='hot')
    axes2[0, i].set_title(f"NegCon Cell {i+1}", fontsize=9)
    axes2[0, i].axis('off')
    
    # ITGAV knockout mito
    axes2[1, i].imshow(ko_crops[i]['mito'], cmap='hot')
    axes2[1, i].set_title(f"ITGAV KO Cell {i+1}", fontsize=9)
    axes2[1, i].axis('off')

axes2[0, 0].text(-0.2, 0.5, 'Negative Control', transform=axes2[0, 0].transAxes,
                 fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)
axes2[1, 0].text(-0.2, 0.5, 'ITGAV Knockout', transform=axes2[1, 0].transAxes,
                 fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)

plt.tight_layout()
plt.savefig(os.path.join(base_dir, "../ITGAV_mitochondria_comparison.png"), dpi=300, bbox_inches='tight')
print(f"Saved mitochondria comparison to ITGAV_mitochondria_comparison.png")

print("Single-cell crop creation complete!")
