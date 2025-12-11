import { consume } from '@lit/context';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import type { StateController } from '../controllers/state.js';
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
  public columns: ColumnConfiguration<T>[] = [];

  public get headers(): IgcGridLiteHeader<T>[] {
    return Array.from(
      this.renderRoot.querySelectorAll<IgcGridLiteHeader<T>>(IgcGridLiteHeader.tagName)
    );
  }

  constructor() {
    super();
    this.addEventListener('click', this._setActiveFilterColumn);
  }

  private _setActiveFilterColumn(event: PointerEvent): void {
    const header = getElementFromEventPath<IgcGridLiteHeader<T>>(IgcGridLiteHeader.tagName, event);
    this._state?.filtering.setActiveColumn(header?.column);
  }

  protected override shouldUpdate(props: PropertyValues<this>): boolean {
    for (const header of this.headers) {
      header.requestUpdate();
    }

    return super.shouldUpdate(props);
  }

  protected override render() {
    const filterRow = this._state?.filtering.filterRow;

    return html`${map(this.columns, (column) =>
      column.hidden
        ? nothing
        : html`
            <igc-grid-lite-header
              part=${partMap({ filtered: column.field === filterRow?.column?.field })}
              .column=${column}
            ></igc-grid-lite-header>
          `
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteHeaderRow.tagName]: IgcGridLiteHeaderRow<object>;
  }
}
