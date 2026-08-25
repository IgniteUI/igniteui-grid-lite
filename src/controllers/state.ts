import { PIPELINE } from '../internal/constants.js';
import type { ActiveNode, ColumnConfiguration, GridHost, Keys } from '../internal/types.js';
import { createColumnConfiguration, setColumnsFromData } from '../internal/utils.js';
import type { GridDOMController } from './dom.js';
import { FilterController } from './filter.js';
import { NavigationController } from './navigation.js';
import { ResizeController } from './resize.js';
import { SortController } from './sort.js';

/**
 * Holds the column configuration of the grid and owns the controllers for its
 * data operations. Column objects are immutable: each change produces new objects
 * and a new array, so consumers can dirty-check by identity.
 *
 * @remarks
 * Not a reactive controller: it has no host lifecycle. All DOM concerns live in
 * {@link GridDOMController}.
 */
class StateController<T extends object> {
  private _columns: ColumnConfiguration<T>[] = [];
  private readonly _observersCallback: () => void;

  /** The grid host element. */
  public readonly host: GridHost<T>;

  public readonly sorting: SortController<T>;
  public readonly filtering: FilterController<T>;
  public readonly navigation: NavigationController<T>;
  public readonly resizing: ResizeController<T>;

  public get columns(): ColumnConfiguration<T>[] {
    return this._columns;
  }

  /** The currently active node in the grid. */
  public get active(): ActiveNode<T> {
    return this.navigation.active;
  }

  /** Sets the currently active node in the grid. */
  public set active(node: ActiveNode<T>) {
    this.navigation.active = node;
  }

  constructor(host: GridHost<T>, dom: GridDOMController<T>, observersCallback: () => void) {
    this._observersCallback = observersCallback;
    this.host = host;

    this.sorting = new SortController(this);
    this.filtering = new FilterController(this, dom);
    this.navigation = new NavigationController(this, dom);
    this.resizing = new ResizeController(this, dom);
  }

  /**
   * Notifies the state context consumers (headers, header row, filter row) that
   * their render inputs changed. Called at the mutation points only, never on
   * each host update.
   */
  public updateObservers(): void {
    this._observersCallback.call(this.host);
  }

  public setColumnConfiguration(columns: ColumnConfiguration<T>[]): void {
    this._columns = columns.map((column) => createColumnConfiguration(column));
    this.filtering.resolveConditions();
    this.updateObservers();
    this.host.requestUpdate(PIPELINE);
  }

  public setAutoColumnConfiguration(): void {
    if (this.host.autoGenerate && this.host.data.length > 0) {
      this._columns = setColumnsFromData(this.host.data[0]);
      this.filtering.resolveConditions();
      this.host.requestUpdate(PIPELINE);
    }
  }

  public updateColumnsConfiguration(config: ColumnConfiguration<T>[]): void {
    // NOTE: The in-place writes are load-bearing. Consumers holding the current
    // array (header row, DOM controller) must see the new column objects in this
    // update cycle; rebuilding the array delivers them one cycle late.
    for (const columnConfig of config) {
      const existing = this._columns.findIndex((column) => column.field === columnConfig.field);
      if (existing !== -1) {
        this._columns[existing] = {
          ...this._columns[existing],
          ...createColumnConfiguration(columnConfig),
        };
      }
    }

    this._columns = [...this._columns];
    this.updateObservers();
    this.host.requestUpdate(PIPELINE);
  }

  /**
   * Replaces the width of a single column with a new configuration object.
   *
   * @remarks
   * Width has no effect on the data pipeline, so no pipeline run is scheduled.
   * Resize drags call this on each pointer move.
   */
  public setColumnWidth(field: Keys<T>, width: string): void {
    const index = this._columns.findIndex((column) => column.field === field);

    if (index === -1) {
      return;
    }

    this._columns = this._columns.with(index, { ...this._columns[index], width });
    this.updateObservers();
    this.host.requestUpdate();
  }
}

function createStateController<T extends object>(
  host: GridHost<T>,
  dom: GridDOMController<T>,
  observersCallback: () => void
): StateController<T> {
  return new StateController<T>(host, dom, observersCallback);
}

export type { StateController };
export { createStateController };
