import type { ReactiveController } from 'lit';
import type { StyleInfo } from 'lit/directives/style-map.js';
import type IgcVirtualizer from '../components/virtualizer.js';
import { registerGridIcons } from '../internal/icon-registry.js';
import type { GridHost } from '../internal/types.js';
import { applyColumnWidths } from '../internal/utils.js';
import type { StateController } from './state.js';

const SCROLLBAR_OFFSET_VAR = '--scrollbar-offset';
const VISIBILITY_CHANGED = 'visibilityChanged';

class GridDOMController<T extends object> implements ReactiveController {
  protected readonly _host: GridHost<T>;
  protected readonly _state: StateController<T>;

  /** The virtualizer currently being tracked for scrollbar changes. */
  #observed?: IgcVirtualizer;
  #resizeObserver?: ResizeObserver;

  /** Last written offset in pixels. -1 marks "never measured". */
  #scrollOffset = -1;
  #pendingFrame?: number;

  #onScrollbarChange = (): void => {
    if (this.#pendingFrame !== undefined) {
      return;
    }

    this.#pendingFrame = requestAnimationFrame(() => {
      this.#pendingFrame = undefined;
      this.#applyScrollOffset();
    });
  };

  constructor(host: GridHost<T>, state: StateController<T>) {
    this._host = host;
    this._state = state;
    this._host.addController(this);
  }

  public columnSizes: StyleInfo = {};

  public hostConnected(): void {
    registerGridIcons();
    this.setGridColumnSizes();

    // The virtualizer is part of the host template - wait for it before observing.
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

  public hostUpdate(): void {
    this.setGridColumnSizes();
  }

  /**
   * Watches the virtualizer for anything which can toggle its scrollbar: a new
   * visible range, or a content box resize - the scrollbar itself shrinks the
   * content box. Keeping the measurement here avoids a forced layout on every
   * host update.
   */
  #observeVirtualizer(): void {
    const virtualizer = this._state.virtualizer;

    if (!virtualizer || virtualizer === this.#observed) {
      return;
    }

    this.#observed = virtualizer;
    virtualizer.addEventListener(VISIBILITY_CHANGED, this.#onScrollbarChange);

    this.#resizeObserver = new ResizeObserver(this.#onScrollbarChange);
    this.#resizeObserver.observe(virtualizer);
  }

  /** Writes the scrollbar offset CSS variable, but only when the measurement changed. */
  #applyScrollOffset(): void {
    const virtualizer = this.#observed;
    const offset = virtualizer ? virtualizer.offsetWidth - virtualizer.clientWidth : 0;

    if (offset === this.#scrollOffset) {
      return;
    }

    this.#scrollOffset = offset;
    this._host.style.setProperty(SCROLLBAR_OFFSET_VAR, `${offset}px`);
  }

  protected setGridColumnSizes(): void {
    this.columnSizes = applyColumnWidths(this._state.columns);
  }

  public getActiveRowStyles(index: number): StyleInfo {
    return this._state.active.row === index ? { 'z-index': '3' } : {};
  }
}

function createDomController<T extends object>(
  host: GridHost<T>,
  state: StateController<T>
): GridDOMController<T> {
  return new GridDOMController<T>(host, state);
}

export type { GridDOMController };
export { createDomController };
