import type { ReactiveController } from 'lit';
import type { StyleInfo } from 'lit/directives/style-map.js';
import type IgcFilterRow from '../components/filter-row.js';
import type IgcGridLiteHeaderRow from '../components/header-row.js';
import type IgcGridLiteRow from '../components/row.js';
import type IgcVirtualizer from '../components/virtualizer.js';
import { registerGridIcons } from '../internal/icon-registry.js';
import {
  GRID_FILTER_ROW_TAG,
  GRID_HEADER_ROW_TAG,
  GRID_ROW_TAG,
  GRID_VIRTUALIZER_TAG,
} from '../internal/tags.js';
import type { ColumnConfiguration, GridHost } from '../internal/types.js';
import { applyColumnWidths } from '../internal/utils.js';

const SCROLLBAR_OFFSET_VAR = '--scrollbar-offset';
const VISIBILITY_CHANGED = 'visibilityChanged';

/**
 * Owns the DOM concerns of the grid: element queries into the render root, the
 * derived column track sizes, and the scrollbar offset measurement.
 */
class GridDOMController<T extends object> implements ReactiveController {
  protected readonly _host: GridHost<T>;

  /** The virtualizer currently being tracked for scrollbar changes. */
  #observed?: IgcVirtualizer;
  #resizeObserver?: ResizeObserver;

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

  /** Returns the header row element of the grid. */
  public get headerRow(): IgcGridLiteHeaderRow<T> | null {
    return this._host.renderRoot.querySelector<IgcGridLiteHeaderRow<T>>(GRID_HEADER_ROW_TAG);
  }

  /** Returns the filter row element of the grid. */
  public get filterRow(): IgcFilterRow<T> | null {
    return this._host.renderRoot.querySelector<IgcFilterRow<T>>(GRID_FILTER_ROW_TAG);
  }

  /** Returns the data row elements of the grid. */
  public get rows(): IgcGridLiteRow<T>[] {
    return Array.from(this._host.renderRoot.querySelectorAll<IgcGridLiteRow<T>>(GRID_ROW_TAG));
  }

  /** Returns the virtualizer element of the grid. */
  public get virtualizer(): IgcVirtualizer | null {
    return this._host.renderRoot.querySelector(GRID_VIRTUALIZER_TAG);
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

    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;

    this.#observed?.removeEventListener(VISIBILITY_CHANGED, this.#onScrollbarChange);
    this.#observed = undefined;
  }

  /**
   * Watches the virtualizer for changes that can toggle its scrollbar: a new
   * visible range, or a content box resize (the scrollbar itself shrinks the
   * content box). Measurement here prevents a forced layout on each host update.
   */
  #observeVirtualizer(): void {
    const virtualizer = this.virtualizer;

    if (!virtualizer || virtualizer === this.#observed) {
      return;
    }

    this.#observed = virtualizer;
    virtualizer.addEventListener(VISIBILITY_CHANGED, this.#onScrollbarChange);

    this.#resizeObserver = new ResizeObserver(this.#onScrollbarChange);
    this.#resizeObserver.observe(virtualizer);
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

  /**
   * Re-derives the column track sizes. Column configurations are immutable: an
   * unchanged array identity means the current sizes are still correct.
   */
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
