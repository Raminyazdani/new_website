import {
  siAnaconda, siBioconductor, siBootstrap, siCplusplus, siDjango, siDocker, siExpress, siFastapi, siFirebase, siFlask, siGit,
  siGithub, siGithubactions, siGnubash, siGooglescholar, siHuggingface, siJavascript, siJupyter, siKnime, siKubernetes, siLatex,
  siLinux, siMongodb, siMysql, siN8n, siNextdotjs, siNodedotjs, siOrcid, siPlotly, siPostgresql, siPython, siPytorch, siR, siReact,
  siRedis, siScikitlearn, siSelenium, siSqlite, siTailwindcss, siTensorflow, siThreedotjs, siTypescript, siVite, siGreensock,
} from 'simple-icons';
import { toolLogos } from '@/content/curation';

type Icon = { title: string; hex: string; path: string };

/** LinkedIn is no longer shipped by simple-icons; CC0 path from an older release. */
const siLinkedin: Icon = {
  title: 'LinkedIn',
  hex: '0A66C2',
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

const icons: Record<string, Icon> = {
  github: siGithub, linkedin: siLinkedin, orcid: siOrcid, scholar: siGooglescholar,
  python: siPython, r: siR, cplusplus: siCplusplus, javascript: siJavascript, typescript: siTypescript, pytorch: siPytorch,
  tensorflow: siTensorflow, docker: siDocker, kubernetes: siKubernetes, git: siGit, githubactions: siGithubactions, n8n: siN8n,
  react: siReact, vite: siVite, tailwindcss: siTailwindcss, bootstrap: siBootstrap, nodedotjs: siNodedotjs, express: siExpress,
  flask: siFlask, django: siDjango, fastapi: siFastapi, postgresql: siPostgresql, mysql: siMysql, sqlite: siSqlite,
  mongodb: siMongodb, redis: siRedis, jupyter: siJupyter, latex: siLatex, plotly: siPlotly, scikitlearn: siScikitlearn,
  selenium: siSelenium, gnubash: siGnubash, linux: siLinux, anaconda: siAnaconda, huggingface: siHuggingface, knime: siKnime,
  firebase: siFirebase, nextdotjs: siNextdotjs, threedotjs: siThreedotjs, bioconductor: siBioconductor, greensock: siGreensock,
};

export function iconFor(nameOrSlug: string): Icon | null {
  return icons[nameOrSlug] ?? icons[toolLogos[nameOrSlug] ?? ''] ?? null;
}

export function BrandIcon({
  name,
  className,
  colored = false,
  title,
}: {
  name: string;
  className?: string;
  colored?: boolean;
  title?: string;
}) {
  const icon = iconFor(name);
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={title ?? icon.title} className={className} fill={colored ? `#${icon.hex}` : 'currentColor'}>
      <title>{title ?? icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}
