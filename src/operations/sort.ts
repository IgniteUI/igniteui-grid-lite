import DataOperation from './base.js';
import type { SortState } from './sort/types.js';

// One shared collator: `localeCompare` builds one per call.
const collator = new Intl.Collator();

const DIRECTION_MULTIPLIERS: Record<string, number> = {
  ascending: 1,
  descending: -1,
};

export default class SortDataOperation<T> extends DataOperation<T> {
  protected compareValues<U>(first: U, second: U) {
    if (typeof first === 'string' && typeof second === 'string') {
      return collator.compare(first, second);
    }
    return first > second ? 1 : first < second ? -1 : 0;
  }

  public apply(data: T[], state: SortState<T>) {
    if (state.size === 0) {
      return data;
    }

    const expressions = Array.from(state.values());
    const length = expressions.length;

    // Resolved once, not per comparison.
    const multipliers = expressions.map(({ direction }) => DIRECTION_MULTIPLIERS[direction]);
    const comparers = expressions.map(({ comparer }) => comparer);

    // Flat tuples [item, key0, key1, ...]: keys resolve once, no per-row objects.
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
          (comparers[i]?.(keyA as any, keyB as any) ?? this.compareValues(keyA, keyB));
        i++;
      }

      return result;
    });

    return transformed.map((tuple) => tuple[0] as T);
  }
}
