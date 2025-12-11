import type { StyleInfo } from 'lit/directives/style-map.js';
import { BooleanOperands } from '../operations/filter/operands/boolean.js';
import { NumberOperands } from '../operations/filter/operands/number.js';
import { StringOperands } from '../operations/filter/operands/string.js';
import type { ColumnConfiguration } from './types.js';

export function applyColumnWidths<T extends object>(
  columns: Array<ColumnConfiguration<T>>
): StyleInfo {
  const iter = Iterator.from(columns)
    .filter((each) => !each.hidden)
    .map((each) => each.width ?? 'minmax(136px, 1fr)');

  return { 'grid-template-columns': iter.toArray().join(' ') };
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
