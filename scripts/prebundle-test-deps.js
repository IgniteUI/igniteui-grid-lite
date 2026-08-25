import { glob, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BARREL = 'igniteui-webcomponents';

export const TEST_DEPS_DIR = '.test-deps';
export const BARREL_BUNDLE = `/${TEST_DEPS_DIR}/${BARREL}.js`;

/** Named import statements pulling from the barrel, e.g. `import { A, type B } from 'igniteui-webcomponents'` */
const BARREL_IMPORT = new RegExp(`import\\s+(type\\s+)?{([^}]*)}\\s*from\\s*'${BARREL}'`, 'g');

/** lit is left external so the bundle cannot introduce a second copy of the runtime. */
const EXTERNAL = [
  'lit',
  'lit/*',
  'lit-html',
  'lit-html/*',
  'lit-element',
  'lit-element/*',
  '@lit/*',
  '@lit-labs/*',
];

/**
 * Collects the runtime (non-type) symbols `src/` imports from the barrel.
 * Aliases resolve to their source name: `θaddThemingController as x` => `θaddThemingController`.
 */
async function collectUsedExports() {
  const used = new Set();

  for await (const file of glob('src/**/*.ts', { cwd: ROOT })) {
    const source = await readFile(path.join(ROOT, file), 'utf8');

    for (const [, typeOnly, specifiers] of source.matchAll(BARREL_IMPORT)) {
      if (typeOnly) {
        continue;
      }

      for (const specifier of specifiers.split(',')) {
        const name = specifier
          .trim()
          .split(/\s+as\s+/)[0]
          .trim();

        if (name && !name.startsWith('type ')) {
          used.add(name);
        }
      }
    }
  }

  return Array.from(used).sort();
}

/**
 * The dev server serves unbundled ESM, so importing the barrel costs ~250 module
 * requests (every component in the library). Tree-shaking it down to the handful
 * of symbols `src/` actually uses cuts the test suite from ~41s to ~8s.
 */
export async function prebundleTestDeps() {
  const exports = await collectUsedExports();

  await esbuild.build({
    stdin: {
      contents: `export { ${exports.join(', ')} } from '${BARREL}';`,
      resolveDir: ROOT,
      sourcefile: 'test-deps-facade.js',
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    treeShaking: true,
    outfile: path.join(ROOT, TEST_DEPS_DIR, `${BARREL}.js`),
    conditions: ['browser', 'production'],
    external: EXTERNAL,
    logLevel: 'error',
  });
}
