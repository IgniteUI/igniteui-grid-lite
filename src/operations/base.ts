import { normalizeCase } from '../internal/normalize-case.js';
import type { Keys, PropertyType } from '../internal/types.js';
import { resolveFieldValue } from '../internal/utils.js';

export default abstract class DataOperation<T, K extends Keys<T> = Keys<T>> {
  protected resolveValue(record: T, key: K) {
    return resolveFieldValue(record, key);
  }

  protected resolveCase<U = PropertyType<T, K>>(value: U, caseSensitive?: boolean) {
    return typeof value === 'string' ? (normalizeCase(value, caseSensitive) as U) : value;
  }

  public abstract apply(...args: unknown[]): T[];
}
