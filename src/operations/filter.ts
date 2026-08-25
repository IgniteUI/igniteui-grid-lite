import { isString } from '../internal/utils.js';
import DataOperation from './base.js';
import type { FilterState } from './filter/state.js';
import type { FilterExpression, FilterOperation } from './filter/types.js';

/**
 * An expression keeps its condition as a raw operand name until a matching column
 * configuration resolves it. Without a column (e.g. `filterExpressions` set for a
 * field that was never slotted) there is nothing to run: skip the expression.
 */
function isResolved<T extends object>(expression: FilterExpression<T>): boolean {
  return !isString(expression.condition);
}

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

    // With no ANDs the ORs are the whole answer - `every` on an empty set is
    // vacuously true and would otherwise let every record through.
    if (ands.length === 0) {
      return ors.length === 0;
    }

    return ands.every((expr) => this.resolveFilter(record, expr));
  }

  public apply(data: T[], state: FilterState<T>): T[] {
    if (state.empty) return data;

    // Pre-compute ors/ands per tree once, not per record. Remove trees with no
    // runnable expressions: an empty `ands` set would decide the match for
    // records it says nothing about.
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
