import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from PIL import Image
import numpy as np
import pandas as pd

# Create a comprehensive figure
fig = plt.figure(figsize=(20, 24))
gs = gridspec.GridSpec(6, 3, figure=fig, hspace=0.4, wspace=0.3)

# Row 1: Overview images comparison
ax1 = fig.add_subplot(gs[0, 0])
negcon = np.array(Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/negcon_overview/BR00126545_D19_site1_overview.jpg'))
ax1.imshow(negcon)
ax1.set_title('Negative Control\n(BR00126545, D19)', fontsize=12, fontweight='bold')
ax1.axis('off')

ax2 = fig.add_subplot(gs[0, 1])
vhl_crispr = np.array(Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_overview/CP-CC9-R3-24_D13_site1_overview.jpg'))
ax2.imshow(vhl_crispr)
ax2.set_title('VHL CRISPR Knockout\n(CP-CC9-R3-24, D13)', fontsize=12, fontweight='bold')
ax2.axis('off')

ax3 = fig.add_subplot(gs[0, 2])
vhl_orf = np.array(Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_overview/BR00126547_H20_site1_overview.jpg'))
ax3.imshow(vhl_orf)
ax3.set_title('VHL ORF Overexpression\n(BR00126547, H20)', fontsize=12, fontweight='bold')
ax3.axis('off')

# Row 2: Morphology analysis
morph_img = Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_morphology_analysis.png')
ax4 = fig.add_subplot(gs[1:3, :])
ax4.imshow(morph_img)
ax4.set_title('Morphological Analysis - Cell and Nuclear Features', fontsize=14, fontweight='bold', pad=10)
ax4.axis('off')

# Row 3: Organelle analysis
org_img = Image.open('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_organelle_analysis.png')
ax5 = fig.add_subplot(gs[3:5, :])
ax5.imshow(org_img)
ax5.set_title('Organelle Analysis - Mitochondria, ER, and RNA', fontsize=14, fontweight='bold', pad=10)
ax5.axis('off')

# Row 4: Key statistics summary
ax6 = fig.add_subplot(gs[5, :])
ax6.axis('off')

# Load statistics
stats_df = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_morphology_stats.csv')
org_stats_df = pd.read_csv('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_organelle_stats.csv')

# Create summary text
summary_text = """
KEY FINDINGS - VHL CRISPR Knockout Morphological Changes:

CELL MORPHOLOGY:
• Cell Size: 54% reduction (p<1e-30) - Dramatic decrease in cell area
• Cell Perimeter: 33% reduction (p<1e-17) - Smaller cell boundaries
• Nuclear Area: 25% reduction (p<1e-15) - Smaller nuclei
• Nuclear DNA Intensity: 20% increase (p<1e-12) - Higher DNA condensation
• Nucleoli Count: 26% increase (6.2 vs 4.9 per cell) - More nucleoli per nucleus

ORGANELLE CHANGES:
• Mitochondrial Intensity: 58% reduction (p<1e-135) - Severe mitochondrial loss/dysfunction
• Mitochondrial Integrated Intensity: 81% reduction (p<1e-95) - Massive reduction in total mitochondria
• ER Intensity: 23% increase (p<1e-21) - ER expansion/stress response
• RNA Intensity: 30% increase (p<1e-26) - Increased transcriptional activity

BIOLOGICAL INTERPRETATION:
1. VHL loss leads to smaller, more compact cells with reduced cytoplasmic volume
2. Severe mitochondrial dysfunction consistent with metabolic reprogramming (Warburg effect)
3. ER expansion suggests ER stress and unfolded protein response activation
4. Increased RNA and nucleoli indicate compensatory transcriptional upregulation
5. Higher nuclear DNA intensity suggests chromatin condensation and cell cycle effects
"""

ax6.text(0.05, 0.95, summary_text, transform=ax6.transAxes, 
         fontsize=11, verticalalignment='top', fontfamily='monospace',
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

plt.suptitle('VHL CRISPR Knockout: Comprehensive Morphological Analysis\nHypoxia Response Pathway Disruption', 
             fontsize=18, fontweight='bold', y=0.995)

plt.savefig('/home/user/Documents/WorkingDir/JUMPDiscovery_attempt_1/vhl_comprehensive_figure.png', 
            dpi=300, bbox_inches='tight')
print("✓ Saved comprehensive figure")

