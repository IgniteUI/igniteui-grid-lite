import type { IgcVirtualScrollComponentEventMap } from 'igniteui-webcomponents';
import type { ActiveNode, ColumnConfiguration } from './types.js';

const columnKey = Symbol();
const NON_EXISTING_COLUMN = Symbol();

export const PIPELINE = 'pipeline';
export const SORT_ICON_ASCENDING = 'arrow-upward' as const;
export const SORT_ICON_DESCENDING = 'arrow-downward' as const;

export const MIN_COL_RESIZE_WIDTH = 80;

export const FOCUS_WITHIN = ':focus-within';

/** Focus without scrolling: the grid scrolls through the virtualizer. */
export const NO_SCROLL: FocusOptions = { preventScroll: true };

/** `igc-virtual-scroll` event: the rendered window or the scroll size changed. */
export const SCROLL_STATE_CHANGE =
  'igcStateChange' satisfies keyof IgcVirtualScrollComponentEventMap;

export const SENTINEL_NODE: Readonly<ActiveNode<any>> = Object.freeze({
  column: NON_EXISTING_COLUMN,
  row: -1,
});
export const DEFAULT_COLUMN_CONFIG = Object.freeze<ColumnConfiguration<any>>({
  field: columnKey,
  dataType: 'string',
  resizable: false,
  hidden: false,
  sortable: false,
  filterable: false,
});
