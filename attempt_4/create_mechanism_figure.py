import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
import numpy as np

fig, axes = plt.subplots(1, 3, figsize=(20, 8))

# Color scheme
color_receptor = '#e74c3c'
color_adaptor = '#9b59b6'
color_caspase = '#3498db'
color_nfkb = '#f39c12'
color_proliferation = '#2ecc71'
color_apoptosis = '#e67e22'

# Panel A: Normal (Wild-type) - Constitutive Anti-Proliferative Signaling
ax = axes[0]
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')
ax.set_title('A. Wild-Type: Constitutive Growth Suppression', fontsize=14, fontweight='bold', pad=20)

# Cell membrane
membrane = mpatches.Rectangle((0.5, 3), 9, 0.3, linewidth=2, edgecolor='black', facecolor='lightgray')
ax.add_patch(membrane)
ax.text(5, 3.5, 'Cell Membrane', ha='center', va='bottom', fontsize=10, style='italic')

# TNFRSF10B receptor
receptor = mpatches.FancyBboxPatch((4, 3.3), 2, 1.5, boxstyle="round,pad=0.1", 
                                   linewidth=2, edgecolor=color_receptor, facecolor=color_receptor, alpha=0.7)
ax.add_patch(receptor)
ax.text(5, 4.1, 'TNFRSF10B\n(TRAIL-R2)', ha='center', va='center', fontsize=9, fontweight='bold', color='white')

# FADD
fadd = Circle((5, 2), 0.4, linewidth=2, edgecolor=color_adaptor, facecolor=color_adaptor, alpha=0.7)
ax.add_patch(fadd)
ax.text(5, 2, 'FADD', ha='center', va='center', fontsize=8, fontweight='bold', color='white')

# CASP8
casp8 = mpatches.FancyBboxPatch((4.3, 0.8), 1.4, 0.8, boxstyle="round,pad=0.05", 
                                linewidth=2, edgecolor=color_caspase, facecolor=color_caspase, alpha=0.7)
ax.add_patch(casp8)
ax.text(5, 1.2, 'CASP8', ha='center', va='center', fontsize=9, fontweight='bold', color='white')

# Arrows showing signaling
arrow1 = FancyArrowPatch((5, 3.3), (5, 2.4), arrowstyle='->', mutation_scale=20, linewidth=2, color='black')
ax.add_patch(arrow1)
arrow2 = FancyArrowPatch((5, 1.6), (5, 1.6), arrowstyle='->', mutation_scale=20, linewidth=2, color='black')
ax.add_patch(arrow2)

# Constitutive signaling
ax.text(6.5, 2, 'Constitutive\nAssembly', ha='left', va='center', fontsize=9, style='italic')

# Downstream effects
effect_box1 = mpatches.FancyBboxPatch((0.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor=color_nfkb, facecolor=color_nfkb, alpha=0.3)
ax.add_patch(effect_box1)
ax.text(2.5, 6.5, 'NF-κB Modulation', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(2.5, 6, 'PD-L1 Degradation', ha='center', va='center', fontsize=9)

effect_box2 = mpatches.FancyBboxPatch((5.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor=color_proliferation, facecolor=color_proliferation, alpha=0.3)
ax.add_patch(effect_box2)
ax.text(7.5, 6.5, 'Growth Suppression', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(7.5, 6, 'Cell Cycle Regulation', ha='center', va='center', fontsize=9)

# Arrows to effects
arrow3 = FancyArrowPatch((5, 0.8), (2.5, 5.5), arrowstyle='->', mutation_scale=15, linewidth=1.5, 
                        color=color_nfkb, linestyle='dashed')
ax.add_patch(arrow3)
arrow4 = FancyArrowPatch((5, 0.8), (7.5, 5.5), arrowstyle='->', mutation_scale=15, linewidth=1.5, 
                        color=color_proliferation, linestyle='dashed')
ax.add_patch(arrow4)

# Result
result_box = mpatches.FancyBboxPatch((2, 8), 6, 1, boxstyle="round,pad=0.1", 
                                     linewidth=3, edgecolor='green', facecolor='lightgreen', alpha=0.5)
ax.add_patch(result_box)
ax.text(5, 8.5, 'Normal Cell Density (1.0x)', ha='center', va='center', fontsize=11, fontweight='bold')

# Panel B: Knockout - Loss of Growth Suppression
ax = axes[1]
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')
ax.set_title('B. Knockout: Loss of Growth Suppression', fontsize=14, fontweight='bold', pad=20)

# Cell membrane
membrane = mpatches.Rectangle((0.5, 3), 9, 0.3, linewidth=2, edgecolor='black', facecolor='lightgray')
ax.add_patch(membrane)
ax.text(5, 3.5, 'Cell Membrane', ha='center', va='bottom', fontsize=10, style='italic')

# X marks showing knockout
x_mark1 = ax.text(5, 4.1, '✗', ha='center', va='center', fontsize=40, color='red', fontweight='bold', alpha=0.7)
x_mark2 = ax.text(5, 2, '✗', ha='center', va='center', fontsize=30, color='red', fontweight='bold', alpha=0.7)
x_mark3 = ax.text(5, 1.2, '✗', ha='center', va='center', fontsize=30, color='red', fontweight='bold', alpha=0.7)

ax.text(5, 4.5, 'TNFRSF10B KO', ha='center', va='bottom', fontsize=9, fontweight='bold', color='red')
ax.text(5, 2.5, 'FADD KO', ha='center', va='bottom', fontsize=9, fontweight='bold', color='red')
ax.text(5, 1.7, 'CASP8 KO', ha='center', va='bottom', fontsize=9, fontweight='bold', color='red')

# Loss of downstream effects
effect_box1 = mpatches.FancyBboxPatch((0.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor='gray', facecolor='gray', alpha=0.2, linestyle='dashed')
ax.add_patch(effect_box1)
ax.text(2.5, 6.5, 'NF-κB Dysregulation', ha='center', va='center', fontsize=10, fontweight='bold', color='gray')
ax.text(2.5, 6, 'PD-L1 Accumulation', ha='center', va='center', fontsize=9, color='gray')

effect_box2 = mpatches.FancyBboxPatch((5.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor='gray', facecolor='gray', alpha=0.2, linestyle='dashed')
ax.add_patch(effect_box2)
ax.text(7.5, 6.5, 'Loss of Suppression', ha='center', va='center', fontsize=10, fontweight='bold', color='gray')
ax.text(7.5, 6, 'Uncontrolled Growth', ha='center', va='center', fontsize=9, color='gray')

# Result
result_box = mpatches.FancyBboxPatch((1.5, 8), 7, 1, boxstyle="round,pad=0.1", 
                                     linewidth=3, edgecolor='red', facecolor='#ffcccc', alpha=0.7)
ax.add_patch(result_box)
ax.text(5, 8.5, 'Massive Proliferation (11x)', ha='center', va='center', fontsize=11, fontweight='bold', color='red')

# Panel C: Overexpression - Modest Effects
ax = axes[2]
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')
ax.set_title('C. Overexpression: Modest/No Effect', fontsize=14, fontweight='bold', pad=20)

# Cell membrane
membrane = mpatches.Rectangle((0.5, 3), 9, 0.3, linewidth=2, edgecolor='black', facecolor='lightgray')
ax.add_patch(membrane)
ax.text(5, 3.5, 'Cell Membrane', ha='center', va='bottom', fontsize=10, style='italic')

# Multiple receptors (overexpression)
for i, x_pos in enumerate([3.5, 5, 6.5]):
    receptor = mpatches.FancyBboxPatch((x_pos-0.7, 3.3), 1.4, 1.5, boxstyle="round,pad=0.1", 
                                       linewidth=2, edgecolor=color_receptor, facecolor=color_receptor, alpha=0.7)
    ax.add_patch(receptor)
    if i == 1:
        ax.text(x_pos, 4.1, 'TNFRSF10B\nOE', ha='center', va='center', fontsize=8, fontweight='bold', color='white')

# Multiple CASP8
for i, x_pos in enumerate([3.5, 5, 6.5]):
    casp8 = mpatches.FancyBboxPatch((x_pos-0.5, 0.8), 1, 0.8, boxstyle="round,pad=0.05", 
                                    linewidth=2, edgecolor=color_caspase, facecolor=color_caspase, alpha=0.7)
    ax.add_patch(casp8)
    if i == 1:
        ax.text(x_pos, 1.2, 'CASP8\nOE', ha='center', va='center', fontsize=8, fontweight='bold', color='white')

# Saturation note
ax.text(5, 2, 'Pathway Saturation\n(No Additional Effect)', ha='center', va='center', 
        fontsize=9, style='italic', bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.3))

# Downstream effects (similar to WT)
effect_box1 = mpatches.FancyBboxPatch((0.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor=color_nfkb, facecolor=color_nfkb, alpha=0.3)
ax.add_patch(effect_box1)
ax.text(2.5, 6.5, 'NF-κB Modulation', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(2.5, 6, '(Already Saturated)', ha='center', va='center', fontsize=9, style='italic')

effect_box2 = mpatches.FancyBboxPatch((5.5, 5.5), 4, 1.5, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor=color_proliferation, facecolor=color_proliferation, alpha=0.3)
ax.add_patch(effect_box2)
ax.text(7.5, 6.5, 'Growth Suppression', ha='center', va='center', fontsize=10, fontweight='bold')
ax.text(7.5, 6, '(Already Saturated)', ha='center', va='center', fontsize=9, style='italic')

# Result
result_box = mpatches.FancyBboxPatch((1.5, 8), 7, 1, boxstyle="round,pad=0.1", 
                                     linewidth=3, edgecolor='orange', facecolor='#ffe6cc', alpha=0.7)
ax.add_patch(result_box)
ax.text(5, 8.5, 'Minimal Change (1.0-1.5x)', ha='center', va='center', fontsize=11, fontweight='bold', color='orange')

plt.suptitle('Death Receptor Pathway: Constitutive Anti-Proliferative Function', 
             fontsize=16, fontweight='bold', y=0.98)

plt.tight_layout()
plt.savefig('death_receptor_mechanism_model.png', dpi=150, bbox_inches='tight')
print("Saved: death_receptor_mechanism_model.png")
plt.close()

print("\nMechanism figure created!")
