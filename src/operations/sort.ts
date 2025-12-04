import DataOperation from './base.js';
import type { SortingExpression, SortState } from './sort/types.js';

export default class SortDataOperation<T> extends DataOperation<T> {
  protected orderBy = new Map(
    Object.entries({
      ascending: 1,
      descending: -1,
    })
  );

  protected compareValues<U>(first: U, second: U) {
    if (typeof first === 'string' && typeof second === 'string') {
      return first.localeCompare(second);
    }
    return first > second ? 1 : first < second ? -1 : 0;
  }

  protected compareObjects(first: T, second: T, expression: SortingExpression<T>) {
    const { direction, key, caseSensitive, comparer } = expression;

    const a = this.resolveCase(this.resolveValue(first, key), caseSensitive);
    const b = this.resolveCase(this.resolveValue(second, key), caseSensitive);

    // TODO: Remove casting as any
    return (
      this.orderBy.get(direction)! * (comparer?.(a as any, b as any) ?? this.compareValues(a, b))
    );
  }

  public apply(data: T[], state: SortState<T>) {
    const expressions = Array.from(state.values());
    const length = expressions.length;

    data.sort((a, b) => {
      let i = 0;
      let result = 0;

      while (i < length && !result) {
        result = this.compareObjects(a, b, expressions[i]);
        i++;
      }

      return result;
    });

    return data;
  }
}
