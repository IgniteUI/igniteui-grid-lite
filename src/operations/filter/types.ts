import type { Keys, PropertyType } from '../../internal/types.js';
import type { BooleanOperands } from './operands/boolean.js';
import type { NumberOperands } from './operands/number.js';
import type { StringOperands } from './operands/string.js';

/**
 * Controls how a data record should resolve in a filter operation:
 *  - `'and'` - the record must pass all the conditions.
 *  - `'or'`  - the record must pass at least one condition.
 */
export type FilterCriteria = 'and' | 'or';

export type FilterOperationLogic<T> = (
  target: T,
  searchTerm: T,
  caseSensitive?: boolean
) => boolean;

export interface FilterOperation<T> {
  name: string;
  label?: string;
  unary: boolean;
  logic: FilterOperationLogic<T>;
}

export type FilterOperands<DataType, Operands extends string> = {
  [key in Operands]: FilterOperation<DataType>;
};

/**
 * Represents a filter operation for a given column.
 */
export interface BaseFilterExpression<T, K extends Keys<T> = Keys<T>> {
  /**
   * The target column for the filter operation.
   */
  key: K;
  /**
   * The filter function which will be executed against the data records.
   */
  condition: FilterOperation<PropertyType<T, K>> | OperandKeys<PropertyType<T, K>>;

  /**
   * The filtering value used in the filter condition function.
   *
   * @remarks
   * Optional for unary conditions.
   */
  searchTerm?: PropertyType<T, K>;
  /**
   * Dictates how this expression should resolve in the filter operation in relation to
   * other expressions.
   */
  criteria?: FilterCriteria;
  /**
   * Whether the sort operation should be case sensitive.
   *
   * @remarks
   * If not provided, the value is resolved based on the column filter configuration (if any).
   */
  caseSensitive?: boolean;
}

/**
 * See {@link BaseFilterExpression} for the full documentation.
 */
export type FilterExpression<T, K extends Keys<T> = Keys<T>> = K extends Keys<T>
  ? BaseFilterExpression<T, K>
  : never;

export type OperandKeys<Type> = Type extends number
  ? keyof typeof NumberOperands
  : Type extends string
    ? keyof typeof StringOperands
    : Type extends boolean
      ? keyof typeof BooleanOperands
      : Type;
