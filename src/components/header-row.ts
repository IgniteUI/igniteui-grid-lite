import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { StateController } from '../controllers/state.js';
import { addA11y, HEADER_ROW_INDEX } from '../internal/a11y.js';
import { GRID_STATE_CONTEXT } from '../internal/context.js';
import { getElementFromEventPath } from '../internal/element-from-event-path.js';
import { partMap } from '../internal/part-map.js';
import { registerComponent } from '../internal/register.js';
import { GRID_HEADER_ROW_TAG } from '../internal/tags.js';
import type { ColumnConfiguration } from '../internal/types.js';
import { styles } from '../styles/header-row/header-row.base.css.js';
import IgcGridLiteHeader from './header.js';

export default class IgcGridLiteHeaderRow<T extends object> extends LitElement {
  public static get tagName() {
    return GRID_HEADER_ROW_TAG;
  }
  public static override styles = styles;

  public static register(): void {
    registerComponent(IgcGridLiteHeaderRow, IgcGridLiteHeader);
  }

  @consume({ context: GRID_STATE_CONTEXT, subscribe: true })
  private readonly _state?: StateController<T>;

  @property({ attribute: false })
  public adoptRootStyles = false;

  @property({ attribute: false })
  public columns: ColumnConfiguration<T>[] = [];

  public get headers(): IgcGridLiteHeader<T>[] {
    return Array.from(
      this.renderRoot.querySelectorAll<IgcGridLiteHeader<T>>(IgcGridLiteHeader.tagName)
    );
  }

  constructor() {
    super();

    addA11y(this, 'row').set({ ariaRowIndex: `${HEADER_ROW_INDEX}` });
    this.addEventListener('click', this._setActiveFilterColumn);
  }

  private _setActiveFilterColumn(event: PointerEvent): void {
    const header = getElementFromEventPath<IgcGridLiteHeader<T>>(IgcGridLiteHeader.tagName, event);
    this._state?.filtering.setActiveColumn(header?.column);
  }

  protected override render() {
    const filterRow = this._state?.filtering.filterRow;
    const columns = this.columns.filter((column) => !column.hidden);

    return html`
      ${repeat(
        columns,
        (column) => column.field,
        (column, index) => html`
          <igc-grid-lite-header
            part=${partMap({ filtered: column.field === filterRow?.column?.field })}
            .adoptRootStyles=${this.adoptRootStyles}
            .column=${column}
            ._colIndex=${index + 1}
          ></igc-grid-lite-header>
        `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteHeaderRow.tagName]: IgcGridLiteHeaderRow<object>;
  }
}
