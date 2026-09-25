import { IgcVirtualScrollComponent } from 'igniteui-webcomponents';
import type { ReactiveController } from 'lit';
import type { StyleInfo } from 'lit/directives/style-map.js';
import type IgcFilterRow from '../components/filter-row.js';
import type IgcGridLiteRow from '../components/row.js';
import { addBodyFocus } from '../internal/body-focus.js';
import { SCROLL_STATE_CHANGE } from '../internal/constants.js';
import { registerGridIcons } from '../internal/icon-registry.js';
import { GRID_FILTER_ROW_TAG, GRID_ROW_TAG } from '../internal/tags.js';
import type { ColumnConfiguration, GridHost } from '../internal/types.js';
import { applyColumnWidths } from '../internal/utils.js';

const SCROLLBAR_OFFSET_VAR = '--scrollbar-offset';

/** Grid DOM access: render root queries, column track sizes, scrollbar offset, body focus. */
class GridDOMController<T extends object> implements ReactiveController {
  protected readonly _host: GridHost<T>;

  #observed?: IgcVirtualScrollComponent;
  #listeners?: AbortController;

  /** Last written offset in pixels. -1 means not measured yet. */
  #scrollOffset = -1;
  #pendingFrame?: number;

  /** The column configuration `columnSizes` was derived from. */
  #columns?: ColumnConfiguration<T>[];

  #onScrollbarChange = (): void => {
    if (this.#pendingFrame !== undefined) {
      return;
    }

    this.#pendingFrame = requestAnimationFrame(() => {
      this.#pendingFrame = undefined;
      this.#applyScrollOffset();
    });
  };

  constructor(host: GridHost<T>) {
    this._host = host;
    this._host.addController(this);
  }

  public columnSizes: StyleInfo = {};

  public get filterRow(): IgcFilterRow<T> | null {
    return this._host.renderRoot.querySelector<IgcFilterRow<T>>(GRID_FILTER_ROW_TAG);
  }

  public get rows(): IgcGridLiteRow<T>[] {
    return Array.from(this._host.renderRoot.querySelectorAll<IgcGridLiteRow<T>>(GRID_ROW_TAG));
  }

  public get virtualizer(): IgcVirtualScrollComponent | null {
    return this._host.renderRoot.querySelector(IgcVirtualScrollComponent.tagName);
  }

  public hostConnected(): void {
    registerGridIcons();

    // The virtualizer is part of the host template. Observe it after the first render.
    this._host.updateComplete.then(() => {
      this.#observeVirtualizer();
    });
  }

  public hostDisconnected(): void {
    if (this.#pendingFrame !== undefined) {
      cancelAnimationFrame(this.#pendingFrame);
      this.#pendingFrame = undefined;
    }

    this.#listeners?.abort();
    this.#observed = undefined;
  }

  /**
   * Tracks scrollbar toggles (range change, content box resize) without a forced
   * layout per host update. Also keeps body focus across row recycling.
   */
  #observeVirtualizer(): void {
    const virtualizer = this.virtualizer;

    if (!virtualizer || virtualizer === this.#observed) {
      return;
    }

    this.#observed = virtualizer;
    this.#listeners = new AbortController();

    const { signal } = this.#listeners;
    addBodyFocus(virtualizer, signal);
    virtualizer.addEventListener(SCROLL_STATE_CHANGE, this.#onScrollbarChange, { signal });

    const resizeObserver = new ResizeObserver(this.#onScrollbarChange);
    resizeObserver.observe(virtualizer);
    signal.addEventListener('abort', () => resizeObserver.disconnect());
  }

  /** Writes the scrollbar offset CSS variable only when the measurement changed. */
  #applyScrollOffset(): void {
    const virtualizer = this.#observed;
    const offset = virtualizer ? virtualizer.offsetWidth - virtualizer.clientWidth : 0;

    if (offset === this.#scrollOffset) {
      return;
    }

    this.#scrollOffset = offset;
    this._host.style.setProperty(SCROLLBAR_OFFSET_VAR, `${offset}px`);
  }

  /** Scrolls the data area back to the top. */
  public resetScrollPosition(): void {
    this.virtualizer?.scrollTo({ top: 0 });
  }

  /** Re-derives the column track sizes. Column configs are immutable: same array, same sizes. */
  public setColumns(columns: ColumnConfiguration<T>[]): void {
    if (columns === this.#columns) {
      return;
    }

    this.#columns = columns;
    this.columnSizes = applyColumnWidths(columns);
  }
}

function createDomController<T extends object>(host: GridHost<T>): GridDOMController<T> {
  return new GridDOMController<T>(host);
}

export type { GridDOMController };
export { createDomController };
