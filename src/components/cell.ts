import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { registerComponent } from '../internal/register.js';
import { GRID_CELL_TAG } from '../internal/tags.js';
import type { ColumnConfiguration, IgcCellContext, PropertyType } from '../internal/types.js';
import { styles } from '../styles/body-cell/body-cell.css.js';
import type IgcGridLiteRow from './row.js';

/**
 * Component representing a DOM cell of the Igc grid.
 */
export default class IgcGridLiteCell<T extends object> extends LitElement {
  public static get tagName() {
    return GRID_CELL_TAG;
  }

  public static override styles = styles;

  public static register(): void {
    registerComponent(IgcGridLiteCell);
  }

  /**
   * The value which will be rendered by the component.
   */
  @property({ attribute: false })
  public value!: PropertyType<T>;

  /**
   * A reference to the column configuration object.
   */
  @property({ attribute: false })
  public column!: ColumnConfiguration<T>;

  /**
   * Indicates whether this is the active cell in the grid.
   *
   */
  @property({ type: Boolean, reflect: true })
  public active = false;

  /**
   * The parent row component holding this cell.
   */
  public row!: IgcGridLiteRow<T>;

  protected get context(): IgcCellContext<T> {
    return {
      parent: this,
      row: this.row,
      column: this.column,
      value: this.value,
    } as unknown as IgcCellContext<T>;
  }

  protected override render() {
    return html`${cache(
      this.column.cellTemplate
        ? this.column.cellTemplate(this.context as any)
        : html`<span part="text">${this.value}</span>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteCell.tagName]: IgcGridLiteCell<object>;
  }
}
