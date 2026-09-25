import type { ReactiveController } from 'lit';
import { NO_SCROLL, SENTINEL_NODE } from '../internal/constants.js';
import type { ActiveNode, NavigateToOptions } from '../internal/types.js';
import { clamp, visibleColumns } from '../internal/utils.js';
import type { GridDOMController } from './dom.js';
import type { StateController } from './state.js';

/** Minimal scroll that shows the target. */
const SCROLL_NEAREST: ScrollIntoViewOptions = { block: 'nearest' };

/** The active node a row at `index` receives: only the active row sees it. */
export function activeNodeFor<T extends object>(active: ActiveNode<T>, index: number) {
  return active.row === index ? active : (SENTINEL_NODE as ActiveNode<T>);
}

export class NavigationController<T extends object> implements ReactiveController {
  protected handlers = new Map<string, () => void>([
    ['ArrowDown', () => this.#moveToRow(this.nextNode.row + 1)],
    ['ArrowUp', () => this.#moveToRow(this.nextNode.row - 1)],
    ['ArrowLeft', () => this.#moveToColumn(-1)],
    ['ArrowRight', () => this.#moveToColumn(1)],
    ['Home', () => this.#moveToRow(0)],
    ['End', () => this.#moveToRow(this._state.host.totalItems - 1)],
  ]);

  protected get _virtualizer() {
    return this._dom.virtualizer;
  }

  protected _active = SENTINEL_NODE as ActiveNode<T>;

  protected get nextNode() {
    return this._active === SENTINEL_NODE
      ? ({ column: this._firstColumn, row: 0 } as ActiveNode<T>)
      : ({ ...this._active } as ActiveNode<T>);
  }

  protected get _columns() {
    return visibleColumns(this._state.columns);
  }

  protected get _firstColumn() {
    return this._columns.at(0)?.field ?? SENTINEL_NODE.column;
  }

  protected queryRowByIndex(index: number) {
    return this._dom.rows.find((row) => row.index === index);
  }

  /** The rendered cell at `node`, if its row and column are in the DOM. */
  #queryCell(node: ActiveNode<T>) {
    return this.queryRowByIndex(node.row)?.cells.find((cell) => cell.column.field === node.column);
  }

  protected scrollToCell(node: ActiveNode<T>) {
    this.#queryCell(node)?.scrollIntoView(SCROLL_NEAREST);
  }

  public get active(): ActiveNode<T> {
    return this._active;
  }

  public set active(node: ActiveNode<T>) {
    const previous = this._active;

    this._active = node ?? SENTINEL_NODE;
    this.#updateActiveRows(previous);
    this._state.host.requestUpdate();
  }

  /** Updates only the rows entering or leaving the active state. */
  #updateActiveRows(previous: ActiveNode<T>): void {
    for (const row of this._dom.rows) {
      if (row.index === previous.row || row.index === this._active.row) {
        row.activeNode = activeNodeFor(this._active, row.index);
      }
    }
  }

  /** Moves DOM focus onto the active cell when it is rendered (roving focus). */
  async #focusActiveCell(): Promise<void> {
    const node = this._active;
    let row = this.queryRowByIndex(node.row);

    // Row not rendered yet: wait for layout.
    if (!row) {
      await this._virtualizer?.layoutComplete;
      row = this.queryRowByIndex(node.row);
    }

    await row?.updateComplete;

    // A newer navigation replaced this one during the render wait.
    if (node !== this._active) {
      return;
    }

    this.#queryCell(node)?.focus(NO_SCROLL);
  }

  constructor(
    protected _state: StateController<T>,
    protected _dom: GridDOMController<T>
  ) {
    this._state.host.addController(this);
  }

  /** Activates `row` (clamped to the data range) and scrolls it into view. */
  #moveToRow(row: number) {
    const clamped = clamp(row, 0, this._state.host.totalItems - 1);

    this.active = Object.assign(this.nextNode, { row: clamped });
    this._virtualizer?.scrollToIndex(clamped, SCROLL_NEAREST);
  }

  /**
   * Steps the active column by `offset`, clamping at the visible ends. A hidden
   * or missing key (index -1) lands on the first visible column.
   */
  #moveToColumn(offset: -1 | 1) {
    const next = this.nextNode;
    const columns = this._columns;

    const index = columns.findIndex((column) => column.field === next.column);
    const target = clamp(index + offset, 0, columns.length - 1);

    this.active = Object.assign(next, { column: columns[target].field });
    this.scrollToCell(this.active);
  }

  public hostDisconnected() {
    this.active = SENTINEL_NODE as ActiveNode<T>;
  }

  public navigate(event: KeyboardEvent) {
    const handler = this.handlers.get(event.key);

    // Nothing to move to without a visible column or a data row.
    if (!handler || this._columns.length === 0 || this._state.host.totalItems === 0) {
      return;
    }

    event.preventDefault();
    handler();
    this.#focusActiveCell();
  }

  public async navigateTo(row: number, options?: NavigateToOptions<T>) {
    const { column, activate } = options ?? {};

    if (activate) {
      // Without an explicit column, activation keeps the one from `nextNode`.
      this.active = Object.assign(this.nextNode, column ? { row, column } : { row });
    }

    await this._virtualizer?.scrollToIndex(row, SCROLL_NEAREST);

    if (column) {
      this.scrollToCell({ row, column });
    }
  }
}
