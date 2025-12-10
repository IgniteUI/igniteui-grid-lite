import type { ReactiveController } from 'lit';
import type { StyleInfo } from 'lit/directives/style-map.js';
import { registerGridIcons } from '../internal/icon-registry.js';
import type { GridHost } from '../internal/types.js';
import { applyColumnWidths } from '../internal/utils.js';
import type { StateController } from './state.js';

class GridDOMController<T extends object> implements ReactiveController {
  protected readonly _host: GridHost<T>;
  protected readonly _state: StateController<T>;

  constructor(host: GridHost<T>, state: StateController<T>) {
    this._host = host;
    this._state = state;
    this._host.addController(this);
  }

  public columnSizes: StyleInfo = {};

  public hostConnected(): void {
    registerGridIcons();
    this.setGridColumnSizes();

    this._host.updateComplete.then(() => {
      this._state.virtualizer?.addEventListener(
        'visibilityChanged',
        () => {
          this.setScrollOffset();
        },
        { once: true }
      );
    });
  }

  public hostUpdate(): void {
    this.setScrollOffset();
    this.setGridColumnSizes();
  }

  public setScrollOffset(): void {
    const size = this._state.virtualizer
      ? this._state.virtualizer.offsetWidth - this._state.virtualizer.clientWidth
      : 0;
    this._host.style.setProperty('--scrollbar-offset', `${size}px`);
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

export { createDomController };
export type { GridDOMController };
