import type { ReactiveController } from 'lit';
import { SENTINEL_NODE } from '../internal/constants.js';
import type { ActiveNode, NavigateToOptions } from '../internal/types.js';
import type { GridDOMController } from './dom.js';
import type { StateController } from './state.js';

export class NavigationController<T extends object> implements ReactiveController {
  protected handlers = new Map(
    Object.entries({
      ArrowDown: this.arrowDown,
      ArrowUp: this.arrowUp,
      ArrowLeft: this.arrowLeft,
      ArrowRight: this.arrowRight,
      Home: this.home,
      End: this.end,
    })
  );

  protected get _virtualizer() {
    return this._dom.virtualizer;
  }

  protected _active = SENTINEL_NODE as ActiveNode<T>;

  protected get nextNode() {
    return this._active === SENTINEL_NODE
      ? ({ column: this._firstColumn, row: 0 } as ActiveNode<T>)
      : ({ ...this._active } as ActiveNode<T>);
  }

  /** Rows render only the visible columns, so navigation walks the same sequence. */
  protected get _columns() {
    return this._state.columns.filter((column) => !column.hidden);
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
    this.#queryCell(node)?.scrollIntoView({ block: 'nearest' });
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

  /**
   * Sends the new active node only to the rows that enter or leave the active
   * state. The other rendered rows have no changes and are not re-rendered.
   */
  #updateActiveRows(previous: ActiveNode<T>): void {
    for (const row of this._dom.rows) {
      if (row.index === previous.row || row.index === this._active.row) {
        row.activeNode = this._active;
      }
    }
  }

  /** Moves DOM focus onto the active cell when it is rendered (roving focus). */
  async #focusActiveCell(): Promise<void> {
    const node = this._active;
    let row = this.queryRowByIndex(node.row);

    // The target row is not rendered yet. Wait for the virtualizer layout pass.
    if (!row) {
      await this._virtualizer?.layoutComplete;
      row = this.queryRowByIndex(node.row);
    }

    await row?.updateComplete;

    // A newer navigation replaced this one during the render wait.
    if (node !== this._active) {
      return;
    }

    this.#queryCell(node)?.focus({ preventScroll: true });
  }

  constructor(
    protected _state: StateController<T>,
    protected _dom: GridDOMController<T>
  ) {
    this._state.host.addController(this);
  }

  /** Activates `row` (clamped to the data range) and scrolls it into view. */
  #moveToRow(row: number) {
    const clamped = Math.min(Math.max(row, 0), this._state.host.totalItems - 1);

    this.active = Object.assign(this.nextNode, { row: clamped });
    this._virtualizer?.element(clamped)?.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Steps the active column by `offset`, clamping at the visible ends. A hidden
   * or missing key (index -1) lands on the first visible column.
   */
  #moveToColumn(offset: -1 | 1) {
    const next = this.nextNode;
    const columns = this._columns;

    const index = columns.findIndex((column) => column.field === next.column);
    const target = Math.min(Math.max(index + offset, 0), columns.length - 1);

    this.active = Object.assign(next, { column: columns[target].field });
    this.scrollToCell(this.active);
  }

  protected home() {
    this.#moveToRow(0);
  }

  protected end() {
    this.#moveToRow(this._state.host.totalItems - 1);
  }

  protected arrowDown() {
    this.#moveToRow(this.nextNode.row + 1);
  }

  protected arrowUp() {
    this.#moveToRow(this.nextNode.row - 1);
  }

  protected arrowLeft() {
    this.#moveToColumn(-1);
  }

  protected arrowRight() {
    this.#moveToColumn(1);
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
    handler.call(this);
    this.#focusActiveCell();
  }

  public async navigateTo(row: number, options?: NavigateToOptions<T>) {
    const { column, activate } = options ?? {};

    if (activate) {
      // Without an explicit column, activation keeps the one from `nextNode`.
      this.active = Object.assign(this.nextNode, column ? { row, column } : { row });
    }

    // Resolve the row in the DOM first. A missing row means a layout pass is necessary.
    let item: Pick<HTMLElement, 'scrollIntoView'> | undefined = this.queryRowByIndex(row);
    let completePromise: Promise<void> | undefined;

    if (!item) {
      item = this._virtualizer?.element(row);
      completePromise = item && this._virtualizer?.layoutComplete;
    }

    item?.scrollIntoView({ block: 'nearest' });
    await completePromise;

    if (column) {
      this.scrollToCell({ row, column });
    }
  }
}
