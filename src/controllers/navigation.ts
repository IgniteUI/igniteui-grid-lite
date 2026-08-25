import type { ReactiveController } from 'lit';
import type IgcGridLiteRow from '../components/row.js';
import { SENTINEL_NODE } from '../internal/constants.js';
import { GRID_ROW_TAG } from '../internal/tags.js';
import type { ActiveNode, Keys } from '../internal/types.js';
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
    return this._state.virtualizer;
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

  // Both lookups clamp at the ends; a hidden or missing key (index -1) lands on the
  // first visible column.
  protected getPreviousColumn(key: Keys<T>) {
    const columns = this._columns;
    const index = columns.findIndex((column) => column.field === key);

    return columns[Math.max(index - 1, 0)].field;
  }

  protected getNextColumn(key: Keys<T>) {
    const columns = this._columns;
    const index = columns.findIndex((column) => column.field === key);

    return columns[Math.min(index + 1, columns.length - 1)].field;
  }

  protected queryRowByIndex(index: number) {
    return Array.from(this._virtualizer?.querySelectorAll(GRID_ROW_TAG) ?? []).find(
      (row) => row.index === index
    ) as unknown as IgcGridLiteRow<T>;
  }

  protected scrollToCell(node: ActiveNode<T>) {
    const row = this.queryRowByIndex(node.row);

    if (row) {
      row.cells
        .find((cell) => cell.column.field === node.column)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }

  public get active(): ActiveNode<T> {
    return this._active;
  }

  public set active(node: ActiveNode<T>) {
    this._active = node ?? SENTINEL_NODE;
    this._state.host.requestUpdate();
  }

  constructor(protected _state: StateController<T>) {
    this._state.host.addController(this);
  }

  protected home() {
    this.active = Object.assign(this.nextNode, { row: 0 });
    this._virtualizer?.element(this.active.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected end() {
    this.active = Object.assign(this.nextNode, { row: this._state.host.totalItems - 1 });
    this._virtualizer?.element(this.active.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected arrowDown() {
    const next = this.nextNode;

    this.active = Object.assign(next, {
      row: Math.min(next.row + 1, this._state.host.totalItems - 1),
    });
    this._virtualizer?.element(next.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected arrowUp() {
    const next = this.nextNode;
    this.active = Object.assign(next, { row: Math.max(0, next.row - 1) });
    this._virtualizer?.element(next.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected arrowLeft() {
    const next = this.nextNode;
    this.active = Object.assign(next, { column: this.getPreviousColumn(next.column) });
    this.scrollToCell(this.active);
  }

  protected arrowRight() {
    const next = this.nextNode;
    this.active = Object.assign(next, { column: this.getNextColumn(next.column) });
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
    handler.call(this);
  }

  public async navigateTo(row: number, column?: Keys<T>, activate = false) {
    if (activate) this.active = Object.assign(this.nextNode, { row, column });

    // attempt to resolve row in DOM first as a check if layout change will be needed
    let item: Pick<HTMLElement, 'scrollIntoView'> | undefined = this.queryRowByIndex(row);
    let completePromise: Promise<void> | undefined;

    if (!item) {
      item = this._virtualizer?.element(row);
      completePromise = item && this._virtualizer?.layoutComplete;
    }

    item?.scrollIntoView({ block: 'nearest' });
    await completePromise;
    if (column) this.scrollToCell({ row, column });
  }
}
