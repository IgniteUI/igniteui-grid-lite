import { css } from 'lit';

import type { Themes } from '../../internal/theming.js';
// Dark Overrides
import { styles as bootstrapDark } from './dark/grid.bootstrap.css.js';
import { styles as fluentDark } from './dark/grid.fluent.css.js';
import { styles as indigoDark } from './dark/grid.indigo.css.js';
import { styles as materialDark } from './dark/grid.material.css.js';
// Light Overrides
import { styles as bootstrapLight } from './light/grid.bootstrap.css.js';
import { styles as fluentLight } from './light/grid.fluent.css.js';
import { styles as indigoLight } from './light/grid.indigo.css.js';
import { styles as materialLight } from './light/grid.material.css.js';
import { styles as shared } from './light/grid.shared.css.js';
// Shared
import { styles as bootstrap } from './shared/grid.common.css.js';

const light = {
  shared: css`
      ${shared}
  `,
  bootstrap: css`
      ${bootstrap} ${bootstrapLight}
  `,
  material: css`
      ${materialLight}
  `,
  fluent: css`
      ${fluentLight}
  `,
  indigo: css`
      ${indigoLight}
  `,
};

const dark = {
  shared: css`
      ${shared}
  `,
  bootstrap: css`
      ${bootstrapDark}
  `,
  material: css`
      ${materialDark}
  `,
  fluent: css`
      ${fluentDark}
  `,
  indigo: css`
      ${indigoDark}
  `,
};

export const all: Themes = { light, dark };
