'use strict';

// Entirely fictional sample records for screenshots of the live templates.
function galleryPreviewPortfolio(origin) {
  const label = ['Biosystems Researcher', 'Data Visualization', 'Scientific Software'];
  const project = (title, description, ...type_key) => ({ title, description, type_key });
  const role = (role, institution, location, duration, description, ...type_key) => ({
    role, institution, location, duration, description, type_key,
  });
  const skill = (short_name, long_name = short_name) => ({ short_name, long_name });

  return {
    basics: {
      fname: 'Avery',
      lname: 'Quinn',
      label,
      summary: 'I build visual tools for understanding complex biological systems. My work brings together molecular research, reproducible software, and clear interfaces for exploring scientific data.',
      location: { city: 'Jena', country: 'Germany' },
      email: 'avery.quinn@example.com',
      Pictures: [
        { type_of: 'profile', URL: `${origin}/__preview-portrait.svg` },
        { type_of: 'cover', URL: `${origin}/__preview-cover.svg` },
      ],
    },
    projects: [
      project('Living Systems Atlas', 'An interactive map of cell populations and the molecular signals that connect them.', 'Single-cell genomics', 'Data visualization', 'RNA-seq'),
      project('Molecular Field Notes', 'A searchable workspace for comparing protein structure models and documenting observations.', 'Protein structure', 'Structural bioinformatics', 'Python'),
      project('Open Bench Workflow', 'A small application for tracking experimental samples and building reproducible analysis reports.', 'Scientific software', 'TypeScript', 'Python'),
      project('Signal Reader', 'A visual playground for exploring how machine learning models distinguish signals from noise.', 'Machine learning', 'Data science', 'PyTorch'),
      project('Fermentation Watch', 'A time-series view of culture conditions, measurement intervals, and process stability.', 'Biotech', 'Fermentation', 'D3'),
      project('Genome Sketchbook', 'An annotated view of genome features, arranged into readable tracks and landmarks.', 'Genomics', 'Data visualization', 'JavaScript'),
      project('Pipeline Cabinet', 'A collection of small utilities for inspecting file formats and validating sequencing workflows.', 'Bioinformatics', 'Linux', 'Nextflow'),
      project('Pattern Library', 'A set of accessible interface patterns for presenting uncertainty in research dashboards.', 'Scientific software', 'TypeScript', 'Accessibility'),
      project('Culture Conditions', 'A notebook for comparing microbial culture experiments under a range of conditions.', 'Biotech', 'Molecular biology', 'R'),
    ],
    experiences: [
      role('Biosystems Researcher', 'Meridian Research Studio', 'Jena, Germany', '2023-09 - present', 'Builds tools for exploring molecular measurements and collaborates with lab teams on experimental design.', 'Bioinformatics', 'Research'),
      role('Research Software Developer', 'Northstar Methods Lab', 'Saarbrücken, Germany', '2020-02 - 2023-07', 'Developed reproducible data-processing workflows and web interfaces for scientific collections.', 'Scientific software', 'Data engineering'),
      role('Teaching Assistant', 'Orchard Institute of Science', 'Tehran, Iran', '2018-09 - 2019-12', 'Led practical sessions on programming, statistics, and scientific communication.', 'Teaching', 'Statistics'),
    ],
    education: [
      { institution: 'Meridian Institute of Technology', location: 'Saarbrücken, Germany', area: 'Computational Biosciences', studyType: 'MSc', startDate: '2018', endDate: '2020' },
      { institution: 'Orchard Institute of Science', location: 'Tehran, Iran', area: 'Biological Sciences', studyType: 'BSc', startDate: '2014', endDate: '2018' },
    ],
    publications: [
      { title: 'Visual Grammar for Molecular Evidence', authors: ['Avery Quinn', 'Morgan Hale'], type: 'Article', status: 'Published', year: '2024', journal: 'Journal of Illustrative Methods' },
      { title: 'Reproducible Maps of Cell Populations', authors: ['Avery Quinn'], type: 'Book chapter', status: 'Published', year: '2023', book_title: 'Handbook of Example Workflows' },
    ],
    skills: {
      Bioinformatics: {
        'Transcriptomics & Single-Cell Analysis': [skill('RNA-seq'), skill('Single-cell analysis')],
        'Genomics & Genome Assembly': [skill('Genome annotation')],
        'Statistical Modeling & Machine Learning in Bioinformatics': [skill('Statistics')],
        'Protein Structure & Structural Bioinformatics': [skill('Protein modeling'), skill('Molecular visualization')],
      },
      Programming: {
        'Programming Languages': [skill('Python'), skill('TypeScript'), skill('R')],
        'Frontend Frameworks & UI Technologies': [skill('Accessibility')],
        'DevOps Tools & CI/CD Pipelines': [skill('Git')],
        'System Administration & Linux Tools': [skill('Linux')],
      },
      'Data Science': {
        'Machine Learning & Data Science': [skill('Machine learning'), skill('Dimensionality reduction')],
        'SQL Databases': [skill('SQL')],
        'Data Pipelines & ETL Systems': [skill('Nextflow')],
        'Scientific Plotting Tools': [skill('D3'), skill('Scientific illustration')],
      },
      Biotechnology: {
        'Molecular & Microbial Biology Techniques': [skill('Cell culture'), skill('Molecular assays')],
        'Bioprocess & Bioreactor Engineering': [skill('Fermentation')],
      },
    },
    workshop_and_certifications: [{ issuer: 'Meridian Methods School', certifications: [
      { name: 'Visualizing Scientific Data', date: '2024-06', duration: '24 hours', certificate: true },
      { name: 'Reproducible Research Workflows', date: '2023-11', duration: '16 hours', certificate: true },
      { name: 'Molecular Data Analysis', date: '2022-04', duration: '32 hours', certificate: true },
    ] }],
    languages: [
      { language: 'English', proficiency: { level: 'Professional', CEFR: 'C2' } },
      { language: 'German', proficiency: { level: 'Independent', CEFR: 'B2' } },
    ],
    references: [{ name: 'Morgan Hale', position: 'Research Lead', institution: 'Meridian Research Studio' }],
    interests: [{ name: 'Scientific illustration', description: 'Finding readable visual forms for complex research stories.' }],
  };
}

module.exports = galleryPreviewPortfolio;
