import { createContext } from '@lit/context';
import type { StateController } from '../controllers/state.js';
import type { BaseColumnConfiguration } from './types.js';

const COLUMN_CONTEXT = Symbol('Column context');
const STATE_CONTEXT = Symbol('Grid state context');

const COLUMN_UPDATE_CONTEXT =
  createContext<(config: BaseColumnConfiguration<object>) => void>(COLUMN_CONTEXT);
const GRID_STATE_CONTEXT = createContext<StateController<any>>(STATE_CONTEXT);

export { COLUMN_UPDATE_CONTEXT, GRID_STATE_CONTEXT };
