import type { Themes } from '../../internal/types.js';
import { styles as bootstrap } from './shared/filtering-row/filtering-row.bootstrap.css.js';
import { styles as fluent } from './shared/filtering-row/filtering-row.fluent.css.js';
import { styles as indigo } from './shared/filtering-row/filtering-row.indigo.css.js';
import { styles as material } from './shared/filtering-row/filtering-row.material.css.js';

const light = { indigo, material, bootstrap, fluent };

export const all: Themes = { light, dark: light };
