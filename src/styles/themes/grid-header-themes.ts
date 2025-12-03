import { css } from 'lit';

import type { Themes } from '../../internal/theming.js';

// Shared
import { styles as bootstrap } from './shared/header.bootstrap.css.js';
import { styles as fluent } from './shared/header.fluent.css.js';

const light = {
  bootstrap: css`
      ${bootstrap}
  `,
  fluent: css`
      ${fluent}
  `,
};

const dark = {
  bootstrap: css`
      ${bootstrap}
  `,
  fluent: css`
      ${fluent}
  `,
};

export const all: Themes = { light, dark };
