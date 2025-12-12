import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.spatial.distance import cosine
import json

# Load batch-corrected CRISPR data
print("Loading CRISPR data...")
crispr_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet')
print(f"CRISPR shape: {crispr_df.shape}")
print(f"CRISPR columns: {crispr_df.columns[:10].tolist()}")
print(f"Unique perturbations: {crispr_df['Metadata_JCP2022'].nunique()}")

# Load ORF data
print("\nLoading ORF data...")
orf_df = pd.read_parquet('Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet')
print(f"ORF shape: {orf_df.shape}")
print(f"ORF columns: {orf_df.columns[:10].tolist()}")
print(f"Unique perturbations: {orf_df['Metadata_JCP2022'].nunique()}")

# Load similarity data
print("\nLoading similarity data...")
crispr_sim = pd.read_parquet('JUMP_Similarity_Data/crispr_cosinesim_full.parquet')
print(f"CRISPR similarity shape: {crispr_sim.shape}")

# Sample some data
print("\nSample CRISPR data:")
print(crispr_df.head())

# Check for negative controls
print("\nChecking for negative controls...")
negcon_crispr = crispr_df[crispr_df['Metadata_JCP2022'].str.contains('negcon', case=False, na=False)]
print(f"Negative controls in CRISPR: {len(negcon_crispr)}")

negcon_orf = orf_df[orf_df['Metadata_JCP2022'].str.contains('negcon', case=False, na=False)]
print(f"Negative controls in ORF: {len(negcon_orf)}")

