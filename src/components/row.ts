import { html, LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { addA11y, headerRowsFor } from '../internal/a11y.js';
import { registerComponent } from '../internal/register.js';
import { GRID_ROW_TAG } from '../internal/tags.js';
import type { ActiveNode, ColumnConfiguration } from '../internal/types.js';
import { resolveFieldValue } from '../internal/utils.js';
import { styles } from '../styles/body-row/body-row.css.js';
import IgcGridLiteCell from './cell.js';

const ACTIVE_ROW_Z_INDEX = '3';

/**
 * Component representing the DOM row in the IgcGridLite.
 */
export default class IgcGridLiteRow<T extends object> extends LitElement {
  public static get tagName() {
    return GRID_ROW_TAG;
  }
  public static override styles = styles;

  public static register(): void {
    registerComponent(IgcGridLiteRow, IgcGridLiteCell);
  }

  private readonly _a11y = addA11y(this, 'row');

  @property({ attribute: false })
  public adoptRootStyles = false;

  @property({ attribute: false })
  public data?: T;

  @property({ attribute: false })
  public columns: Array<ColumnConfiguration<T>> = [];

  @property({ attribute: false })
  public activeNode?: ActiveNode<T>;

  @property({ type: Number, attribute: false })
  public index = -1;

  public get cells(): IgcGridLiteCell<T>[] {
    return Array.from(
      this.renderRoot.querySelectorAll<IgcGridLiteCell<T>>(IgcGridLiteCell.tagName)
    );
  }

  protected override update(props: PropertyValues<this>): void {
    // Data rows come after the header rows in the 1-based row index space.
    this._a11y.set({ ariaRowIndex: `${this.index + headerRowsFor(this.columns) + 1}` });

    super.update(props);
  }

  protected override updated(): void {
    // The active row paints above its neighbors so that the focus outline is not
    // clipped. Set after commit: the first render writes the full style attribute.
    this.style.zIndex = this.activeNode?.row === this.index ? ACTIVE_ROW_Z_INDEX : '';
  }

  protected override render() {
    const { column: key, row: index } = this.activeNode ?? {};
    const data = this.data ?? ({} as T);

    const columns = this.columns.filter((column) => !column.hidden);

    return html`
      ${repeat(
        columns,
        (column) => column.field,
        (column, colIndex) => html`
          <igc-grid-lite-cell
            part="cell"
            ._colIndex=${colIndex + 1}
            .adoptRootStyles=${this.adoptRootStyles}
            .active=${key === column.field && index === this.index}
            .column=${column}
            .cellTemplate=${column.cellTemplate}
            .row=${this as IgcGridLiteRow<T>}
            .rowIndex=${this.index}
            .value=${resolveFieldValue(data, column.field)}
          ></igc-grid-lite-cell>
        `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteRow.tagName]: IgcGridLiteRow<object>;
  }
}
