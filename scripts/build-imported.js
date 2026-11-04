'use strict';

const { spawnSync } = require('node:child_process');
const { cp, lstat, mkdtemp, readFile, readdir, realpath, rename, rm } = require('node:fs/promises');
const { isAbsolute, join, relative, resolve, sep } = require('node:path');

const root = resolve(__dirname, '..');
const child = join(root, 'collections', 'new-web');
const output = join(child, 'out');
const destination = join(root, 'public', 'imported');

function isInside(parent, path) {
  const local = relative(parent, path);
  return local && !isAbsolute(local) && local !== '..' && !local.startsWith(`..${sep}`);
}

async function managedDirectory(path, parent) {
  let info;
  try {
    info = await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (!info.isDirectory() || info.isSymbolicLink() || !isInside(parent, await realpath(path))) {
    throw new Error('Refusing to replace a directory outside the imported build tree.');
  }
  return true;
}

function runNpm(args) {
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run this script with npm run build.');
  // The templates are compiled without access to portfolio or database credentials.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^(CV_|DATABASE_|POSTGRES_|PGPASSWORD$|NEXT_PUBLIC_)/i.test(key)));
  env.NEXT_TELEMETRY_DISABLED = '1';
  const result = spawnSync(process.execPath, [npm, '--prefix', child, ...args], { cwd: child, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Imported template ${args[0]} failed (exit ${result.status}).`);
}

async function inspectExport(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.') || /^cv\.json(?:\.|$)/i.test(entry.name)) {
      throw new Error(`Unexpected entry in imported static export: ${entry.name}`);
    }
    if (entry.isDirectory()) await inspectExport(join(directory, entry.name));
    else if (!entry.isFile()) throw new Error('Imported static export contains an unsupported file type.');
  }
}

async function validateExport() {
  const catalog = JSON.parse(await readFile(join(child, 'src', 'lib', 'designs.json'), 'utf8'));
  const ids = catalog.filter(design => design.ready).map(design => design.id);
  if (!ids.length || ids.some(id => !/^[a-z-]+$/.test(id))) throw new Error('Invalid imported template catalog.');

  await inspectExport(output);
  for (const locale of ['en', 'de', 'fa']) {
    for (const id of ids) {
      const page = await lstat(join(output, locale, id, 'index.html'));
      if (!page.isFile() || !page.size) throw new Error(`Missing exported page for ${locale}/${id}.`);
    }
  }
  return ids.length;
}

async function publishLocalOutput(repo) {
  const stage = await mkdtemp(join(repo, '.imported-stage-'));
  const next = join(stage, 'next');
  const previous = join(stage, 'previous');
  let retainBackup = false;
  try {
    await cp(output, next, { recursive: true });
    const hasPrevious = await managedDirectory(destination, repo);
    if (hasPrevious) await rename(destination, previous);
    try {
      await rename(next, destination);
    } catch (error) {
      if (hasPrevious) {
        retainBackup = true;
        await rename(previous, destination);
        retainBackup = false;
      }
      throw error;
    }
  } finally {
    if (!retainBackup && await managedDirectory(stage, repo)) await rm(stage, { recursive: true });
  }
}

async function main() {
  const repo = await realpath(root);
  if (!await managedDirectory(child, repo) || !await managedDirectory(join(root, 'public'), repo)) {
    throw new Error('Imported source or public output directory is missing.');
  }
  await managedDirectory(destination, repo);
  if (!process.argv.includes('--use-installed')) {
    runNpm(['ci', '--include=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--prefer-offline']);
  }
  if (await managedDirectory(output, repo)) await rm(output, { recursive: true });
  runNpm(['run', 'build']);
  if (!await managedDirectory(output, repo)) throw new Error('Imported static export was not generated.');
  const count = await validateExport();
  await publishLocalOutput(repo);
  console.log(`Staged ${count} imported templates in three languages under public/imported.`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
