import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 把 monaco-editor 的 AMD 产物（min/vs）复制到 public/monaco/vs，
 * 让编辑器完全由本站静态资源提供，不依赖第三方 CDN。
 */
const projectRoot = path.resolve(import.meta.dirname, '..');
const targetDir = path.join(projectRoot, 'public', 'monaco');
const stampFile = path.join(targetDir, 'version.txt');

function resolveMonacoRoot() {
  let dir = path.dirname(fileURLToPath(import.meta.resolve('monaco-editor')));

  while (!existsSync(path.join(dir, 'min', 'vs', 'loader.js'))) {
    const parent = path.dirname(dir);

    if (parent === dir) {
      throw new Error('未找到 monaco-editor 的 min/vs 资源。');
    }

    dir = parent;
  }

  return dir;
}

const monacoRoot = resolveMonacoRoot();
const { version } = JSON.parse(
  await readFile(path.join(monacoRoot, 'package.json'), 'utf8'),
);
const installedVersion = existsSync(stampFile)
  ? (await readFile(stampFile, 'utf8')).trim()
  : '';

if (installedVersion === version) {
  console.log(`monaco-editor@${version} 资源已就绪。`);
} else {
  await rm(targetDir, { force: true, recursive: true });
  await mkdir(targetDir, { recursive: true });
  await cp(path.join(monacoRoot, 'min', 'vs'), path.join(targetDir, 'vs'), {
    recursive: true,
  });
  await writeFile(stampFile, version);
  console.log(`已复制 monaco-editor@${version} 到 public/monaco/vs。`);
}
