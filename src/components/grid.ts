import { ContextProvider } from '@lit/context';
import {
  IgcButtonComponent,
  IgcChipComponent,
  IgcDropdownComponent,
  IgcInputComponent,
} from 'igniteui-webcomponents';
import { html, nothing } from 'lit';
import { eventOptions, property, query, queryAll, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DataOperationsController } from '../controllers/data-operation.js';
import { GridDOMController } from '../controllers/dom.js';
import { gridStateContext, StateController } from '../controllers/state.js';
import { DEFAULT_COLUMN_CONFIG, PIPELINE } from '../internal/constants.js';
import { EventEmitterBase } from '../internal/mixins/event-emitter.js';
import { registerComponent } from '../internal/register.js';
import { GRID_TAG } from '../internal/tags.js';
import { addThemingController } from '../internal/theming.js';
import type {
  ColumnConfiguration,
  DataPipelineConfiguration,
  GridSortConfiguration,
  Keys,
} from '../internal/types.js';
import { asArray, autoGenerateColumns, getFilterOperandsFor } from '../internal/utils.js';
import { watch } from '../internal/watch.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { SortExpression } from '../operations/sort/types.js';
import { styles } from '../styles/grid/themes/grid.base.css.js';
import { all } from '../styles/grid/themes/themes.js';
import IgcGridLiteCell from './cell.js';
import IgcFilterRow from './filter-row.js';
import IgcGridLiteHeaderRow from './header-row.js';
import IgcGridLiteRow from './row.js';
import IgcVirtualizer from './virtualizer.js';

/**
 * Event object for the filtering event of the grid.
 */
export interface IgcFilteringEvent<T extends object> {
  /**
   * The target column for the filter operation.
   */
  key: Keys<T>;

  /**
   * The filter expression(s) to apply.
   */
  expressions: FilterExpression<T>[];

  /**
   * The type of modification which will be applied to the filter
   * state of the column.
   *
   * @remarks
   * `add` - a new filter expression will be added to the state of the column.
   * `modify` - an existing filter expression will be modified.
   * `remove` - the expression(s) will be removed from the state of the column.
   */
  type: 'add' | 'modify' | 'remove';
}

/**
 * Event object for the filtered event of the grid.
 */
export interface IgcFilteredEvent<T extends object> {
  /**
   * The target column for the filter operation.
   */
  key: Keys<T>;

  /**
   * The filter state of the column after the operation.
   */
  state: FilterExpression<T>[];
}

/**
 * Events for the igc-grid-lite.
 */
export interface IgcGridLiteEventMap<T extends object> {
  /**
   * Emitted when sorting is initiated through the UI.
   * Returns the sort expression which will be used for the operation.
   *
   * @remarks
   * The event is cancellable which prevents the operation from being applied.
   * The expression can be modified prior to the operation running.
   *
   * @event
   */
  sorting: CustomEvent<SortExpression<T>>;
  /**
   * Emitted when a sort operation initiated through the UI has completed.
   * Returns the sort expression used for the operation.
   *
   * @event
   */
  sorted: CustomEvent<SortExpression<T>>;
  /**
   * Emitted when filtering is initiated through the UI.
   *
   * @remarks
   * The event is cancellable which prevents the operation from being applied.
   * The expression can be modified prior to the operation running.
   *
   * @event
   */
  filtering: CustomEvent<IgcFilteringEvent<T>>;
  /**
   * Emitted when a filter operation initiated through the UI has completed.
   * Returns the filter state for the affected column.
   *
   * @event
   */
  filtered: CustomEvent<IgcFilteredEvent<T>>;
}

/**
 * IgcGridLite is a web component for displaying data in a tabular format quick and easy.
 *
 * Out of the box it provides row virtualization, sort and filter operations (client and server side),
 * the ability to template cells and headers and column hiding.
 *
 * @element igc-grid-lite
 *
 * @fires sorting - Emitted when sorting is initiated through the UI.
 * @fires sorted - Emitted when a sort operation initiated through the UI has completed.
 * @fires filtering - Emitted when filtering is initiated through the UI.
 * @fires filtered - Emitted when a filter operation initiated through the UI has completed.
 *
 */
export class IgcGridLite<T extends object> extends EventEmitterBase<IgcGridLiteEventMap<T>> {
  public static get tagName() {
    return GRID_TAG;
  }

  public static override styles = styles;

  public static register() {
    registerComponent(
      IgcGridLite,
      IgcVirtualizer,
      IgcGridLiteRow,
      IgcGridLiteHeaderRow,
      IgcFilterRow,
      IgcButtonComponent,
      IgcChipComponent,
      IgcInputComponent,
      IgcDropdownComponent
    );
  }

  protected stateController = new StateController<T>(this);
  protected DOM = new GridDOMController<T>(this, this.stateController);
  protected dataController = new DataOperationsController<T>(this);

  protected stateProvider = new ContextProvider(this, {
    context: gridStateContext,
    initialValue: this.stateController,
  });

  @query(IgcVirtualizer.tagName)
  protected scrollContainer!: IgcVirtualizer;

  @query(IgcGridLiteHeaderRow.tagName)
  protected headerRow!: IgcGridLiteHeaderRow<T>;

  @query(IgcFilterRow.tagName)
  protected filterRow!: IgcFilterRow<T>;

  @state()
  protected dataState: Array<T> = [];

  @queryAll(IgcGridLiteRow.tagName)
  protected _rows!: NodeListOf<IgcGridLiteRow<T>>;

  /** Column configuration for the grid. */
  @property({ attribute: false })
  public columns: Array<ColumnConfiguration<T>> = [];

  /** The data source for the grid. */
  @property({ attribute: false })
  public data: Array<T> = [];

  /**
   * Whether the grid will try to "resolve" its column configuration based on the passed
   * data source.
   *
   * @remarks
   * This is usually executed on initial rendering in the DOM. It depends on having an existing data source
   * to infer the column configuration for the grid.
   * Passing an empty data source or having a late bound data source (such as a HTTP request) will usually
   * result in empty column configuration for the grid.
   *
   * This property is ignored if any existing column configuration already exists in the grid.
   *
   * In a scenario where you want to bind a new data source and still keep the auto-generation behavior,
   * make sure to reset the column collection of the grid before passing in the new data source.
   *
   * @example
   * ```typescript
   * // assuming autoGenerate is set to true
   * grid.columns = [];
   * grid.data = [...];
   * ```
   *
   * @attr auto-generate
   */
  @property({ type: Boolean, attribute: 'auto-generate' })
  public autoGenerate = false;

  /** Sort configuration property for the grid. */
  @property({ attribute: false })
  public sortConfiguration: GridSortConfiguration = {
    multiple: true,
    triState: true,
  };

  /**
   * Configuration object which controls remote data operations for the grid.
   */
  @property({ attribute: false })
  public dataPipelineConfiguration!: DataPipelineConfiguration<T>;

  /**
   * Set the sort state for the grid.
   */
  public set sortExpressions(expressions: SortExpression<T>[]) {
    if (expressions.length) {
      this.sort(expressions);
    }
  }

  /**
   * Get the sort state for the grid.
   */
  @property({ attribute: false })
  public get sortExpressions(): SortExpression<T>[] {
    return Array.from(this.stateController.sorting.state.values());
  }

  /**
   * Set the filter state for the grid.
   */
  public set filterExpressions(expressions: FilterExpression<T>[]) {
    if (expressions.length) {
      this.filter(expressions);
    }
  }

  /**
   * Get the filter state for the grid.
   */
  @property({ attribute: false })
  public get filterExpressions(): FilterExpression<T>[] {
    const expressions: FilterExpression<T>[] = [];

    for (const each of this.stateController.filtering.state.values) {
      expressions.push(...each.all);
    }

    return expressions;
  }

  /**
   * Returns the collection of rendered row elements in the grid.
   *
   * @remarks
   * Since the grid has virtualization, this property returns only the currently rendered
   * chunk of elements in the DOM.
   */
  public get rows() {
    return Array.from(this._rows);
  }

  /**
   * Returns the state of the data source after sort/filter operations
   * have been applied.
   */
  public get dataView(): ReadonlyArray<T> {
    return this.dataState;
  }

  /**
   * The total number of items in the {@link IgcGridLite.dataView} collection.
   */
  public get totalItems() {
    return this.dataState.length;
  }

  @watch('columns')
  protected watchColumns(_: ColumnConfiguration<T>[], newConfig: ColumnConfiguration<T>[] = []) {
    this.columns = newConfig.map((config) => ({ ...DEFAULT_COLUMN_CONFIG, ...config }));
  }

  @watch('data')
  protected dataChanged() {
    this.dataState = structuredClone(this.data);
    autoGenerateColumns(this);

    if (this.hasUpdated) {
      this.pipeline();
    }
  }

  @watch(PIPELINE)
  protected async pipeline() {
    this.dataState = await this.dataController.apply(
      structuredClone(this.data),
      this.stateController
    );
  }

  constructor() {
    super();

    addThemingController(this, all);
  }

  /**
   * Performs a filter operation in the grid based on the passed expression(s).
   */
  public filter(config: FilterExpression<T> | FilterExpression<T>[]) {
    this.stateController.filtering.filter(
      asArray(config).map((each) =>
        typeof each.condition === 'string'
          ? // XXX: Types
            Object.assign(each, {
              condition: (getFilterOperandsFor(this.getColumn(each.key)!) as any)[each.condition],
            })
          : each
      )
    );
  }

  /**
   * Performs a sort operation in the grid based on the passed expression(s).
   */
  public sort(expressions: SortExpression<T> | SortExpression<T>[]) {
    this.stateController.sorting.sort(expressions);
  }

  /**
   * Resets the current sort state of the control.
   */
  public clearSort(key?: Keys<T>) {
    this.stateController.sorting.reset(key);
    this.requestUpdate(PIPELINE);
  }

  /**
   * Resets the current filter state of the control.
   */
  public clearFilter(key?: Keys<T>) {
    this.stateController.filtering.reset(key);
    this.requestUpdate(PIPELINE);
  }

  /**
   * Returns a {@link ColumnConfiguration} for a given column.
   */
  public getColumn(id: Keys<T> | number) {
    return typeof id === 'number'
      ? this.columns.at(id)
      : this.columns.find(({ key }) => key === id);
  }

  /**
   * Updates the column configuration of the grid.
   */
  public updateColumns(columns: ColumnConfiguration<T> | ColumnConfiguration<T>[]) {
    for (const column of asArray(columns)) {
      const instance = this.columns.find((curr) => curr.key === column.key);
      if (instance) {
        Object.assign(instance, column);
      }
    }

    this.requestUpdate(PIPELINE);
  }

  @eventOptions({ capture: true })
  protected bodyClickHandler(event: MouseEvent) {
    const target = event
      .composedPath()
      .find((el) => el instanceof IgcGridLiteCell) as IgcGridLiteCell<T>;
    if (target) {
      this.stateController.active = {
        column: target.column.key,
        row: target.row.index,
      };
    }
  }

  protected bodyKeydownHandler(event: KeyboardEvent) {
    if (this.scrollContainer.isSameNode(event.target as HTMLElement)) {
      this.stateController.navigation.navigate(event);
    }
  }

  protected renderHeaderRow() {
    return html`
      <igc-grid-lite-header-row
      style=${styleMap(this.DOM.columnSizes)}
      .columns=${this.columns}
      ></igc-grid-lite-header-row>
    `;
  }

  protected renderBody() {
    return html`
      <igc-virtualizer
        .items=${this.dataState}
        .renderItem=${this.DOM.rowRenderer}
        @click=${this.bodyClickHandler}
        @keydown=${this.bodyKeydownHandler}
      ></igc-virtualizer>
    `;
  }

  protected renderFilterRow() {
    return this.columns.some((column) => column.filter)
      ? html`<igc-filter-row style=${styleMap(this.DOM.columnSizes)}></igc-filter-row>`
      : nothing;
  }

  protected override render() {
    return html`
      ${this.stateController.resizing.renderIndicator()}
      ${this.renderHeaderRow()}
      ${this.renderFilterRow()}
      ${this.renderBody()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLite.tagName]: IgcGridLite<object>;
  }
}
