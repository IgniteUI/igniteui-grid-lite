import { θaddAdoptedStylesController as addAdoptedStylesController } from 'igniteui-webcomponents';
import { html, LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { addA11y } from '../internal/a11y.js';
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

  private readonly _adoptedStylesController = addAdoptedStylesController(this);
  private readonly _a11y = addA11y(this, 'gridcell');

  @property({ attribute: false })
  public adoptRootStyles = false;

  /**
   * Position of the cell among the visible columns. Written as its 1-based
   * `aria-colindex`.
   *
   * @internal
   */
  @property({ attribute: false })
  public _colIndex = -1;

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
  @property({ attribute: false })
  public row!: IgcGridLiteRow<T>;

  @property({ attribute: false })
  public rowIndex = -1;

  @property({ attribute: false })
  public cellTemplate?: (context: IgcCellContext<T>) => unknown;

  protected get context(): IgcCellContext<T> {
    return {
      parent: this,
      row: this.row,
      column: this.column,
      value: this.value,
    } as unknown as IgcCellContext<T>;
  }

  private get _shouldAdoptStyles(): boolean {
    return this.adoptRootStyles && this.cellTemplate != null;
  }

  public override connectedCallback(): void {
    super.connectedCallback();

    // Roving focus target. Navigation moves DOM focus here so that assistive
    // technology announces the cell.
    this.tabIndex = -1;
    this._adoptedStylesController.shouldAdoptStyles(this._shouldAdoptStyles);
  }

  protected override update(props: PropertyValues<this>): void {
    if (props.has('adoptRootStyles') || props.has('cellTemplate')) {
      this._adoptedStylesController.shouldAdoptStyles(this._shouldAdoptStyles);
    }

    // The grid has no cell selection. `aria-selected` marks only the active cell.
    this._a11y.set({
      ariaColIndex: `${this._colIndex}`,
      ariaSelected: this.active ? 'true' : null,
    });

    super.update(props);
  }

  protected override render() {
    return html`${cache(
      this.cellTemplate
        ? this.cellTemplate(this.context as any)
        : html`<span part="text">${this.value}</span>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteCell.tagName]: IgcGridLiteCell<object>;
  }
}
