import DataOperation from './base.js';
import type { FilterState } from './filter/state.js';
import type { FilterExpression, FilterOperation } from './filter/types.js';

export default class FilterDataOperation<T extends object> extends DataOperation<T> {
  protected resolveFilter(record: T, expr: FilterExpression<T>) {
    const condition = expr.condition as FilterOperation<T>;
    return condition.logic(
      // XXX: Types
      this.resolveValue(record, expr.key) as T,
      expr.searchTerm as T,
      expr.caseSensitive
    );
  }

  protected matchTree(record: T, ors: FilterExpression<T>[], ands: FilterExpression<T>[]): boolean {
    if (ors.length > 0 && ors.some((expr) => this.resolveFilter(record, expr))) {
      return true;
    }
    return ands.every((expr) => this.resolveFilter(record, expr));
  }

  public apply(data: T[], state: FilterState<T>): T[] {
    if (state.empty) return data;

    // Pre-compute ors/ands per tree once rather than re-deriving them per record
    const trees = state.values.map((tree) => ({ ors: tree.ors, ands: tree.ands }));

    return data.filter((record) =>
      trees.every(({ ors, ands }) => this.matchTree(record, ors, ands))
    );
  }
}
