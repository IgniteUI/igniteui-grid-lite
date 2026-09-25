import { isString } from '../internal/utils.js';
import DataOperation from './base.js';
import type { FilterState } from './filter/state.js';
import type { FilterExpression, FilterOperation } from './filter/types.js';

/** A string condition waits for its column to resolve it. Without one, skip it. */
function isResolved<T extends object>(expression: FilterExpression<T>): boolean {
  return !isString(expression.condition);
}

export default class FilterDataOperation<T extends object> extends DataOperation<T> {
  protected resolveFilter(record: T, expr: FilterExpression<T>) {
    const condition = expr.condition as FilterOperation<T>;
    return condition.logic(
      this.resolveValue(record, expr.key) as T,
      expr.searchTerm as T,
      expr.caseSensitive
    );
  }

  protected matchTree(record: T, ors: FilterExpression<T>[], ands: FilterExpression<T>[]): boolean {
    if (ors.some((expr) => this.resolveFilter(record, expr))) {
      return true;
    }

    // No ANDs: the ORs decide alone (`every([])` is true).
    if (ands.length === 0) {
      return ors.length === 0;
    }

    return ands.every((expr) => this.resolveFilter(record, expr));
  }

  public apply(data: T[], state: FilterState<T>): T[] {
    if (state.empty) {
      return data;
    }

    // Split once per tree, not per record. Drop trees with nothing runnable.
    const trees = state.values
      .map((tree) => ({ ors: tree.ors.filter(isResolved), ands: tree.ands.filter(isResolved) }))
      .filter(({ ors, ands }) => ors.length > 0 || ands.length > 0);

    if (trees.length === 0) {
      return data;
    }

    return data.filter((record) =>
      trees.every(({ ors, ands }) => this.matchTree(record, ors, ands))
    );
  }
}
