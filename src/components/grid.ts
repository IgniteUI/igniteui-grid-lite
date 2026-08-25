import { ContextProvider } from '@lit/context';
import type { RenderItemFunction } from '@lit-labs/virtualizer/virtualize.js';
import { θaddThemingController as addThemingController } from 'igniteui-webcomponents';
import { html, nothing, type PropertyValues } from 'lit';
import { eventOptions, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { styleMap } from 'lit/directives/style-map.js';
import { createDataOperationsController } from '../controllers/data-operation.js';
import { createDomController } from '../controllers/dom.js';
import { createStateController } from '../controllers/state.js';
import { addA11y, headerRowsFor } from '../internal/a11y.js';
import { FOCUS_WITHIN, PIPELINE } from '../internal/constants.js';
import { COLUMN_UPDATE_CONTEXT, GRID_STATE_CONTEXT } from '../internal/context.js';
import { getElementFromEventPath } from '../internal/element-from-event-path.js';
import { EventEmitterBase } from '../internal/mixins/event-emitter.js';
import { registerComponent } from '../internal/register.js';
import { GRID_TAG } from '../internal/tags.js';
import type {
  ColumnConfiguration,
  DataPipelineConfiguration,
  GridLiteSortingOptions,
  Keys,
  NavigateToOptions,
} from '../internal/types.js';
import { asArray, getFilterOperandsFor, isNumber, isString } from '../internal/utils.js';
import { watch } from '../internal/watch.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { SortingExpression } from '../operations/sort/types.js';
import { styles as base } from '../styles/themes/grid.base.css.js';
import { all } from '../styles/themes/grid-themes.js';
import { styles as shared } from '../styles/themes/shared/grid.common.css.js';
import IgcGridLiteCell from './cell.js';
import { IgcGridLiteColumn } from './column.js';
import IgcFilterRow from './filter-row.js';
import IgcGridLiteHeaderRow from './header-row.js';
import IgcGridLiteRow from './row.js';
import IgcVirtualizer from './virtualizer.js';

/** Column reducer matching either a direct column element or every one nested in a container */
function columnReducer<T extends Element>(acc: T[], el: T): T[] {
  const tag = IgcGridLiteColumn.tagName;

  if (el.matches(tag)) {
    acc.push(el);
    return acc;
  }

  acc.push(...(Array.from(el.querySelectorAll(tag)) as unknown as T[]));
  return acc;
}

/**
 * Event object for the filtering event of the grid.
 */
export interface IgcFilteringEvent<T extends object = any> {
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
export interface IgcFilteredEvent<T extends object = any> {
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
export interface IgcGridLiteEventMap<T extends object = any> {
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
  sorting: CustomEvent<SortingExpression<T, any>>;
  /**
   * Emitted when a sort operation initiated through the UI has completed.
   * Returns the sort expression used for the operation.
   *
   * @event
   */
  sorted: CustomEvent<SortingExpression<T, any>>;
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
export class IgcGridLite<T extends object = any> extends EventEmitterBase<IgcGridLiteEventMap<T>> {
  public static get tagName() {
    return GRID_TAG;
  }

  public static override styles = [base, shared];

  public static register(): void {
    registerComponent(
      IgcGridLite,
      IgcGridLiteColumn,
      IgcVirtualizer,
      IgcGridLiteRow,
      IgcGridLiteHeaderRow
    );
  }

  private readonly _a11y = addA11y(this, 'grid');

  protected readonly _domController = createDomController<T>(this);
  protected readonly _stateController = createStateController(
    this,
    this._domController,
    this._updateObservers
  );
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

  private _updateObservers(): void {
    this._stateProvider.updateObservers();
  }

  private _updateConfiguration(config: ColumnConfiguration<T>): void {
    this._stateController.updateColumnsConfiguration(asArray(config));
  }

  @state()
  protected _dataState: T[] = [];

  /** Monotonic token identifying the most recently started pipeline run. */
  private _pipelineEpoch = 0;

  private _pipelineTask: Promise<void> = Promise.resolve();

  /**
   * Resolves when the latest pipeline run completes and its result is rendered.
   * The sort and filter controllers await this so that `sorted` and `filtered`
   * report an up-to-date {@link IgcGridLite.dataView}.
   *
   * @internal
   */
  public get _pipelineComplete(): Promise<void> {
    // The `updateComplete` hop lets a pending PIPELINE update install its task first.
    return this.updateComplete.then(() => this._pipelineTask);
  }

  @property({ type: Boolean, reflect: true, attribute: 'adopt-root-styles' })
  public adoptRootStyles = false;

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
    this._stateController.sorting.reset();
    if (this.hasUpdated) {
      this.sort(expressions);
    } else {
      for (const expr of expressions) {
        this._stateController.sorting.state.set(expr.key, { ...expr });
      }
    }
  }

  /**
   * Get the sort state for the grid.
   */
  @property({ attribute: false })
  public get sortingExpressions(): SortingExpression<T>[] {
    return Array.from(this._stateController.sorting.state.values(), (expr) => ({ ...expr }));
  }

  /**
   * Set the filter state for the grid.
   */
  public set filterExpressions(expressions: FilterExpression<T>[]) {
    this._stateController.filtering.reset();
    if (this.hasUpdated) {
      this.filter(expressions);
    } else {
      this._stateController.filtering.setRaw(expressions);
    }
  }

  /**
   * Get the filter state for the grid.
   */
  @property({ attribute: false })
  public get filterExpressions(): FilterExpression<T>[] {
    return this._stateController.filtering.state.values.flatMap((each) =>
      each.all.map((expr) => ({ ...expr }))
    );
  }

  /**
   * Sets the column configuration for the grid.
   *
   * @remarks
   * Passing an empty collection resets the columns, which - with `autoGenerate` -
   * lets the next data source binding re-generate them.
   */
  public set columns(configuration: ColumnConfiguration<T>[]) {
    this._stateController.setColumnConfiguration(asArray(configuration));
  }

  /**
   * Returns the column configuration of the grid.
   */
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
    return this._domController.rows;
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

  @watch('sortingOptions', { waitUntilFirstUpdate: true })
  protected sortingOptionsChanged() {
    // Headers render the multi-sort position out of this option.
    this._updateObservers();
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

  /**
   * NOTE: The `PIPELINE` sentinel equals this method's name. That equality makes
   * the `@watch` comparison (`undefined !== <method>`) fire on each requested
   * update. A rename of this method silently disables the pipeline.
   */
  @watch(PIPELINE)
  protected pipeline(): void {
    this._pipelineTask = this._runPipeline();
  }

  /** Runs the data operations. Discards a result that a newer run supersedes. */
  private async _runPipeline(): Promise<void> {
    const epoch = ++this._pipelineEpoch;

    try {
      const state = await this._dataController.apply([...this.data], this._stateController);

      if (epoch !== this._pipelineEpoch) {
        return;
      }

      this._dataState = state;
    } catch (e) {
      // A failed hook must not blank the grid. Keep the previous data state and
      // report the error.
      // biome-ignore lint/suspicious/noConsole: the pipeline hooks are user code; swallowing their errors hides bugs
      console.error(e);
    }

    await this.updateComplete;
  }

  constructor() {
    super();

    addThemingController(this, all);
  }

  /** The column set the current row renderer was built from. */
  private _rowColumns?: ColumnConfiguration<T>[];

  protected override willUpdate(props: PropertyValues<this>): void {
    const { columns } = this._stateController;

    this._domController.setColumns(columns);

    // The ARIA grid pattern counts the header rows in the row count. Only visible
    // columns take part in the column index space.
    this._a11y.set({
      ariaRowCount: `${headerRowsFor(columns) + this._dataState.length}`,
      ariaColCount: `${columns.filter((column) => !column.hidden).length}`,
    });

    // The virtualizer re-renders its rows only when `renderItem` changes identity.
    // Build a new renderer only when a row input changes.
    if (columns !== this._rowColumns || props.has('adoptRootStyles')) {
      this._rowColumns = columns;
      this._renderRow = this._createRowRenderer(columns);
    }
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
    });
  }

  private _hasAssignedColumns(): boolean {
    const slot = this.renderRoot.querySelector('slot') as HTMLSlotElement;
    const assignedNodes = slot
      .assignedElements({ flatten: true })
      .reduce<Element[]>(columnReducer, []);
    return assignedNodes.length > 0;
  }

  private _handleSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const assignedNodes = slot
      .assignedElements({ flatten: true })
      .reduce<Element[]>(columnReducer, []);

    this._stateController.setColumnConfiguration(
      assignedNodes as unknown as ColumnConfiguration<T>[]
    );
  }

  /**
   * Performs a filter operation in the grid based on the passed expression(s).
   */
  public filter(config: FilterExpression<T> | FilterExpression<T>[]): void {
    // Store copies. The caller's expression objects must not change.
    const expressions = asArray(config)
      .filter((expr) => this.getColumn(expr.key) !== undefined)
      .map((expr) => ({ ...expr }));

    for (const expr of expressions) {
      if (!isString(expr.condition)) {
        continue;
      }
      expr.condition = (getFilterOperandsFor(this.getColumn(expr.key)!) as any)[expr.condition];
    }

    this._stateController.filtering.filter(expressions);
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
   * Navigates to a position in the grid based on provided row index and column field.
   * @param row The row index to navigate to
   * @param options The column field to navigate to and whether to activate the cell
   */
  public async navigateTo(row: number, options?: NavigateToOptions<T>) {
    await this._stateController.navigation.navigateTo(row, options);
  }

  /**
   * Returns a {@link ColumnConfiguration} for a given column.
   */
  public getColumn(id: Keys<T> | number): ColumnConfiguration<T> | undefined {
    return this._stateController.columns.find((column, index) =>
      isNumber(id) ? index === id : column.field === id
    );
  }

  @eventOptions({ capture: true })
  protected _bodyClickHandler(event: PointerEvent): void {
    const target = getElementFromEventPath<IgcGridLiteCell<T>>(IgcGridLiteCell.tagName, event);

    if (target) {
      this._stateController.active = { column: target.column.field, row: target.row.index };

      // Move focus so that assistive technology announces the cell. Keep focus
      // where it is when the click landed on focusable templated content.
      if (!target.matches(FOCUS_WITHIN)) {
        target.focus({ preventScroll: true });
      }
    }
  }

  protected _bodyKeydownHandler(event: KeyboardEvent): void {
    const [origin] = event.composedPath();

    // Keys from the grid focus targets (the scroller and the focused cell) drive
    // navigation. Keys from templated content in a cell pass through.
    if (origin === this._domController.virtualizer || origin instanceof IgcGridLiteCell) {
      this._stateController.navigation.navigate(event);
    }
  }

  /** Rebuilt by {@link IgcGridLite.willUpdate} when a row input changes. */
  protected _renderRow: RenderItemFunction<T> = () => html``;

  private _createRowRenderer(columns: ColumnConfiguration<T>[]): RenderItemFunction<T> {
    // The active node is read live. Activation updates only the affected rows (see
    // NavigationController) and must not rebuild the renderer: a new renderer
    // identity makes the virtualizer re-render every visible row.
    return (item: T, index: number) => html`
      <igc-grid-lite-row
        part="row"
        exportparts="cell"
        style=${styleMap(this._domController.columnSizes)}
        .adoptRootStyles=${this.adoptRootStyles}
        .index=${index}
        .activeNode=${this._stateController.active}
        .data=${item}
        .columns=${columns}
      ></igc-grid-lite-row>
    `;
  }

  protected _renderHeaderRow() {
    return html`
      <igc-grid-lite-header-row
        tabindex="0"
        style=${styleMap(this._domController.columnSizes)}
        .adoptRootStyles=${this.adoptRootStyles}
        .columns=${this._stateController.columns}
      ></igc-grid-lite-header-row>
    `;
  }

  protected _renderBody() {
    return html`
      <igc-grid-lite-virtualizer
        tabindex="0"
        .items=${this._dataState}
        .renderItem=${this._renderRow}
        @click=${this._bodyClickHandler}
        @keydown=${this._bodyKeydownHandler}
      ></igc-grid-lite-virtualizer>
    `;
  }

  protected _renderFilterRow() {
    const filterable = this._stateController.columns.some((column) => column.filterable);

    // The filter row and its editors are registered on first use. A grid without
    // filterable columns does not load their custom element definitions.
    if (filterable) {
      IgcFilterRow.register();
    }

    return html`${cache(
      filterable
        ? html`<igc-grid-lite-filter-row
            style=${styleMap(this._domController.columnSizes)}
          ></igc-grid-lite-filter-row>`
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
    [IgcGridLite.tagName]: IgcGridLite;
  }
}
