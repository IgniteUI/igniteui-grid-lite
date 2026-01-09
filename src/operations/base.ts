import type { Keys } from '../internal/types.js';
import { resolveFieldValue } from '../internal/utils.js';

export default abstract class DataOperation<T, K extends Keys<T> = Keys<T>> {
  protected resolveValue(record: T, key: K) {
    return resolveFieldValue(record as T & object, key);
  }

  protected resolveCase<U = T[K]>(value: U, caseSensitive?: boolean) {
    return typeof value === 'string' && !caseSensitive ? (value.toLowerCase() as U) : value;
  }

  public abstract apply(...args: unknown[]): T[];
}
