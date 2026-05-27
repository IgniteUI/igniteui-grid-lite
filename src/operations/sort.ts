import DataOperation from './base.js';
import type { SortState } from './sort/types.js';

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

  public apply(data: T[], state: SortState<T>) {
    const expressions = Array.from(state.values());
    const length = expressions.length;

    // Pre-compute direction multipliers once to avoid Map lookups in the comparator
    const multipliers = expressions.map(({ direction }) => this.orderBy.get(direction)!);

    // Store as flat tuples [item, key0, key1, ...] to avoid per-row object allocation
    // and transform only once before sorting, then extract the original items after sorting.
    const transformed = data.map((item) => {
      const tuple: unknown[] = new Array(length + 1);
      tuple[0] = item;
      for (let i = 0; i < length; i++) {
        const { key, caseSensitive } = expressions[i];
        tuple[i + 1] = this.resolveCase(this.resolveValue(item, key), caseSensitive);
      }
      return tuple;
    });

    transformed.sort((a, b) => {
      let i = 0;
      let result = 0;

      while (i < length && !result) {
        const keyA = a[i + 1];
        const keyB = b[i + 1];
        result =
          multipliers[i] *
          (expressions[i].comparer?.(keyA as any, keyB as any) ?? this.compareValues(keyA, keyB));
        i++;
      }

      return result;
    });

    return transformed.map((tuple) => tuple[0] as T);
  }
}
