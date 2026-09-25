import { html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type IgcGridLiteHeader from '../components/header.js';
import { MIN_COL_RESIZE_WIDTH } from '../internal/constants.js';
import type { ColumnConfiguration, Keys } from '../internal/types.js';
import type { GridDOMController } from './dom.js';
import type { StateController } from './state.js';

export class ResizeController<T extends object> {
  constructor(
    protected _state: StateController<T>,
    protected _dom: GridDOMController<T>
  ) {}

  public indicatorActive = false;
  public indicatorOffset = 0;

  protected get host() {
    return this._state.host;
  }

  #maxSize(key: Keys<T>, headerWidth: number) {
    // A rendered row may lack the cell, e.g. for a just hidden column.
    const widths = this._dom.rows.map(
      (row) => row.cells.find((cell) => cell.column.field === key)?.offsetWidth ?? 0
    );

    return Math.max(MIN_COL_RESIZE_WIDTH, headerWidth, ...widths);
  }

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

  /** Hides the indicator. */
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
