import matplotlib.pyplot as plt
from PIL import Image
import numpy as np

# Load images
vhl_crispr = np.array(Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_overview/CP-CC9-R3-24_D13_site1_overview.jpg'))
vhl_orf = np.array(Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_overview/BR00126547_H20_site1_overview.jpg'))
negcon = np.array(Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/negcon_overview/BR00126545_D19_site1_overview.jpg'))

# Create figure
fig, axes = plt.subplots(1, 3, figsize=(18, 6))

axes[0].imshow(negcon)
axes[0].set_title('Negative Control\n(BR00126545, D19)', fontsize=14, fontweight='bold')
axes[0].axis('off')

axes[1].imshow(vhl_crispr)
axes[1].set_title('VHL CRISPR Knockout\n(CP-CC9-R3-24, D13)', fontsize=14, fontweight='bold')
axes[1].axis('off')

axes[2].imshow(vhl_orf)
axes[2].set_title('VHL ORF Overexpression\n(BR00126547, H20)', fontsize=14, fontweight='bold')
axes[2].axis('off')

plt.suptitle('VHL Perturbation Comparison - Cell Painting Overview', fontsize=16, fontweight='bold', y=0.98)
plt.tight_layout()
plt.savefig('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_overview_comparison.png', dpi=300, bbox_inches='tight')
print("Saved vhl_overview_comparison.png")

# Also create individual channel comparisons
# The overview images are RGB composites, let's analyze them
print(f"\nImage shapes:")
print(f"Negative Control: {negcon.shape}")
print(f"VHL CRISPR KO: {vhl_crispr.shape}")
print(f"VHL ORF OE: {vhl_orf.shape}")

# Calculate mean intensities per channel
print(f"\nMean intensities (RGB):")
print(f"Negative Control: R={negcon[:,:,0].mean():.1f}, G={negcon[:,:,1].mean():.1f}, B={negcon[:,:,2].mean():.1f}")
print(f"VHL CRISPR KO: R={vhl_crispr[:,:,0].mean():.1f}, G={vhl_crispr[:,:,1].mean():.1f}, B={vhl_crispr[:,:,2].mean():.1f}")
print(f"VHL ORF OE: R={vhl_orf[:,:,0].mean():.1f}, G={vhl_orf[:,:,1].mean():.1f}, B={vhl_orf[:,:,2].mean():.1f}")

