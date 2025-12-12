# Perturbation Discovery: Mining and Verifying Hypothesis about Cell Perturbations

## Overview

Perturbation discovery involves mining experimental datasets to identify novel biological patterns and generate testable hypotheses about cellular mechanisms. This challenging task requires distinguishing genuine perturbation effects from technical artifacts and off-target responses in high-dimensional morphological data. The complexity is amplified by heterogeneous cellular responses, where individual cells exhibit variable effects depending on cell cycle stage and stochastic processes. The challenge lies in integrating multiple sources: interpreting experimental data, synthesizing literature insights, exploring biological databases, reasoning across diverse domains, as well as performing single-cell analysis to verify population-level deviations and distinguish biological signals from noise. Success requires identifying meaningful morphological patterns, connecting observations to known pathways, and proposing novel mechanistic explanations while accounting for inherent perturbation variability.

### Goal

The primary goal is to conduct comprehensive perturbation discovery research by mining the JUMP Cell Painting dataset and complementary biological resources. Given that JUMP is a very large dataset, larger than most knowledge sources, there are two research approaches you can take, but you should be creative on top of that:

**Approach 1: Disease-First Discovery**
Target monogenic diseases or understudied cancer types. You are recommended to choose from hallmark genes lists for reference `hallmark_genesets.json`. Target a disease first, and then try to find genes for these disease with prominent morphology. Challenge existing paradigms and propose new mechanistic links by discovering novel genetic mechanisms through morphological pattern analysis in JUMP data, potentially revealing unexpected cellular pathways and disease connections.

**Approach 2: Perturbation-First Discovery**
Select interesting perturbations in JUMP based on your analysis (prominent or unique phenotypes, unexpected high correlations between genes, unusual morphological patterns, interesting gene groups) as a starting point and investigate what disease connections they might reveal. Try research on groups of genes with transcriptional relations, or similar in functions, to understand the mechanisim of the shared morphology. However, try focus on relation to human disease to make sure your discovery have translational effect.

For either approach, you should:

1. **Data exploration and integration**: Explore datasets deeply to understand structure, content, and key features. Identify relevant data files and formats. Use computational analysis and visual inspection of morphological data, describing specific subcellular architectural changes (organelle distribution, protein localization, membrane structures, nuclear morphology). Connect findings with cited literature and protein databases with proper references
2. **Disruptive discovery**: Identify novel gene perturbation-phenotype relationships and formulate testable mechanistic predictions that provide disruptive insights - new disease explanations, previously unknown pathway links, or novel biological patterns rather than descriptive validations of existing knowledge. Combine disease-first and data-driven approaches for comprehensive insights
3. **Evidence grounding**: Ensure all phenotype-function connections have verifiable mechanistic support with proper citations
4. **Positive effects focus**: Focus exclusively on observable morphological changes and significant correlations. Only work on genes with sufficient evidence in morphological changes - avoid genes with no observable effects that are too similar to negative control images. Avoid interpreting absence of effects or negative correlations, as these may result from batch effects, off-target perturbations, or technical artifacts rather than genuine biological signals
5. **Form generalizable conclusions:** After making hypothesis about one gene, look for evidence regarding genes upstream and downstream, as well as from the same functional group. Compare their single-cell features based on their raw images and phenotypes. Also discuss their implications for not only one disease, but similar disease groups. For the same gene, compare knockout and overexpression effect. These comparison could help understand the pathways as well as lead to disruptive discoveries.

Check the `Verified_Hypothesis.txt` file to make sure you are not working on repetitive perturbations or hypothesis.

### Output Requirements

The research should produce key deliverables through an iterative discovery process. These objectives can be approached flexibly as needed, with continuous refinement as new observations inform hypotheses and validation results guide further investigation:

**Objective 1: Factual Observations Report**
Create a comprehensive report documenting all factual observations and how you obtained them. This should include detailed methodology, data analysis approaches, tools used, systematic findings from JUMP dataset analysis with supporting visualizations, statistical analyses, and morphological observations.

**Objective 2: Iterative Hypothesis Development**
Generate testable biological hypotheses through iterative research cycles: conduct research → gather evidence → narrow and refine hypothesis → conduct deeper research → further precision. Iteratively update hypotheses and findings in report files to track progress. Connect multiple sources, synthesize literature, identify knowledge gaps, and formulate novel mechanistic predictions. **Select the most promising hypothesis and continuously refine through progressively deeper investigation.**

**Objective 3: Multi-Source Experimental Validation**
Systematically validate hypotheses by digging into multiple sources including literature, biological databases, and experimental data for comprehensive verification. Create direct visualizations that showcase key findings, making discoveries straightforward to understand and highlighting important evidence. During validation, download JUMP channel images of perturbations and negative controls, use coding or CellProfiler to process and perform calculations for detailed verification. Examine aggregated understanding over phenotype features as well as single-cell distribution analysis to capture heterogeneous perturbation responses. Provide confidence assessments on experimental support strength and data quality to establish claim reliability.

**Iterative Discovery Process**
These objectives should be developed iteratively, allowing new observations to refine the hypothesis, failed validations to suggest alternative mechanisms, and successful validations to open new research directions. For example, you could first process and analyze one or two perturbations, see some typical morphology changes, then find literature and database, form new hypothesis, then write code to add more supportive metrics and detection of the subcellular component, then try to find more morpohology alterations.

**Final Outcome**

A report for the hypothesis `report_{hypothesis_name}.md` including detailed background for the hypothesis (including the problem it addresses and the research gap), the evidences (factual evidence from experimental data, as well as cited evidence from other resources, **including http links to page contents, citation to papers and pathways, JUMP well id and images, and  visualization plots to showcase discovery**), conclusions including results drawn by reasoning and data analysis on these evidences, also further experimental validation suggestions. You should minimize the reliance on additional experimental validations and try to draw concrete conclusions based on JUMP and other knowledge sources.

A visualization figure consists of all crucial evidence, including plots of quantitative analysis, single cell images comparison, mechanisim illustration.

**Self-Evaluation**

Perform fine-grained self-evaluation on hypothesis quality:

1. **Confidence (0-100)**: Sum of per-subclaim evidence scores, normalized:

   - Experimental evidence: Highest weight, score dependent on data quality and reproducibility (>3 observations)
   - Database evidence: High weight for pathway/protein localization support
   - Literature evidence: Lower weight, varies by quality and direct relevance to claims
2. **Novelty (0-100)**: Score deducted based on literature coverage:

   - Low score: >1 paper mentions every part of the claim (<50)
   - Medium score: Some parts of claim found in literature (50-80)
   - High score: Consensus of lack of evidence or novel connections (80-100)

Finally update the `Verified_Hypothesis.txt` to include your finished hypothesis, include just the title and evaluation scores.

## Resources:

### JUMP Data Resources:

The JUMP (Joint Undertaking in Morphological Profiling) consortium provides comprehensive Cell Painting datasets capturing morphological responses to genetic perturbations using high-throughput fluorescence microscopy across five cellular channels: DNA (Hoechst), RNA (SYTO14), ER (concanavalin A), mitochondria (MitoTracker), and actin/cytoskeleton (phalloidin/WGA), plus brightfield. Datasets include CRISPR knockout perturbations (loss-of-function via guide RNAs) and ORF overexpression perturbations (gain-of-function via additional gene copies), covering thousands of gene targets with negative controls across multiple cell lines and experimental conditions for robust functional genomics studies.

For JUMP database, it is experimental evidence for observing and understanding perturbations. You should dig in the database to verify your hypothesis about perturbations, or draw further insights about genes. Perturbed cells often results in morphological changes, both on macro levels (higher proliferation rates, cell density and intensity), as well as micro levels (subcellular changes). For each perturbation, there are multiple experiments (wells) on more than one plate. For each well, the images consist of 5 channels and 9 sites.

Below are some resources for accessing JUMP dataset.

#### 1. API Tools for JUMP Database

These tools provide programmatic access to JUMP images, gene mapping, and control wells. Built on jump_portrait and broad_babel libraries, they enable efficient retrieval and analysis of Cell Painting data.

- **`get_images`**: Retrieves high-resolution Cell Painting images from JUMP dataset using gene names or plate coordinates. Supports all 5 channels (DNA, ER, AGP, Mito, RNA) plus Brightfield across 9 sites per well. Options include illumination correction, batch processing via JSON Lines files, and TIFF export with proper naming conventions. After obtaining these images, run coding or cellprofiler profiling.
- **`get_images_overview`**: Downloads smaller overview images (~200-300KB JPEG) with all channels pre-stacked from phenaid.ardigen.com. Provides faster access and reduced storage requirements compared to full-resolution images while maintaining visual information for quick perturbation assessment.
- **`gene_to_jump`**: Maps gene names to JUMP dataset identifiers and plate/well locations using broad_babel. Queries both CRISPR and ORF datasets to find experimental coordinates for target genes. Outputs table format or JSON Lines for downstream processing and batch operations.
- **`jump_to_gene`**: Reverse lookup tool that maps JUMP IDs, JCP IDs, or plate/well coordinates back to gene names using broad_babel. Takes JCP identifiers or plate/well coordinates and returns corresponding gene names and metadata. Supports both CRISPR and ORF datasets with flexible input formats including batch processing from files.
- **`fetch_control`**: Identifies negative and positive control wells within the same plates as perturbations. Supports distance-based ranking from query wells and automatic plate type detection. Essential for proper experimental controls and statistical comparisons in perturbation studies.

#### 2. Raw image data analysis (Must be performed)

Despite you are given preprocessed features of JUMP database. You are still encouraged to extract some perturbation-specific features of the cells, especially those related to single-cell subcellular structures to understand the inner mechanisims of morphological changes. Try to cover more than one perturbation type (including downstream, upstream, overexpression and knockouts, related perturbations too), for understanding differences and similarities.

**Descriptive and Illustrative details for Phenotype**: When describing morphological changes, you should try to go into descriptive details. First perform comprehensive analysis over all cellular structures: nuclei, cytoskeleton, mitochondria, nucleoli, cytoplasms, etc. Then perform case-specific analysis based on the possible subcellular behavior, e.g. cell death -- circular shape, Nuclei/Cell area percentage, nucleoli intensity, speckles, etc. Analyze features beyond simple area, shape, and intensity and be creative about the calculation metrics and objects in investigation.

**Analyzing Single-Cell Features**: For perturbation imaging data, not every cell behaves similarly, because cells may be in different cell cycle stage, and some cells may be off-target. Also replication experiments on done on at least 3 wells. Therefore, you are recommended to compare and cluster single-cell features for the same perturbation across different cells and wells, as well as across multiple perturbations, and negative controls. You must create a overview visualization consist of diverse plots for this.

**Using Cellprofiler Software with tool ` run_cellprofiler`**: Focus on cell imaging data analysis using CellProfiler whenever possible to extract meaningful measurements from images. The  `JUMP_analysis.cppipe` is the basic CellProfiler pipeline for producing the interpretable features including detection of all cell components. You could also try to limit single-cell features on one or more specific channels, e.g. mitochondria, Endoplasimic reticulum, to study specific components within a cell. 

If your created pipeline have metadata parsing problems, reference `JUMP_load_data.cppipe` modules. It provides a basic pipeline for loading downloaded images into different channels.

```
CellProfiler Pipeline: http://www.cellprofiler.org
Version:5
DateRevision:413
GitHash:
ModuleCount:4
HasImagePlaneDetails:False

Images:[module_num:1|svn_version:'Unknown'|variable_revision_number:2|show_window:False|notes:[]|batch_state:array([], dtype=uint8)|enabled:True|wants_pause:False]
    Filter images?:Images only
    Select the rule criteria:and (extension does isimage) (directory doesnot containregexp "[\\\\/]\\.")

Metadata:[module_num:2|svn_version:'Unknown'|variable_revision_number:6|show_window:False|notes:[]|batch_state:array([], dtype=uint8)|enabled:True|wants_pause:False]
    Extract metadata?:Yes
    Metadata data type:Text
    Metadata types:{}
    Extraction method count:1
    Metadata extraction method:Extract from file/folder names
    Metadata source:File name
    Regular expression to extract from file name:^(?P<Plate>.+)_(?P<Well>.+)_site(?P<Site>[0-9]+)_(?P<Channel>.+)
    Regular expression to extract from folder name:(?P<Date>[0-9]{4}_[0-9]{2}_[0-9]{2})$
    Extract metadata from:All images
    Select the filtering criteria:and (file does contain "")
    Metadata file location:Elsewhere...|
    Match file and image metadata:[]
    Use case insensitive matching?:No
    Metadata file name:None
    Does cached metadata exist?:No

NamesAndTypes:[module_num:3|svn_version:'Unknown'|variable_revision_number:8|show_window:False|notes:[]|batch_state:array([], dtype=uint8)|enabled:True|wants_pause:False]
    Assign a name to:Images matching rules
    Select the image type:Grayscale image
    Name to assign these images:DNA
    Match metadata:[]
    Image set matching method:Order
    Set intensity range from:Image metadata
    Assignments count:5
    Single images count:0
    Maximum intensity:255.0
    Process as 3D?:No
    Relative pixel spacing in X:1.0
    Relative pixel spacing in Y:1.0
    Relative pixel spacing in Z:1.0
    Select the rule criteria:and (file does contain "DNA")
    Name to assign these images:OrigDNA
    Name to assign these objects:Cell
    Select the image type:Grayscale image
    Set intensity range from:Image metadata
    Maximum intensity:255.0
    Select the rule criteria:and (file does contain "ER")
    Name to assign these images:OrigER
    Name to assign these objects:Cell
    Select the image type:Grayscale image
    Set intensity range from:Image metadata
    Maximum intensity:255.0
    Select the rule criteria:and (file does contain "AGP")
    Name to assign these images:OrigAGP
    Name to assign these objects:Cell
    Select the image type:Grayscale image
    Set intensity range from:Image metadata
    Maximum intensity:255.0
    Select the rule criteria:and (file does contain "Mito")
    Name to assign these images:OrigMito
    Name to assign these objects:Cell
    Select the image type:Grayscale image
    Set intensity range from:Image metadata
    Maximum intensity:255.0
    Select the rule criteria:and (file does contain "RNA")
    Name to assign these images:OrigRNA
    Name to assign these objects:Cell
    Select the image type:Grayscale image
    Set intensity range from:Image metadata
    Maximum intensity:255.0

Groups:[module_num:4|svn_version:'Unknown'|variable_revision_number:2|show_window:False|notes:[]|batch_state:array([], dtype=uint8)|enabled:True|wants_pause:False]
    Do you want to group your images?:Yes
    grouping metadata count:3
    Metadata category:Plate
    Metadata category:Well
    Metadata category:Site

```

Follow these steps to debug cellprofiler pipeline and code:

1. As a first step, try run `JUMP_analysis.cppipe` pipeline to see if the pipeline works as expected. If not running, make adaptations to the file loading modules. Save intermediate results as figures to visualize segmentation quality.
2. Edit the modules and hyperparameters in the pipeline to improve the quality of the output, especially based on your comparison of figures.
3. Rerun your pipeline after each change to see if it works as expected.
4. Use cellprofiler gui subagent for debugging if stuck, but you need to make sure the pipeline is correctly loading images first.
5. You should also use GUI subagent to check segmentation quality of complex structures, e.g. foci.

**Cell Type Classification**: For cell cycle studies, you could cluster the features of each cell and classify all single cells (e.g. k-means). classify them into multiple types of cells with different phenotypes, e.g. normal, enlarged, round, dying, etc. Count and detect the occurance of each type of cells in perturbation and negative control images.

**Single-cell Visualization and Description:** Create single-cell image crops, find representative cells within clusters and compare them side by side.

All these tools could easily result in wrong calculation. You should visualize segmentation masks and detected objects to make sure each single measurement is correct. Also, if the tools take a long time to run, break it into multiple splits and run one by one.

**Typical interpretation of phenotypes identified through Cell Profiling:** You are recommende to try calculate these features if related

| Feature                                                                      | Channel  | Biological Interpretation                                                                                                               |
| ---------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Higher nuclei granularity                                                    | Mito     | Fragmentation of mitochondria                                                                                                           |
| Higher Mito DNA Correlation Costes                                           | Mito/DNA | DNA fragmentation and mitochondrial heterogeneity                                                                                       |
| Large Cell texture variance                                                  | RNA      | Increased/decreased transcription or RNA processing                                                                                     |
| Higher Cell texture InfoMeas2                                                | DNA      | DNA damage                                                                                                                              |
| Higher DNA AGP correlation (K) in Cytoplasm (calculated with colocalization) | AGP/DNA  | Actin reorganization associated with DNA damage and Golgi fragmentation                                                                 |
| Increased nuclei granularity                                                 | RNA      | Changes in RNA abundance or localization (transcription/RNA processing alterations)                                                     |
| Increased cytoplasm FormFactor (AreaShape)                                   | /        | Cell rounding consistent with cell death and pre-apoptotic changes                                                                      |
| Fewer Cell Counts or Cell Density                                            | /        | Could indicate cell death, but need to be combined with cell rounding phenomenon as batch effects lead to inaccuracies in cell numbers. |
| Increased cells with large nuclei size (over 2 times)                        | DNA      | Could indicate failed cell devision, cell cycle arrest                                                                                  |

#### 3. Processed Database Features

These features are obtained by using CellProfiler for cell profiling and further processing, including PCA, Batch corrections. You could use them as tools for **comparing between perturbations, or perform general feature analysis.** However, you are encouraged to still dig in the original images to check out more visual details of these perturbations. You should access and process these files with coding. When analyzing these features, pay attention to the computation and memory complexity of the algorithm as the matrix are large, such as calculation per perturbation correlation over the entire matrix.

#### Batch Corrected JUMP Features:

High-quality morphological profiles with comprehensive preprocessing including cell-cycle correction, variance filtering, outlier removal, feature selection, sphering, and harmony batch correction. All datasets contain 4 metadata columns (Metadata_Source, Metadata_Plate, Metadata_Well, Metadata_JCP2022) for experimental tracking. Features are transformed to X_1 through X_N format after dimensionality reduction.

- `Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_PCA_corrected_crispr.parquet`
  CRISPR knockout profiles (51,185 rows, 259 features) with additional PCA dimensionality reduction. Tracks 7,977 unique perturbations across 148 plates with 384 well positions from source_13. File size: 76.2 MB.
- `Batch_Corrected_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_featselect_sphering_harmony_orf.parquet`
  ORF overexpression profiles (81,660 rows, 722 features) tracking 15,131 unique perturbations across 225 plates and 376 well positions from source_4. Larger dataset with nearly double the perturbations compared to CRISPR. File size: 345.1 MB.

#### Interpretable JUMP Features:

Minimally processed profiles that preserve original Cell Painting feature space for biological interpretation. Both datasets retain interpretable morphological measurements including Cells_AreaShape_Area, Cells_AreaShape_BoundingBoxArea, and other cellular features with biological meaning. Processing includes cell-cycle correction, variance filtering, and outlier removal only. The features include area, shape, size, cell count, density, etc.

- `Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_crispr.parquet`
  CRISPR profiles (51,185 rows, 3,651 features) maintaining full feature interpretability. Same experimental design as batch-corrected version with 148 plates and 7,977 perturbations. File size: 1.07 GB.
- `Interpretable_JUMP_Features/profiles_wellpos_cc_var_mad_outlier_orf.parquet`
  ORF profiles (81,660 rows, 3,636 features) covering 15,131 perturbations across 225 plates from source_4, enabling mechanistic studies of gene overexpression effects. File size: 1.73 GB.

#### JUMP Similarity Data:

Pre-computed cosine similarity matrices containing pairwise comparisons of perturbations. No metadata columns - matrices use JCP2022 identifiers as both row indices and column names. Values represent morphological similarity scores enabling rapid identification of functionally related perturbations without recomputing distances.

- `JUMP_Similarity_Data/crispr_cosinesim_full.parquet`
  CRISPR similarity matrix (7,977 x 7,977) for all knockout perturbations. File size: 227.6 MB.
- `JUMP_Similarity_Data/orf_cosinesim_full.parquet`
  ORF similarity matrix (15,131 x 15,131) for all overexpression perturbations, reflecting the greater number of ORF perturbations. File size: 812.8 MB.

### Web Knowledge Resources:

Access these resources by launching Chromium GUI subagents. When using subagents, especially Chromium subagent to browse the internet, make sure to provide detailed instructions on how to use the browser to find the information you need.

* Human Protein Atlas: `https://www.proteinatlas.org/`
  The Human Protein Atlas (HPA) is a comprehensive open-access database mapping spatial distribution and expression of human proteins across tissues, organs, and cell lines. Version 25.0 covers ~87% of the human protein-coding genome using 27,883 antibodies targeting 17,407 unique proteins, generating over 10 million single-cell resolution images. The database includes specialized sections: Tissue Atlas (15,313 proteins in >40 tissues), Subcellular Atlas (13,147 genes with protein localization via immunofluorescence), Pathology/Cancer Atlas (cancer-related expression), and Brain Atlas. It also contains single-cell gene expression information of different cell types. HPA serves as a critical resource for understanding protein function, tissue-specific expression patterns, disease mechanisms, and protein mislocalization, making it invaluable for validating perturbation effects and understanding cellular responses observed in JUMP datasets.

  Additionally, there are essential protein localization evidence images on HPA. Download them and compare with your morphological data.
* KEGG Database: `https://www.genome.jp/kegg/` search about genes to browse related pathway graph. When using this database, load pathway graphs via the map links `mapxxxxx`, look at the upstream and downstreams of the pathway especially the part involving the perturbed gene, as well as the relations of the genes to disease. In the map interface, pan around to find the perturbed gene. Try to understand its mechanisms and formulate it in the report. Before drawing any pathway or mechanistic conclusions, search on KEGG. Think about missing links or potential regulations.

  Additionally, KEGG provide rich metadata about perturbations, especially for disease-related genes beyond cancer. It provides links from genes to disease.
* Get related work report with: `https://openscilm.allen.ai/`  type a query into the search panel and a report on related papers with citations will be drafted. This tool already gives a very good summary of related work, only click on references to look for more details on abstract. Provide the subagent with usage: first click on the search bar, type in the paper you are looking for, and then click on the paper plane icon to enter search.
* Search generally on `www.google.com`
