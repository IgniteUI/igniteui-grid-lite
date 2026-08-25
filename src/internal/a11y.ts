import type { ColumnConfiguration } from './types.js';

/** The roles the grid parts take in the ARIA grid pattern. */
type GridRole = 'grid' | 'row' | 'rowgroup' | 'columnheader' | 'gridcell';

/** ARIA state written on a part. A `null` value removes the property. */
type AriaState = Partial<Record<keyof ARIAMixin, string | null>>;

/** `aria-rowindex` of the header row. The grid row index space is 1-based. */
export const HEADER_ROW_INDEX = 1;

/** `aria-rowindex` of the filter row. It always comes after the header row. */
export const FILTER_ROW_INDEX = 2;

/**
 * ElementInternals keeps ARIA out of the DOM. Neither `getAttribute` nor
 * `element.role` can read the semantics back. This registry is the only read path.
 */
const semantics = new WeakMap<Element, ARIAMixin>();

/**
 * Publishes the ARIA semantics of one grid part through its ElementInternals.
 * Roles and states stay off the observable attributes of the host.
 */
class A11yController {
  readonly #internals: ElementInternals;

  constructor(host: HTMLElement, role: GridRole) {
    this.#internals = host.attachInternals();
    this.#internals.role = role;

    semantics.set(host, this.#internals);
  }

  /** Writes ARIA state on the host. */
  public set(state: AriaState): void {
    Object.assign(this.#internals, state);
  }
}

/** Sets the grid pattern role of `host` and returns a handle to its ARIA state. */
export function addA11y(host: HTMLElement, role: GridRole): A11yController {
  return new A11yController(host, role);
}

/** Returns the ARIA semantics `element` published through its ElementInternals. */
export function ariaOf(element: Element): ARIAMixin | undefined {
  return semantics.get(element);
}

/**
 * Number of rows the grid renders above its data: the header row, plus the filter
 * row when a column is filterable. Data rows are indexed after them.
 */
export function headerRowsFor<T extends object>(columns: ColumnConfiguration<T>[]): number {
  return columns.some((column) => column.filterable) ? FILTER_ROW_INDEX : HEADER_ROW_INDEX;
}

export type { A11yController };
