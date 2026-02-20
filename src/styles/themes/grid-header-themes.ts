import { css } from 'lit';

import type { Themes } from '../../internal/types.js';
// Shared
import { styles as bootstrap } from './shared/header/header.bootstrap.css.js';
import { styles as fluent } from './shared/header/header.fluent.css.js';
import { styles as indigo } from './shared/header/header.indigo.css.js';

const light = {
  bootstrap: css`
    ${bootstrap},
  `,
  fluent: css`
    ${fluent}
  `,
  indigo: css`
    ${indigo}
  `,
};

const dark = {
  bootstrap: css`
    ${bootstrap}
  `,
  indigo: css`
      ${indigo}
  `,
};

export const all: Themes = { light, dark };
