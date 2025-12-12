#!/usr/bin/env python3
"""
Visualize ITGAV knockout vs negative control images
"""
import numpy as np
import matplotlib.pyplot as plt
from skimage import io, exposure
import os
import glob

def load_and_normalize(filepath):
    """Load image and normalize for visualization"""
    img = io.imread(filepath)
    # Normalize to 0-1 range
    p2, p98 = np.percentile(img, (2, 98))
    img_norm = exposure.rescale_intensity(img, in_range=(p2, p98), out_range=(0, 1))
    return img_norm

def create_composite(dna, er, agp, mito, rna):
    """Create RGB composite image"""
    # Create composite: DNA (blue), ER (green), AGP (red)
    composite = np.zeros((*dna.shape, 3))
    composite[:, :, 0] = agp  # Red channel
    composite[:, :, 1] = er   # Green channel
    composite[:, :, 2] = dna  # Blue channel
    return composite

# Set up paths
base_dir = "/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_6/ITGAV_analysis"
ko_dir = os.path.join(base_dir, "ITGAV_knockout")
negcon_dir = os.path.join(base_dir, "negcon")

# Find one site from each condition
ko_site = "ITGAV_CP-CC9-R1-18_A03_site1"
negcon_site = "CP-CC9-R1-18_A02_site1"

# Load images for ITGAV knockout
ko_dna = load_and_normalize(os.path.join(ko_dir, f"{ko_site}_DNA.tiff"))
ko_er = load_and_normalize(os.path.join(ko_dir, f"{ko_site}_ER.tiff"))
ko_agp = load_and_normalize(os.path.join(ko_dir, f"{ko_site}_AGP.tiff"))
ko_mito = load_and_normalize(os.path.join(ko_dir, f"{ko_site}_Mito.tiff"))
ko_rna = load_and_normalize(os.path.join(ko_dir, f"{ko_site}_RNA.tiff"))

# Load images for negative control
nc_dna = load_and_normalize(os.path.join(negcon_dir, f"{negcon_site}_DNA.tiff"))
nc_er = load_and_normalize(os.path.join(negcon_dir, f"{negcon_site}_ER.tiff"))
nc_agp = load_and_normalize(os.path.join(negcon_dir, f"{negcon_site}_AGP.tiff"))
nc_mito = load_and_normalize(os.path.join(negcon_dir, f"{negcon_site}_Mito.tiff"))
nc_rna = load_and_normalize(os.path.join(negcon_dir, f"{negcon_site}_RNA.tiff"))

# Create figure with all channels
fig, axes = plt.subplots(2, 6, figsize=(24, 8))
fig.suptitle('ITGAV Knockout vs Negative Control - Cell Painting Channels', fontsize=16, fontweight='bold')

channels = ['DNA', 'ER', 'AGP', 'Mito', 'RNA', 'Composite']
ko_images = [ko_dna, ko_er, ko_agp, ko_mito, ko_rna, create_composite(ko_dna, ko_er, ko_agp, ko_mito, ko_rna)]
nc_images = [nc_dna, nc_er, nc_agp, nc_mito, nc_rna, create_composite(nc_dna, nc_er, nc_agp, nc_mito, nc_rna)]

# Plot negative control (top row)
for i, (img, channel) in enumerate(zip(nc_images, channels)):
    axes[0, i].imshow(img, cmap='gray' if i < 5 else None)
    axes[0, i].set_title(f'Negative Control\n{channel}', fontsize=12, fontweight='bold')
    axes[0, i].axis('off')

# Plot ITGAV knockout (bottom row)
for i, (img, channel) in enumerate(zip(ko_images, channels)):
    axes[1, i].imshow(img, cmap='gray' if i < 5 else None)
    axes[1, i].set_title(f'ITGAV Knockout\n{channel}', fontsize=12, fontweight='bold')
    axes[1, i].axis('off')

plt.tight_layout()
plt.savefig(os.path.join(base_dir, '../ITGAV_vs_negcon_overview.png'), dpi=300, bbox_inches='tight')
print(f"Saved overview comparison to ITGAV_vs_negcon_overview.png")

# Create a focused comparison on individual channels
fig2, axes2 = plt.subplots(2, 3, figsize=(15, 10))
fig2.suptitle('ITGAV Knockout: Key Channel Comparison', fontsize=16, fontweight='bold')

focus_channels = ['DNA', 'AGP', 'Mito']
focus_ko = [ko_dna, ko_agp, ko_mito]
focus_nc = [nc_dna, nc_agp, nc_mito]

for i, (channel, ko_img, nc_img) in enumerate(zip(focus_channels, focus_ko, focus_nc)):
    axes2[0, i].imshow(nc_img, cmap='gray')
    axes2[0, i].set_title(f'Negative Control - {channel}', fontsize=12, fontweight='bold')
    axes2[0, i].axis('off')
    
    axes2[1, i].imshow(ko_img, cmap='gray')
    axes2[1, i].set_title(f'ITGAV Knockout - {channel}', fontsize=12, fontweight='bold')
    axes2[1, i].axis('off')

plt.tight_layout()
plt.savefig(os.path.join(base_dir, '../ITGAV_focused_comparison.png'), dpi=300, bbox_inches='tight')
print(f"Saved focused comparison to ITGAV_focused_comparison.png")

print("\nImage statistics:")
print(f"ITGAV KO - DNA mean: {ko_dna.mean():.3f}, std: {ko_dna.std():.3f}")
print(f"NegCon - DNA mean: {nc_dna.mean():.3f}, std: {nc_dna.std():.3f}")
print(f"ITGAV KO - AGP mean: {ko_agp.mean():.3f}, std: {ko_agp.std():.3f}")
print(f"NegCon - AGP mean: {nc_agp.mean():.3f}, std: {nc_agp.std():.3f}")
print(f"ITGAV KO - Mito mean: {ko_mito.mean():.3f}, std: {ko_mito.std():.3f}")
print(f"NegCon - Mito mean: {nc_mito.mean():.3f}, std: {nc_mito.std():.3f}")
