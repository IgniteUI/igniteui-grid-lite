import { consume } from '@lit/context';
import { css, LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { COLUMN_UPDATE_CONTEXT } from '../internal/context.js';
import { registerComponent } from '../internal/register.js';
import { GRID_COLUMN_TAG } from '../internal/tags.js';
import type {
  BaseColumnConfiguration,
  ColumnSortConfiguration,
  IgcCellContext,
  IgcHeaderContext,
} from '../internal/types.js';

/**
 * @element igc-grid-lite-column
 */
export class IgcGridLiteColumn<T extends object>
  extends LitElement
  implements BaseColumnConfiguration<T>
{
  public static get tagName() {
    return GRID_COLUMN_TAG;
  }

  public static override styles = css`
    :host {
      display: none;
      contain: strict;
    }
  `;

  public static register(): void {
    registerComponent(IgcGridLiteColumn);
  }

  /** Callback context to notify the parent grid about configuration changes */
  @consume({ context: COLUMN_UPDATE_CONTEXT })
  protected _setConfig?: (config: BaseColumnConfiguration<T>) => void;

  /** The field from the data for this column. */
  @property()
  public field!: keyof T;

  /** The data type of the column's values. */
  @property()
  public dataType?: 'number' | 'string' | 'boolean' = 'string';

  /** The header text of the column. */
  @property()
  public header?: string;

  /** The width of the column. */
  @property()
  public width?: string;

  /** Indicates whether the column is hidden. */
  @property({ type: Boolean })
  public override hidden = false;

  /** Indicates whether the column is resizable. */
  @property({ type: Boolean })
  public resizable = false;

  /** Indicates whether the column is sortable. */
  @property({ type: Boolean })
  public sortable = false;

  /** Whether sort operations will be case sensitive. */
  @property({ type: Boolean, attribute: 'sorting-case-sensitive' })
  public sortingCaseSensitive = false;

  /** Sort configuration for the column (e.g., custom comparer). */
  @property({ attribute: false })
  public sortConfiguration?: ColumnSortConfiguration<T>;

  /** Indicates whether the column is filterable. */
  @property({ type: Boolean })
  public filterable = false;

  /** Whether filter operations will be case sensitive. */
  @property({ type: Boolean, attribute: 'filtering-case-sensitive' })
  public filteringCaseSensitive = false;

  /** Custom header template for the column. */
  @property({ attribute: false })
  public headerTemplate?: (params: IgcHeaderContext<T>) => unknown;

  /** Custom cell template for the column. */
  @property({ attribute: false })
  public cellTemplate?: (params: IgcCellContext<T>) => unknown;

  protected override update(props: PropertyValues<this>): void {
    if (this.hasUpdated && props.size > 0) {
      this._setConfig?.(this);
    }

    super.update(props);
  }

  protected override render(): unknown {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteColumn.tagName]: IgcGridLiteColumn<object>;
  }
}
