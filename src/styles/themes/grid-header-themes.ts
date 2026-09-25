import type { Themes } from '../../internal/types.js';
import { styles as bootstrap } from './shared/header/header.bootstrap.css.js';
import { styles as fluent } from './shared/header/header.fluent.css.js';
import { styles as indigo } from './shared/header/header.indigo.css.js';

const light = { bootstrap, fluent, indigo };
const dark = { bootstrap, indigo };

export const all: Themes = { light, dark };
