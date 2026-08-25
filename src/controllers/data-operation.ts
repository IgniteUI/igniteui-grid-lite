import type { ReactiveController } from 'lit';
import type { GridHost } from '../internal/types.js';
import FilterDataOperation from '../operations/filter.js';
import SortDataOperation from '../operations/sort.js';
import type { StateController } from './state.js';

class DataOperationsController<T extends object> implements ReactiveController {
  protected sorting = new SortDataOperation<T>();
  protected filtering = new FilterDataOperation<T>();

  constructor(protected host: GridHost<T>) {
    this.host.addController(this);
  }

  public hostConnected() {}

  public async apply(data: T[], state: StateController<T>) {
    // A hook, when configured, replaces the built-in operation.
    const { filter, sort } = this.host.dataPipelineConfiguration ?? {};

    const filtered = filter
      ? await filter({ data, grid: this.host, type: 'filter' })
      : this.filtering.apply(data, state.filtering.state);

    return sort
      ? await sort({ data: filtered, grid: this.host, type: 'sort' })
      : this.sorting.apply(filtered, state.sorting.state);
  }
}

function createDataOperationsController<T extends object>(
  host: GridHost<T>
): DataOperationsController<T> {
  return new DataOperationsController<T>(host);
}

export type { DataOperationsController };
export { createDataOperationsController };
