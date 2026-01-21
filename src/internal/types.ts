import type { Theme } from 'igniteui-webcomponents';
import type { CSSResult, ReactiveControllerHost, TemplateResult } from 'lit';
import type IgcGridLiteCell from '../components/cell.js';
import type { IgcGridLite } from '../components/grid.js';
import type IgcGridLiteHeader from '../components/header.js';
import type IgcGridLiteRow from '../components/row.js';
import type { SortComparer } from '../operations/sort/types.js';

export type NavigationState = 'previous' | 'current';
export type GridHost<T extends object> = ReactiveControllerHost & IgcGridLite<T>;

export type Themes = {
  light: {
    [K in Theme | 'shared']?: CSSResult;
  };
  dark: {
    [K in Theme | 'shared']?: CSSResult;
  };
};

type FlatKeys<T> = keyof T;
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends object
    ? K | `${K}.${DotPaths<T[K]>}` // Note: resolving `never` will collapse the entire interpolated string to never, leaving only valid paths
    : K;
}[keyof T & string];
type NestedKeys<T> = Exclude<DotPaths<T>, FlatKeys<T>>;

/**
 * Helper type for resolving keys of type T.
 */
export type Keys<T> = FlatKeys<T> | NestedKeys<T>;

/** Recursive T[K] property type resolve with nested dot paths support */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Helper type for resolving types of type T.
 */
export type PropertyType<T, K extends Keys<T> = Keys<T>> = K extends NestedKeys<T>
  ? PathValue<T, K> // nested path
  : K extends keyof T
    ? T[K] // flat key
    : never;

/** The data for the current column. */
export type DataType = 'number' | 'string' | 'boolean';

/**
 * Configures the sort behavior for the grid.
 */
export interface GridLiteSortingOptions {
  /**
   * The sorting mode - either 'single' or 'multiple' column sorting.
   */
  mode: 'single' | 'multiple';
}

/**
 * Extended sort configuration for a column.
 */
export interface BaseColumnSortConfiguration<T, K extends Keys<T> = Keys<T>> {
  /**
   * Custom comparer function for sort operations for this column.
   */
  comparer?: SortComparer<T, K>;
}

/**
 * See {@link BaseColumnSortConfiguration} for the full documentation.
 */
export type ColumnSortConfiguration<T, K extends Keys<T> = Keys<T>> = K extends Keys<T>
  ? BaseColumnSortConfiguration<T, K>
  : never;

/** Configuration object for grid columns. */
export interface BaseColumnConfiguration<T extends object, K extends Keys<T> = Keys<T>> {
  /**
   * The field from the data for this column.
   */
  field: K;
  /**
   * The type of data this column will reference.
   *
   * Affects the default filter operands if the column is with filtering enabled.
   *
   * @remarks
   * If not passed, `string` is assumed to be the default type.
   *
   */
  dataType?: DataType;
  /**
   * Optional text to display in the column header. By default, the column field is used
   * to render the header text.
   */
  header?: string;
  /**
   * Width for the current column.
   *
   * Accepts most CSS units for controlling width.
   *
   * @remarks
   * If not passed, the column will try to size itself based on the number of other
   * columns and the total width of the grid.
   *
   */
  width?: string;
  /**
   * Whether the column is hidden or not.
   */
  hidden?: boolean;
  /**
   * Whether the the column can be resized or not.
   */
  resizable?: boolean;
  /**
   * Whether the column can be sorted.
   */
  sortable?: boolean;
  /**
   * Whether the sort operations will be case sensitive.
   */
  sortingCaseSensitive?: boolean;
  /**
   * Sort configuration options for the column (e.g., custom comparer).
   */
  sortConfiguration?: ColumnSortConfiguration<T, K>;
  /**
   * Whether the column can be filtered.
   */
  filterable?: boolean;
  /**
   * Whether the filter operations will be case sensitive.
   */
  filteringCaseSensitive?: boolean;
  /**
   * Header template callback.
   */
  headerTemplate?: (params: IgcHeaderContext<T>) => TemplateResult | unknown;
  /**
   * Cell template callback.
   */
  cellTemplate?: (params: IgcCellContext<T, K>) => TemplateResult | unknown;
}

/**
 * See {@link BaseColumnConfiguration} for the full documentation.
 */
export type ColumnConfiguration<T extends object, K extends Keys<T> = Keys<T>> = K extends Keys<T>
  ? BaseColumnConfiguration<T, K>
  : never;

export interface ActiveNode<T> {
  column: Keys<T>;
  row: number;
}

/**
 * Context object for the column header template callback.
 */
export interface IgcHeaderContext<T extends object> {
  /**
   * The header element parent of the template.
   */
  parent: IgcGridLiteHeader<T>;
  /**
   * The current configuration for the column.
   */
  column: ColumnConfiguration<T>;
}

/**
 * Context object for the row cell template callback.
 */
export interface BaseIgcCellContext<T extends object, K extends Keys<T> = Keys<T>> {
  /**
   * The cell element parent of the template.
   */
  parent: IgcGridLiteCell<T>;
  /**
   * The row element containing the cell.
   */
  row: IgcGridLiteRow<T>;
  /**
   * The current configuration for the column.
   */
  column: ColumnConfiguration<T, K>;
  /**
   * The value from the data source for this cell.
   */
  value: PropertyType<T, K>;
}

/**
 * See {@link BaseIgcCellContext} for the full documentation.
 */
export type IgcCellContext<T extends object, K extends Keys<T> = Keys<T>> = K extends Keys<T>
  ? BaseIgcCellContext<T, K>
  : never;

/**
 * The parameters passed to a {@link DataPipelineHook} callback.
 */
export type DataPipelineParams<T extends object> = {
  /**
   * The current data state of the grid.
   */
  data: T[];
  /**
   * The grid component itself.
   */
  grid: IgcGridLite<T>;
  /**
   * The type of data operation being performed.
   */
  type: 'sort' | 'filter';
};

/**
 * Callback function for customizing data operations in the grid.
 */
export type DataPipelineHook<T extends object> = (
  state: DataPipelineParams<T>
) => T[] | Promise<T[]>;

/**
 * Configuration for customizing the various data operations of the grid.
 */
export interface DataPipelineConfiguration<T extends object> {
  /**
   * Hook for customizing sort operations.
   */
  sort?: DataPipelineHook<T>;
  /**
   * Hook for customizing filter operations.
   */
  filter?: DataPipelineHook<T>;
}
