import { ContextProvider } from '@lit/context';
import type { RenderItemFunction } from '@lit-labs/virtualizer/virtualize.js';
import {
  IgcButtonComponent,
  IgcChipComponent,
  IgcDropdownComponent,
  IgcInputComponent,
} from 'igniteui-webcomponents';
import { html, nothing } from 'lit';
import { eventOptions, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { styleMap } from 'lit/directives/style-map.js';
import { createDataOperationsController } from '../controllers/data-operation.js';
import { createDomController } from '../controllers/dom.js';
import { createStateController } from '../controllers/state.js';
import { PIPELINE } from '../internal/constants.js';
import { COLUMN_UPDATE_CONTEXT, GRID_STATE_CONTEXT } from '../internal/context.js';
import { getElementFromEventPath } from '../internal/element-from-event-path.js';
import { EventEmitterBase } from '../internal/mixins/event-emitter.js';
import { registerComponent } from '../internal/register.js';
import { GRID_TAG } from '../internal/tags.js';
import { addThemingController } from '../internal/theming.js';
import type {
  ColumnConfiguration,
  DataPipelineConfiguration,
  GridLiteSortingOptions,
  Keys,
} from '../internal/types.js';
import { asArray, getFilterOperandsFor, isNumber, isString } from '../internal/utils.js';
import { watch } from '../internal/watch.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { SortingExpression } from '../operations/sort/types.js';
import { styles } from '../styles/themes/grid.base.css.js';
import { all } from '../styles/themes/grid-themes.js';
import { styles as shared } from '../styles/themes/shared/grid.common.css.js';
import IgcGridLiteCell from './cell.js';
import { IgcGridLiteColumn } from './column.js';
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
  sorting: CustomEvent<SortingExpression<T>>;
  /**
   * Emitted when a sort operation initiated through the UI has completed.
   * Returns the sort expression used for the operation.
   *
   * @event
   */
  sorted: CustomEvent<SortingExpression<T>>;
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

  public static override styles = [styles, shared];

  public static register(): void {
    registerComponent(
      IgcGridLite,
      IgcGridLiteColumn,
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

  protected readonly _stateController = createStateController(this, this._updateObservers);
  protected readonly _domController = createDomController(this, this._stateController);
  protected readonly _dataController = createDataOperationsController(this);

  protected readonly _stateProvider = new ContextProvider(this, {
    context: GRID_STATE_CONTEXT,
    initialValue: this._stateController,
  });

  protected readonly _columnUpdateProvider = new ContextProvider(this, {
    context: COLUMN_UPDATE_CONTEXT,
    initialValue: ((config: ColumnConfiguration<T>) => {
      this._updateConfiguration(config);
    }) as any,
  });

  private _initialSortExpressions: SortingExpression<T>[] = [];
  private _initialFilterExpressions: FilterExpression<T>[] = [];

  private _updateObservers(): void {
    this._stateProvider.updateObservers();
  }

  private _updateConfiguration(config: ColumnConfiguration<T>): void {
    this._stateController.updateColumnsConfiguration(asArray(config));
  }

  @state()
  protected _dataState: T[] = [];

  /** The data source for the grid. */
  @property({ attribute: false })
  public data: T[] = [];

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
  public sortingOptions: GridLiteSortingOptions = {
    mode: 'multiple',
  };

  /**
   * Configuration object which controls remote data operations for the grid.
   */
  @property({ attribute: false })
  public dataPipelineConfiguration!: DataPipelineConfiguration<T>;

  /**
   * Set the sort state for the grid.
   */
  public set sortingExpressions(expressions: SortingExpression<T>[]) {
    if (this.hasUpdated && expressions.length) {
      this.sort(expressions);
    } else {
      this._initialSortExpressions = expressions;
    }
  }

  /**
   * Get the sort state for the grid.
   */
  @property({ attribute: false })
  public get sortingExpressions(): SortingExpression<T>[] {
    return Array.from(this._stateController.sorting.state.values());
  }

  /**
   * Set the filter state for the grid.
   */
  public set filterExpressions(expressions: FilterExpression<T>[]) {
    if (this.hasUpdated && expressions.length) {
      this.filter(expressions);
    } else {
      this._initialFilterExpressions = expressions;
    }
  }

  /**
   * Get the filter state for the grid.
   */
  @property({ attribute: false })
  public get filterExpressions(): FilterExpression<T>[] {
    return this._stateController.filtering.state.values.flatMap((each) => each.all);
  }

  public get columns(): ColumnConfiguration<T>[] {
    return this._stateController.columns.map((col) => ({ ...col }));
  }

  /**
   * Returns the collection of rendered row elements in the grid.
   *
   * @remarks
   * Since the grid has virtualization, this property returns only the currently rendered
   * chunk of elements in the DOM.
   */
  public get rows() {
    return this._stateController.rows;
  }

  /**
   * Returns the state of the data source after sort/filter operations
   * have been applied.
   */
  public get dataView(): ReadonlyArray<T> {
    return this._dataState;
  }

  /**
   * The total number of items in the {@link IgcGridLite.dataView} collection.
   */
  public get totalItems(): number {
    return this._dataState.length;
  }

  @watch('data')
  protected dataChanged() {
    this._dataState = [...this.data];

    if (this.hasUpdated) {
      if (!this._hasAssignedColumns()) {
        this._stateController.setAutoColumnConfiguration();
      }
      this.pipeline();
    }
  }

  @watch(PIPELINE)
  protected async pipeline() {
    this._dataState = await this._dataController.apply([...this.data], this._stateController);
  }

  constructor() {
    super();

    addThemingController(this, all);
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    root.addEventListener('slotchange', this._handleSlotChange.bind(this));
    return root;
  }

  protected override firstUpdated(): void {
    this.updateComplete.then(() => {
      if (this.autoGenerate && !this._hasAssignedColumns()) {
        this._stateController.setAutoColumnConfiguration();
      }

      if (this._initialFilterExpressions.length) {
        this.filter(this._initialFilterExpressions);
      }

      if (this._initialSortExpressions.length) {
        this.sort(this._initialSortExpressions);
      }
    });
  }

  private _hasAssignedColumns(): boolean {
    const slot = this.renderRoot.querySelector('slot') as HTMLSlotElement;
    const assignedNodes = slot
      .assignedElements({ flatten: true })
      .filter((element) => element.matches(IgcGridLiteColumn.tagName));
    return assignedNodes.length > 0;
  }

  private _handleSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const assignedNodes = slot
      .assignedElements({ flatten: true })
      .filter((element) => element.matches(IgcGridLiteColumn.tagName));

    this._stateController.setColumnConfiguration(
      assignedNodes as unknown as ColumnConfiguration<T>[]
    );
  }

  /**
   * Performs a filter operation in the grid based on the passed expression(s).
   */
  public filter(config: FilterExpression<T> | FilterExpression<T>[]): void {
    this._stateController.filtering.filter(
      asArray(config).map((each) =>
        isString(each.condition)
          ? Object.assign(each, {
              condition: (getFilterOperandsFor(this.getColumn(each.key)!) as any)[each.condition],
            })
          : each
      )
    );
  }

  /**
   * Performs a sort operation in the grid based on the passed expression(s).
   */
  public sort(expressions: SortingExpression<T> | SortingExpression<T>[]) {
    this._stateController.sorting.sort(expressions);
  }

  /**
   * Resets the current sort state of the control.
   */
  public clearSort(key?: Keys<T>): void {
    this._stateController.sorting.reset(key);
    this.requestUpdate(PIPELINE);
  }

  /**
   * Resets the current filter state of the control.
   */
  public clearFilter(key?: Keys<T>): void {
    this._stateController.filtering.reset(key);
    this.requestUpdate(PIPELINE);
  }

  /**
   * Returns a {@link ColumnConfiguration} for a given column.
   */
  public getColumn(id: Keys<T> | number): ColumnConfiguration<T> | undefined {
    return this._stateController.columns.find((column, index) =>
      isNumber(id) ? index === id : column.field === id
    );
  }

  /**
   * Updates the column configuration of the grid.
   */
  public updateColumns(columns: ColumnConfiguration<T> | ColumnConfiguration<T>[]): void {
    this._stateController.updateColumnsConfiguration(asArray(columns));
  }

  @eventOptions({ capture: true })
  protected _bodyClickHandler(event: PointerEvent): void {
    const target = getElementFromEventPath<IgcGridLiteCell<T>>(IgcGridLiteCell.tagName, event);

    if (target) {
      this._stateController.active = { column: target.column.field, row: target.row.index };
    }
  }

  protected _bodyKeydownHandler(event: KeyboardEvent): void {
    if (event.target === this._stateController.virtualizer) {
      this._stateController.navigation.navigate(event);
    }
  }

  protected _renderRow: RenderItemFunction<T> = (item: T, index: number) => {
    const styles = {
      ...this._domController.columnSizes,
      ...this._domController.getActiveRowStyles(index),
    };
    const activeNode = this._stateController.active;

    return html`
      <igc-grid-lite-row
        part="row"
        exportparts="cell"
        style=${styleMap(styles)}
        .index=${index}
        .activeNode=${activeNode}
        .data=${item}
        .columns=${this._stateController.columns}
      ></igc-grid-lite-row>
    `;
  };

  protected _renderHeaderRow() {
    return html`
      <igc-grid-lite-header-row
        tabindex="0"
        style=${styleMap(this._domController.columnSizes)}
        .columns=${this._stateController.columns}
      ></igc-grid-lite-header-row>
    `;
  }

  protected _renderBody() {
    return html`
      <igc-virtualizer
        tabindex="0"
        .items=${this._dataState}
        .renderItem=${this._renderRow}
        @click=${this._bodyClickHandler}
        @keydown=${this._bodyKeydownHandler}
      ></igc-virtualizer>
    `;
  }

  protected _renderFilterRow() {
    return html`${cache(
      this._stateController.columns.some((column) => column.filterable)
        ? html`<igc-filter-row style=${styleMap(this._domController.columnSizes)}></igc-filter-row>`
        : nothing
    )}`;
  }

  protected override render() {
    return html`
      <slot part="column-sink"></slot>
      ${this._stateController.resizing.renderIndicator()} ${this._renderHeaderRow()}
      ${this._renderFilterRow()} ${this._renderBody()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcGridLite.tagName]: IgcGridLite<object>;
  }
}
