import type { StyleInfo } from 'lit/directives/style-map.js';
import { BooleanOperands } from '../operations/filter/operands/boolean.js';
import { NumberOperands } from '../operations/filter/operands/number.js';
import { StringOperands } from '../operations/filter/operands/string.js';
import type { FilterOperation } from '../operations/filter/types.js';
import type { ColumnConfiguration, DataType, Keys, PropertyType } from './types.js';

const DEFAULT_COLUMN_WIDTH = 'minmax(136px, 1fr)';

function _isObject(entity: unknown): entity is Record<string, unknown> {
  return entity != null && typeof entity === 'object';
}

/** Dot-path segment cache: sort and filter resolve the same few paths per record. */
const pathSegments = new Map<string, string[]>();

function getPathSegments(path: string): string[] {
  let segments = pathSegments.get(path);

  if (!segments) {
    segments = path.split('.');
    pathSegments.set(path, segments);
  }

  return segments;
}

/** Resolves `path` on `obj`. Dot paths reach nested props (`'a.b'`). Undefined when unresolvable. */
export function resolveFieldValue<T>(obj: T, path: Keys<T>): PropertyType<T> {
  if (typeof path === 'string' && path.includes('.')) {
    return getPathSegments(path).reduce<unknown>((current, key) => {
      return _isObject(current) && key in current ? current[key] : undefined;
    }, obj) as PropertyType<T>;
  }
  return obj[path as keyof T] as PropertyType<T>;
}

/** The columns rows render. Navigation, ARIA and track sizes share this sequence. */
export function visibleColumns<T extends object>(
  columns: ColumnConfiguration<T>[]
): ColumnConfiguration<T>[] {
  return columns.filter((column) => !column.hidden);
}

export function applyColumnWidths<T extends object>(
  columns: Array<ColumnConfiguration<T>>
): StyleInfo {
  const widths = visibleColumns(columns).map((each) => each.width ?? DEFAULT_COLUMN_WIDTH);

  return { 'grid-template-columns': widths.join(' ') };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

function getColumnType(value: unknown): DataType {
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
