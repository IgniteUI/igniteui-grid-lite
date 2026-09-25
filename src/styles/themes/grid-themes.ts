import type { Themes } from '../../internal/types.js';
// Dark Overrides
import { styles as bootstrapDark } from './dark/grid.bootstrap.css.js';
import { styles as fluentDark } from './dark/grid.fluent.css.js';
import { styles as indigoDark } from './dark/grid.indigo.css.js';
import { styles as materialDark } from './dark/grid.material.css.js';
import { styles as sharedDark } from './dark/grid.shared.css.js';
// Light Overrides
import { styles as bootstrapLight } from './light/grid.bootstrap.css.js';
import { styles as fluentLight } from './light/grid.fluent.css.js';
import { styles as indigoLight } from './light/grid.indigo.css.js';
import { styles as materialLight } from './light/grid.material.css.js';
import { styles as shared } from './light/grid.shared.css.js';

const light = {
  shared,
  bootstrap: bootstrapLight,
  material: materialLight,
  fluent: fluentLight,
  indigo: indigoLight,
};

const dark = {
  shared: sharedDark,
  bootstrap: bootstrapDark,
  material: materialDark,
  fluent: fluentDark,
  indigo: indigoDark,
};

export const all: Themes = { light, dark };
