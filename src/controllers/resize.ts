import { html, nothing, type ReactiveController } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type IgcGridLiteHeader from '../components/header.js';
import { MIN_COL_RESIZE_WIDTH } from '../internal/constants.js';
import type { ColumnConfiguration, Keys } from '../internal/types.js';
import type { GridDOMController } from './dom.js';
import type { StateController } from './state.js';

export class ResizeController<T extends object> implements ReactiveController {
  constructor(
    protected _state: StateController<T>,
    protected _dom: GridDOMController<T>
  ) {
    this.host.addController(this);
  }

  public indicatorActive = false;
  public indicatorOffset = 0;

  protected get host() {
    return this._state.host;
  }

  #maxSize(key: Keys<T>, headerWidth: number) {
    // A rendered row may not carry a cell for the column (e.g. it was just hidden).
    const max = this._dom.rows.reduce((prev, row) => {
      const cell = row.cells.find((cell) => cell.column.field === key);
      return cell && cell.offsetWidth > prev ? cell.offsetWidth : prev;
    }, 0);

    return Math.max(MIN_COL_RESIZE_WIDTH, max, headerWidth);
  }

  /** Column objects are immutable. Widths are set through the state. */
  #setWidth(column: ColumnConfiguration<T>, width: string) {
    this._state.setColumnWidth(column.field, width);
  }

  /** The grid renders the indicator. Each header renders its `resizing` part. */
  #indicatorChanged() {
    this.host.requestUpdate();
    this._state.updateObservers();
  }

  /** Starts a column resize: shows the indicator and aligns it with the header. */
  public start(header: IgcGridLiteHeader<T>) {
    this.indicatorActive = true;
    this.indicatorOffset = header.offsetLeft + header.offsetWidth;
    this.#indicatorChanged();
  }

  /**
   * Stops and resets the resizing state.
   */
  public stop() {
    this.indicatorActive = false;
    this.#indicatorChanged();
  }

  public resize(column: ColumnConfiguration<T>, width: number, sizerOffset?: number) {
    if (sizerOffset) {
      this.indicatorOffset = sizerOffset;
    }

    this.#setWidth(column, `${width}px`);
  }

  public async autosize(column: ColumnConfiguration<T>, header: IgcGridLiteHeader<T>) {
    // Measure the column at its natural size first, then pin the result in pixels.
    this.#setWidth(column, 'max-content');
    await this.host.updateComplete;

    this.#setWidth(column, `${this.#maxSize(column.field, header.offsetWidth)}px`);
  }

  public hostConnected() {}

  /**
   * Renders the resize indicator in the grid.
   */
  public renderIndicator() {
    return this.indicatorActive
      ? html`<div
          part="resize-indicator"
          style=${styleMap({
            transform: `translateX(${this.indicatorOffset}px)`,
          })}
        ></div>`
      : nothing;
  }
}
