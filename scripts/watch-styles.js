import { watch } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as sass from 'sass-embedded';
import { compileSass, SCSS_EXT, TEMPLATE, TEMPLATE_REG_EXP } from './sass.js';

let updating = false;
const compiler = await sass.initAsyncCompiler();
const filter = (fileName) => /\.scss$/.test(fileName);
const now = () => `[${new Date().toLocaleTimeString()}]`;
// biome-ignore lint/suspicious/noConsole: Build info
const report = (message) => console.info(`${now()} ${message}`);
// biome-ignore lint/suspicious/noConsole: Build info
const error = (message) => console.error(`${now()} ${message}`);

watch('src/styles', { recursive: true }, async (_, fileName) => {
  if (!fileName || !filter(fileName) || updating) return;

  const filePath = join('src/styles', fileName);
  report(`${filePath} changed, updating...`);
  updating = true;

  try {
    await writeFile(
      filePath.replace(SCSS_EXT, '.css.ts'),
      TEMPLATE.replace(TEMPLATE_REG_EXP, await compileSass(filePath, compiler)),
      'utf-8'
    );
    report(`${filePath} updated successfully.`);
  } catch (e) {
    error(`Error updating ${filePath}: ${e}`);
  } finally {
    updating = false;
  }
}).on('close', () => compiler.dispose());

report(`${now()} Watching for changes in src/styles...`);
