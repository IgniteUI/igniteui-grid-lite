import { glob, writeFile } from 'node:fs/promises';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import * as sass from 'sass-embedded';

export const TEMPLATE = [
  "import { css } from 'lit';",
  'export const styles = css`<% content %>`;',
].join('\n');

export const SCSS_EXT = new RegExp(/\.scss$/);
export const TEMPLATE_REG_EXP = new RegExp(/<%\s*content\s*%>/);

const stripComments = () => {
  return {
    postcssPlugin: 'postcss-strip-comments',
    OnceExit(root) {
      root.walkComments((node) => node.remove());
    },
  };
};

stripComments.postcss = true;

const POST_PROCESSOR = postcss([autoprefixer, stripComments]);

export async function compileSass(src, compiler) {
  const compiled = await compiler.compileAsync(src, {
    charset: false,
    style: 'compressed',
    loadPaths: ['node_modules', 'src'],
  });

  return (await POST_PROCESSOR.process(compiled.css, { from: undefined })).css;
}

export async function buildComponents() {
  const [compiler, paths] = await Promise.all([
    sass.initAsyncCompiler(),
    Array.fromAsync(glob('src/**/*.scss')),
  ]);

  try {
    await Promise.all(
      paths.map(async (path) => {
        writeFile(
          path.replace(SCSS_EXT, '.css.ts'),
          TEMPLATE.replace(TEMPLATE_REG_EXP, await compileSass(path, compiler)),
          'utf-8'
        );
      })
    );
  } catch (e) {
    await compiler.dispose();
    // biome-ignore lint/suspicious/noConsole: Build info
    console.error(e);
    process.exit(1);
  }

  await compiler.dispose();
}
