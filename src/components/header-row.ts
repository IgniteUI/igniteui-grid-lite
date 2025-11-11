import { consume } from '@lit/context';
import { html, LitElement, nothing, type PropertyValueMap } from 'lit';
import { property, queryAll } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { gridStateContext, type StateController } from '../controllers/state.js';
import { partNameMap } from '../internal/part-map.js';
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

  @queryAll(IgcGridLiteHeader.tagName)
  protected _headers!: NodeListOf<IgcGridLiteHeader<T>>;

  @consume({ context: gridStateContext, subscribe: true })
  @property({ attribute: false })
  public state!: StateController<T>;

  @property({ attribute: false })
  public columns: Array<ColumnConfiguration<T>> = [];

  public get headers() {
    return Array.from(this._headers);
  }

  constructor() {
    super();
    this.addEventListener('click', this.#activeFilterColumn);
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.setAttribute('tabindex', '0');
  }

  #activeFilterColumn(event: MouseEvent) {
    const header = event
      .composedPath()
      .filter((target) => target instanceof IgcGridLiteHeader)
      .at(0) as IgcGridLiteHeader<T>;

    this.state.filtering.setActiveColumn(header?.column);
  }

  protected override shouldUpdate(props: PropertyValueMap<this> | Map<PropertyKey, this>): boolean {
    for (const header of this.headers) {
      header.requestUpdate();
    }

    return super.shouldUpdate(props);
  }

  protected override render() {
    const filterRow = this.state.filtering.filterRow;

    return html`${map(this.columns, (column) =>
      column.hidden
        ? nothing
        : html`<igc-grid-lite-header
            part=${partNameMap({
              filtered: column === filterRow?.column,
            })}
            .column=${column}
          ></igc-grid-lite-header>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLiteHeaderRow.tagName]: IgcGridLiteHeaderRow<object>;
  }
}
