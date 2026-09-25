import type IgcGridLiteCell from '../components/cell.js';
import type IgcGridLiteRow from '../components/row.js';
import { FOCUS_WITHIN, NO_SCROLL, SCROLL_STATE_CHANGE } from './constants.js';
import { getElementFromEventPath } from './element-from-event-path.js';
import { GRID_CELL_TAG, GRID_ROW_TAG } from './tags.js';

/**
 * Keeps focus in the body across row recycling. `igc-virtual-scroll` reuses the
 * element of a leaving row, so the focused cell may show another row or drop
 * focus. Listeners live until `signal` aborts.
 */
export function addBodyFocus(body: HTMLElement, signal: AbortSignal): void {
  const options = { signal };
  let ownsFocus = false;
  let focusedCell: IgcGridLiteCell<object> | undefined;

  const focusBody = (): void => body.focus(NO_SCROLL);

  const reclaim = (): void => {
    if (ownsFocus && !body.matches(FOCUS_WITHIN)) {
      focusBody();
    }
  };

  body.addEventListener(
    'focusin',
    (event) => {
      ownsFocus = true;
      focusedCell = getElementFromEventPath(GRID_CELL_TAG, event);
    },
    options
  );

  body.addEventListener(
    'focusout',
    (event: FocusEvent) => {
      const { relatedTarget } = event;

      if (relatedTarget instanceof Node) {
        ownsFocus = body.contains(relatedTarget);
        return;
      }

      // No new target: a click on empty space, or the focused row was removed or
      // recycled (still connected, new index). Tell them apart after a microtask.
      const [origin] = event.composedPath();
      const row = getElementFromEventPath<IgcGridLiteRow<object>>(GRID_ROW_TAG, event);
      const index = row?.index;

      queueMicrotask(() => {
        const recycled = row !== undefined && row.index !== index;

        ownsFocus = recycled || !(origin as Node).isConnected;
        reclaim();
      });
    },
    options
  );

  // A window change can recycle the focused cell onto another row.
  body.addEventListener(
    SCROLL_STATE_CHANGE,
    async () => {
      if (!ownsFocus) {
        return;
      }

      const cell = focusedCell;
      await cell?.row.updateComplete;

      if (cell?.matches(':focus') && !cell.active) {
        focusBody();
        return;
      }

      reclaim();
    },
    options
  );
}
