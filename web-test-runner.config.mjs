import { fileURLToPath } from 'node:url';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';
import { BARREL_BUNDLE, prebundleTestDeps, TEST_DEPS_DIR } from './scripts/prebundle-test-deps.js';

const filteredLogs = ['in dev mode'];

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  /** Test files to run */
  files: ['test/**/*.test.ts'],

  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ['browser', 'production'],
  },

  coverageConfig: {
    exclude: ['node_modules/**/*', `${TEST_DEPS_DIR}/**/*`, '**/styles/**', 'test/**']
  },

  /** Browsers to run tests on */
  browsers: [playwrightLauncher({ product: 'chromium', headless: true })],

  testFramework: {
    config: {
      timeout: 4000,
    },
  },

  plugins: [
    {
      name: 'prebundled-test-deps',

      serverStart: () => prebundleTestDeps(),

      // Serve the tree-shaken bundle instead of the unbundled barrel.
      resolveImport: ({ source }) => (source === 'igniteui-webcomponents' ? BARREL_BUNDLE : undefined),
    },
    esbuildPlugin({
      ts: true,
      tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
    }),
  ],

  // See documentation for all available options
});
