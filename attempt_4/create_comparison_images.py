import tifffile
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import matplotlib.gridspec as gridspec

# Load images
casp8_dir = Path('images_death_receptor/CASP8_OE')
fadd_dir = Path('images_death_receptor/FADD_OE')
tnfrsf10b_dir = Path('images_death_receptor/TNFRSF10B_OE')
negcon_dir = Path('images_death_receptor/NEGCON')

# Load all channels for each condition
conditions = {
    'NegCon': {
        'DNA': tifffile.imread(negcon_dir / 'BR00126386_P11_site1_DNA.tiff'),
        'ER': tifffile.imread(negcon_dir / 'BR00126386_P11_site1_ER.tiff'),
        'AGP': tifffile.imread(negcon_dir / 'BR00126386_P11_site1_AGP.tiff'),
        'Mito': tifffile.imread(negcon_dir / 'BR00126386_P11_site1_Mito.tiff'),
        'RNA': tifffile.imread(negcon_dir / 'BR00126386_P11_site1_RNA.tiff'),
    },
    'CASP8 OE': {
        'DNA': tifffile.imread(casp8_dir / 'CASP8_BR00126387_P11_site1_DNA.tiff'),
        'ER': tifffile.imread(casp8_dir / 'CASP8_BR00126387_P11_site1_ER.tiff'),
        'AGP': tifffile.imread(casp8_dir / 'CASP8_BR00126387_P11_site1_AGP.tiff'),
        'Mito': tifffile.imread(casp8_dir / 'CASP8_BR00126387_P11_site1_Mito.tiff'),
        'RNA': tifffile.imread(casp8_dir / 'CASP8_BR00126387_P11_site1_RNA.tiff'),
    },
    'FADD OE': {
        'DNA': tifffile.imread(fadd_dir / 'FADD_BR00123528A_H21_site1_DNA.tiff'),
        'ER': tifffile.imread(fadd_dir / 'FADD_BR00123528A_H21_site1_ER.tiff'),
        'AGP': tifffile.imread(fadd_dir / 'FADD_BR00123528A_H21_site1_AGP.tiff'),
        'Mito': tifffile.imread(fadd_dir / 'FADD_BR00123528A_H21_site1_Mito.tiff'),
        'RNA': tifffile.imread(fadd_dir / 'FADD_BR00123528A_H21_site1_RNA.tiff'),
    },
    'TNFRSF10B OE': {
        'DNA': tifffile.imread(tnfrsf10b_dir / 'TNFRSF10B_BR00126708_C07_site1_DNA.tiff'),
        'ER': tifffile.imread(tnfrsf10b_dir / 'TNFRSF10B_BR00126708_C07_site1_ER.tiff'),
        'AGP': tifffile.imread(tnfrsf10b_dir / 'TNFRSF10B_BR00126708_C07_site1_AGP.tiff'),
        'Mito': tifffile.imread(tnfrsf10b_dir / 'TNFRSF10B_BR00126708_C07_site1_Mito.tiff'),
        'RNA': tifffile.imread(tnfrsf10b_dir / 'TNFRSF10B_BR00126708_C07_site1_RNA.tiff'),
    },
}

# Create figure with all channels
fig = plt.figure(figsize=(20, 16))
gs = gridspec.GridSpec(4, 5, figure=fig, hspace=0.3, wspace=0.1)

channels = ['DNA', 'ER', 'AGP', 'Mito', 'RNA']
condition_names = ['NegCon', 'CASP8 OE', 'FADD OE', 'TNFRSF10B OE']

for i, condition in enumerate(condition_names):
    for j, channel in enumerate(channels):
        ax = fig.add_subplot(gs[i, j])
        img = conditions[condition][channel]
        
        # Normalize for better visualization
        p2, p98 = np.percentile(img, (2, 98))
        img_norm = np.clip((img - p2) / (p98 - p2), 0, 1)
        
        ax.imshow(img_norm, cmap='gray')
        ax.axis('off')
        
        if i == 0:
            ax.set_title(channel, fontsize=14, fontweight='bold')
        if j == 0:
            ax.text(-0.1, 0.5, condition, transform=ax.transAxes, 
                   fontsize=12, fontweight='bold', va='center', ha='right', rotation=90)

plt.suptitle('Death Receptor Pathway Overexpression - Cell Painting Comparison', 
             fontsize=16, fontweight='bold', y=0.995)
plt.savefig('death_receptor_comparison_all_channels.png', dpi=150, bbox_inches='tight')
print("Saved: death_receptor_comparison_all_channels.png")
plt.close()

# Create composite RGB images for each condition
fig, axes = plt.subplots(1, 4, figsize=(20, 5))

for idx, (condition, ax) in enumerate(zip(condition_names, axes)):
    # Create RGB composite: DNA (blue), ER (green), AGP (red)
    dna = conditions[condition]['DNA']
    er = conditions[condition]['ER']
    agp = conditions[condition]['AGP']
    
    # Normalize each channel
    dna_norm = np.clip((dna - np.percentile(dna, 2)) / (np.percentile(dna, 98) - np.percentile(dna, 2)), 0, 1)
    er_norm = np.clip((er - np.percentile(er, 2)) / (np.percentile(er, 98) - np.percentile(er, 2)), 0, 1)
    agp_norm = np.clip((agp - np.percentile(agp, 2)) / (np.percentile(agp, 98) - np.percentile(agp, 2)), 0, 1)
    
    # Create RGB image
    rgb = np.stack([agp_norm, er_norm, dna_norm], axis=-1)
    
    ax.imshow(rgb)
    ax.set_title(condition, fontsize=14, fontweight='bold')
    ax.axis('off')

plt.suptitle('Death Receptor Pathway - RGB Composite (Red: AGP, Green: ER, Blue: DNA)', 
             fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('death_receptor_rgb_composite.png', dpi=150, bbox_inches='tight')
print("Saved: death_receptor_rgb_composite.png")
plt.close()

# Calculate basic statistics
print("\n" + "="*80)
print("BASIC IMAGE STATISTICS")
print("="*80)

for condition in condition_names:
    print(f"\n{condition}:")
    for channel in channels:
        img = conditions[condition][channel]
        print(f"  {channel}: mean={img.mean():.1f}, std={img.std():.1f}, "
              f"min={img.min()}, max={img.max()}")

print("\nImages created successfully!")
