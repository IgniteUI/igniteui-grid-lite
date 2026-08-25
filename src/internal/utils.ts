import type { StyleInfo } from 'lit/directives/style-map.js';
import { BooleanOperands } from '../operations/filter/operands/boolean.js';
import { NumberOperands } from '../operations/filter/operands/number.js';
import { StringOperands } from '../operations/filter/operands/string.js';
import type { FilterOperation } from '../operations/filter/types.js';
import type { ColumnConfiguration, Keys, PropertyType } from './types.js';

const DEFAULT_COLUMN_WIDTH = 'minmax(136px, 1fr)';

function _isObject(entity: unknown): entity is Record<string, unknown> {
  return entity != null && typeof entity === 'object';
}

/**
 * Dot-path -> segments cache. Filtering and sorting resolve the same handful of paths
 * once per record, so the split is done once per path instead of per lookup.
 */
const pathSegments = new Map<string, string[]>();

function getPathSegments(path: string): string[] {
  let segments = pathSegments.get(path);

  if (!segments) {
    segments = path.split('.');
    pathSegments.set(path, segments);
  }

  return segments;
}

/**
 * Resolves a value from an object using a path string.
 * Supports nested properties using dot notation (e.g., 'prop.nestedProp').
 *
 * @param obj - The object to resolve the value from.
 * @param path - The path to the property, can be a simple key or dot-separated path.
 * @returns The resolved value, or undefined if the path cannot be resolved.
 */
export function resolveFieldValue<T>(obj: T, path: Keys<T>): PropertyType<T> {
  if (typeof path === 'string' && path.includes('.')) {
    return getPathSegments(path).reduce<unknown>((current, key) => {
      return _isObject(current) && key in current ? current[key] : undefined;
    }, obj) as PropertyType<T>;
  }
  return obj[path as keyof T] as PropertyType<T>;
}

export function applyColumnWidths<T extends object>(
  columns: Array<ColumnConfiguration<T>>
): StyleInfo {
  const widths = columns
    .filter((each) => !each.hidden)
    .map((each) => each.width ?? DEFAULT_COLUMN_WIDTH);

  return { 'grid-template-columns': widths.join(' ') };
}

export function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}

export function isNumber(x: unknown): x is number {
  return typeof x === 'number' && !Number.isNaN(x);
}

export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function getFilterOperandsFor<T extends object>(column: ColumnConfiguration<T>) {
  // Check for custom class in the filter config
  switch (column.dataType) {
    case 'boolean':
      return BooleanOperands;
    case 'number':
      return NumberOperands;
    default:
      return StringOperands;
  }
}

/** Resolves a raw operand name (e.g. 'contains') to the column's filter operation. */
export function resolveCondition<T extends object>(
  column: ColumnConfiguration<T>,
  name: string
): FilterOperation<any> {
  return (getFilterOperandsFor(column) as Record<string, FilterOperation<any>>)[name];
}

function getColumnType(value: unknown): 'boolean' | 'number' | 'string' {
  if (isBoolean(value)) {
    return 'boolean';
  }

  if (isNumber(value)) {
    return 'number';
  }

  return 'string';
}

export function setColumnsFromData<T extends object>(record: T): Array<ColumnConfiguration<T>> {
  return Object.entries(record).map(([key, value]) => {
    return createColumnConfiguration<T>({
      field: key as keyof T,
      dataType: getColumnType(value),
    } as Partial<ColumnConfiguration<T>>);
  });
}

export function createColumnConfiguration<T extends object>(
  config: Partial<ColumnConfiguration<T>>
): ColumnConfiguration<T> {
  return {
    field: config.field ?? '',
    dataType: config.dataType ?? 'string',
    header: config.header,
    width: config.width,
    hidden: config.hidden ?? false,
    resizable: config.resizable ?? false,
    sortable: config.sortable ?? false,
    sortingCaseSensitive: config.sortingCaseSensitive ?? false,
    sortConfiguration: config.sortConfiguration,
    filterable: config.filterable ?? false,
    filteringCaseSensitive: config.filteringCaseSensitive ?? false,
    headerTemplate: config.headerTemplate,
    cellTemplate: config.cellTemplate,
  } as ColumnConfiguration<T>;
}
