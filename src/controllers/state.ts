import type { ReactiveController } from 'lit';
import type IgcFilterRow from '../components/filter-row.js';
import type IgcGridLiteHeaderRow from '../components/header-row.js';
import type IgcGridLiteRow from '../components/row.js';
import type IgcVirtualizer from '../components/virtualizer.js';
import { PIPELINE } from '../internal/constants.js';
import {
  GRID_BODY,
  GRID_FILTER_ROW_TAG,
  GRID_HEADER_ROW_TAG,
  GRID_ROW_TAG,
} from '../internal/tags.js';
import type { ActiveNode, ColumnConfiguration, GridHost } from '../internal/types.js';
import { createColumnConfiguration, setColumnsFromData } from '../internal/utils.js';
import { FilterController } from './filter.js';
import { NavigationController } from './navigation.js';
import { ResizeController } from './resize.js';
import { SortController } from './sort.js';

class StateController<T extends object> implements ReactiveController {
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

  /** Returns the header row element of the grid. */
  public get headerRow(): IgcGridLiteHeaderRow<T> | null {
    return this.host.renderRoot.querySelector<IgcGridLiteHeaderRow<T>>(GRID_HEADER_ROW_TAG);
  }

  /** Returns the filter row element of the grid. */
  public get filterRow(): IgcFilterRow<T> | null {
    return this.host.renderRoot.querySelector<IgcFilterRow<T>>(GRID_FILTER_ROW_TAG);
  }

  /** Returns the data row elements of the grid. */
  public get rows(): IgcGridLiteRow<T>[] {
    return Array.from(this.host.renderRoot.querySelectorAll<IgcGridLiteRow<T>>(GRID_ROW_TAG));
  }

  /** Returns the virtualizer element of the grid. */
  public get virtualizer(): IgcVirtualizer | null {
    return this.host.renderRoot.querySelector(GRID_BODY);
  }

  /** The currently active node in the grid. */
  public get active(): ActiveNode<T> {
    return this.navigation.active;
  }

  /** Sets the currently active node in the grid. */
  public set active(node: ActiveNode<T>) {
    this.navigation.active = node;
  }

  constructor(host: GridHost<T>, observersCallback: () => void) {
    this._observersCallback = observersCallback;
    this.host = host;
    this.host.addController(this);

    this.sorting = new SortController(this.host);
    this.filtering = new FilterController(this);
    this.navigation = new NavigationController(this);
    this.resizing = new ResizeController(this.host);
  }

  public hostUpdate(): void {
    this.headerRow?.requestUpdate();
    this.virtualizer?.requestUpdate();
  }

  public setColumnConfiguration(columns: ColumnConfiguration<T>[]): void {
    this._columns = columns.map((column) => createColumnConfiguration(column));
    this._observersCallback.call(this.host);
    this.host.requestUpdate(PIPELINE);
  }

  public setAutoColumnConfiguration(): void {
    if (this.host.autoGenerate && this.host.data.length > 0) {
      this._columns = setColumnsFromData(this.host.data[0]);
      this.host.requestUpdate(PIPELINE);
    }
  }

  public updateColumnsConfiguration(config: ColumnConfiguration<T>[]): void {
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
    this._observersCallback.call(this.host);
    this.host.requestUpdate(PIPELINE);
  }
}

function createStateController<T extends object>(
  host: GridHost<T>,
  observersCallback: () => void
): StateController<T> {
  return new StateController<T>(host, observersCallback);
}

export { createStateController };
export type { StateController };
