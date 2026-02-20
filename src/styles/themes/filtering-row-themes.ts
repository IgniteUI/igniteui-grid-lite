import { css } from 'lit';
import type { Themes } from '../../internal/types.js';
import { styles as bootstrap } from './shared/filtering-row/filtering-row.bootstrap.css.js';
import { styles as fluent } from './shared/filtering-row/filtering-row.fluent.css.js';
// Shared
import { styles as indigo } from './shared/filtering-row/filtering-row.indigo.css.js';
import { styles as material } from './shared/filtering-row/filtering-row.material.css.js';

const light = {
  indigo: css`
      ${indigo}
  `,
  material: css`
      ${material}
  `,
  bootstrap: css`
      ${bootstrap}
  `,
  fluent: css`
      ${fluent}
  `,
};

const dark = {
  indigo: css`
    ${indigo}
  `,
  material: css`
    ${material}
  `,
  bootstrap: css`
    ${bootstrap}
  `,
  fluent: css`
      ${fluent}
  `,
};

export const all: Themes = { light, dark };
