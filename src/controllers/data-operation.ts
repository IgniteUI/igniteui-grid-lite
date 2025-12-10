import type { ReactiveController } from 'lit';
import { isDefined } from '../internal/is-defined.js';
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

  protected get hasCustomSort() {
    return isDefined(this.host.dataPipelineConfiguration?.sort);
  }

  protected get hasCustomFilter() {
    return isDefined(this.host.dataPipelineConfiguration?.filter);
  }

  protected get customFilter() {
    return this.host.dataPipelineConfiguration!.filter!;
  }

  protected get customSort() {
    return this.host.dataPipelineConfiguration!.sort!;
  }

  public async apply(data: T[], state: StateController<T>) {
    const { filtering, sorting } = state;
    let transformed: T[];

    transformed = this.hasCustomFilter
      ? await this.customFilter({ data, grid: this.host, type: 'filter' })
      : this.filtering.apply(data, filtering.state);

    transformed = this.hasCustomSort
      ? await this.customSort({ data: transformed, grid: this.host, type: 'sort' })
      : this.sorting.apply(transformed, sorting.state);

    return transformed;
  }
}

function createDataOperationsController<T extends object>(
  host: GridHost<T>
): DataOperationsController<T> {
  return new DataOperationsController<T>(host);
}

export { createDataOperationsController };
export type { DataOperationsController };
