export type ExperienceKind = 'research' | 'teaching' | 'industry' | 'business';
export type ProjectCategory = 'omics' | 'structural' | 'ml' | 'software' | 'biotech';
export type JourneyId = 'roudehen' | 'tehran' | 'saarbruecken' | 'martinsried' | 'jena';

/** Skill sub-groups that represent the research core (used to order and colour visualisations). */
export const skillDomains: Array<{ id: string; groups: string[]; hue: number }> = [
  { id: 'singlecell', groups: ['Transcriptomics & Single-Cell Analysis'], hue: 172 },
  { id: 'genomics', groups: ['Genomics & Genome Assembly', 'Metagenomics & Microbial Ecology', 'Phylogeny & Comparative Genomics'], hue: 200 },
  { id: 'systems', groups: ['Functional Annotation & Systems Biology', 'Statistical Modeling & Machine Learning in Bioinformatics'], hue: 230 },
  { id: 'structural', groups: ['Protein Structure & Structural Bioinformatics'], hue: 262 },
  { id: 'ml', groups: ['Machine Learning & Data Science'], hue: 292 },
  { id: 'software', groups: ['Programming Languages', 'Frontend Frameworks & UI Technologies', 'Backend Development & APIs', 'Scripting & Automation Tools'], hue: 330 },
  { id: 'data', groups: ['Database Modeling & Optimization', 'SQL Databases', 'NoSQL Databases', 'Data Pipelines & ETL Systems', 'Scientific Plotting Tools', 'Dashboarding & Reporting Platforms', 'Visual Analytics & Network Tools'], hue: 20 },
  { id: 'devops', groups: ['DevOps Tools & CI/CD Pipelines', 'Containerization & Orchestration', 'System Administration & Linux Tools', 'Cloud Platforms & Authentication', 'Networking & Protocols'], hue: 45 },
  { id: 'wetlab', groups: ['Molecular & Microbial Biology Techniques', 'Analytical Instruments & Chromatography', 'In Vivo & Ex Vivo Experimental Protocols'], hue: 95 },
  { id: 'bioprocess', groups: ['Bioprocess & Bioreactor Engineering', 'Experimental Design & Laboratory Documentation', 'Lab Safety, Compliance & Regulatory Practices'], hue: 130 },
];

/** Tools that get a logo in marquees (simple-icons slug). Others render as text chips. */
export const toolLogos: Record<string, string> = {
  Python: 'python', R: 'r', 'C++': 'cplusplus', JS: 'javascript', TS: 'typescript', PyTorch: 'pytorch', TensorFlow: 'tensorflow',
  Docker: 'docker', K8s: 'kubernetes', Git: 'git', 'GitHub Actions': 'githubactions', n8n: 'n8n', React: 'react', Vite: 'vite',
  Tailwind: 'tailwindcss', Bootstrap: 'bootstrap', 'Node.js': 'nodedotjs', Express: 'express', Flask: 'flask', Django: 'django',
  FastAPI: 'fastapi', PostgreSQL: 'postgresql', MySQL: 'mysql', SQLite: 'sqlite', MongoDB: 'mongodb', Redis: 'redis',
  Jupyter: 'jupyter', LaTeX: 'latex', Plotly: 'plotly', 'scikit-learn': 'scikitlearn', Selenium: 'selenium', Bash: 'gnubash',
  'Linux CLI': 'linux', Conda: 'anaconda', Transformers: 'huggingface', Knime: 'knime', 'Firebase Auth': 'firebase', 'Power BI': 'powerbi',
};

/* ───────────────────────── evidence mapping (used by src/lib/derive.ts) ─────────────────────────
 * Which skill domains (ids of `skillDomains`) an entry is evidence for. This taxonomy interprets
 * the authorized portfolio records. Project tags are first matched against skill names
 * (case-insensitive); the hints below cover tags that are not skill names.
 */

/** Roles → domains (by experience id). Roles without a research/tech focus map to nothing. */
export const experienceDomains: Record<string, string[]> = {};

/** Project tags that are not skill names → domains. */
export const tagDomainHints: Record<string, string[]> = {
  'scRNA-seq': ['singlecell'],
  Spatial: ['singlecell'],
  'scATAC-seq': ['singlecell'],
  'RNA-seq': ['singlecell'],
  GBM: ['singlecell'],
  Bioconductor: ['singlecell'],
  Metagenomics: ['genomics'],
  Assembly: ['genomics'],
  MSA: ['genomics'],
  'Hi-C': ['genomics'],
  Bioinformatics: ['genomics'],
  Annotation: ['systems'],
  'Multi-omics': ['systems'],
  HMM: ['structural'],
  RoseTTAFold: ['structural'],
  PDB: ['structural'],
  ML: ['ml'],
  LSTM: ['ml'],
  PCA: ['ml'],
  OCR: ['ml'],
  Chemistry: ['ml'],
  Retrieval: ['ml'],
  Clustering: ['ml'],
  'Data Science': ['ml', 'data'],
  Automation: ['software'],
  BeautifulSoup: ['software'],
  TUI: ['software'],
  pytest: ['software'],
  'Pichia pastoris': ['bioprocess'],
  Bioreactor: ['bioprocess'],
  'Synthetic biology': ['wetlab'],
  iGEM: ['wetlab'],
};

/** Domains for projects whose tags give no domain (mostly archive repositories). */
export const categoryDomainFallback: Record<ProjectCategory, string[]> = {
  omics: ['genomics'],
  structural: ['structural'],
  ml: ['ml'],
  software: ['software'],
  biotech: ['bioprocess'],
};

/** Courses → domains by keywords in the (English) course name. */
export const courseDomainRules: Array<{ domain: string; match: RegExp }> = [
  { domain: 'singlecell', match: /single cell|rna sequencing|microarray/i },
  { domain: 'genomics', match: /genom|chip-seq|metagenom/i },
  { domain: 'systems', match: /network|systems|metabolic|precision medicine|proteomics|online databases|big biological data|applied bioinformatics/i },
  { domain: 'structural', match: /protein|molecular dynamic|vaccine/i },
  { domain: 'ml', match: /machine learning|artificial intelligence|data mining|data science|linear algebra/i },
  { domain: 'software', match: /python|django|front-end|ui\/ux|programming/i },
  { domain: 'data', match: /database|visuali[sz]|knime|business intelligence/i },
  { domain: 'devops', match: /docker/i },
  { domain: 'wetlab', match: /molecular testing|cell culture|microbiolog|histolog|lab animals|biosafety/i },
  { domain: 'bioprocess', match: /fermentation|\bgmp\b|\bglp\b/i },
];
