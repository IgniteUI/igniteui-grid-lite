import { html, nothing, type ReactiveController } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type IgcGridLiteHeader from '../components/header.js';
import { MIN_COL_RESIZE_WIDTH } from '../internal/constants.js';
import type { ColumnConfiguration, GridHost, Keys } from '../internal/types.js';

export class ResizeController<T extends object> implements ReactiveController {
  constructor(protected host: GridHost<T>) {
    this.host.addController(this);
  }

  public indicatorActive = false;
  public indicatorOffset = 0;

  #maxSize(key: Keys<T>, headerWidth: number) {
    const max = this.host.rows
      .map((row) => row.cells.find((cell) => cell.column.field === key)!)
      .reduce((prev, current) => (current.offsetWidth > prev ? current.offsetWidth : prev), 0);

    return Math.max(...[MIN_COL_RESIZE_WIDTH, max, headerWidth]);
  }

  /**
   * Begins resizing a column by showing and positioning the resize indicator in relation to the column.
   *
   * @param header the
   */
  public start(header: IgcGridLiteHeader<T>) {
    this.indicatorActive = true;
    this.indicatorOffset = header.offsetLeft + header.offsetWidth;
    this.host.requestUpdate();
  }

  /**
   * Stops and resets the resizing state.
   */
  public stop() {
    this.indicatorActive = false;
    this.host.requestUpdate();
  }

  public resize(column: ColumnConfiguration<T>, width: number, sizerOffset?: number) {
    if (sizerOffset) {
      this.indicatorOffset = sizerOffset;
    }

    column.width = `${width}px`;
    this.host.requestUpdate();
  }

  public async autosize(column: ColumnConfiguration<T>, header: IgcGridLiteHeader<T>) {
    column.width = 'max-content';

    this.host.requestUpdate();
    await this.host.updateComplete;

    column.width = `${this.#maxSize(column.field, header.offsetWidth)}px`;
    this.host.requestUpdate();
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
