import type { ReactiveController } from 'lit';
import IgcGridLiteRow from '../components/row.js';
import { NAVIGATION_STATE, SENTINEL_NODE } from '../internal/constants.js';
import type { ActiveNode, GridHost, Keys } from '../internal/types.js';

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

  protected get virtualizer() {
    // @ts-expect-error - Protected member access
    return this.host.scrollContainer;
  }

  protected state = NAVIGATION_STATE;
  protected _active = SENTINEL_NODE;

  protected get nextNode() {
    const node = this.state.get('current')!;
    return node === SENTINEL_NODE
      ? { column: this.firstColumn, row: 0 }
      : ({ ...node } as ActiveNode<T>);
  }

  protected get columns() {
    return this.host.columns;
  }

  protected get firstColumn() {
    return this.host.getColumn(0)!.key ?? '';
  }

  protected getPreviousColumn(key: Keys<T>) {
    return this.columns[Math.max(this.columns.indexOf(this.host.getColumn(key)!) - 1, 0)].key;
  }

  protected getNextColumn(key: Keys<T>) {
    return this.columns[
      Math.min(this.columns.indexOf(this.host.getColumn(key)!) + 1, this.columns.length - 1)
    ].key;
  }

  protected scrollToCell(node: ActiveNode<T>) {
    const row = Array.from(this.virtualizer.querySelectorAll(IgcGridLiteRow.tagName)).find(
      (row) => row.index === node.row
    ) as unknown as IgcGridLiteRow<T>;

    if (row) {
      row.cells
        .find((cell) => cell.column.key === node.column)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }

  public get active() {
    return this._active as ActiveNode<T>;
  }

  public set active(node: ActiveNode<T>) {
    this._active = node;
    this.state.set('previous', this._active);
    this.state.set('current', node);
    this.host.requestUpdate();
  }

  constructor(protected host: GridHost<T>) {
    this.host.addController(this);
  }

  protected home() {
    this.active = Object.assign(this.nextNode, { row: 0 });
    this.virtualizer.element(this.active.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected end() {
    this.active = Object.assign(this.nextNode, { row: this.host.totalItems - 1 });
    this.virtualizer.element(this.active.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected arrowDown() {
    const next = this.nextNode;

    this.active = Object.assign(next, {
      row: Math.min(next.row + 1, this.host.totalItems - 1),
    });
    this.virtualizer.element(next.row)?.scrollIntoView({ block: 'nearest' });
  }

  protected arrowUp() {
    const next = this.nextNode;
    this.active = Object.assign(next, { row: Math.max(0, next.row - 1) });
    this.virtualizer.element(next.row)?.scrollIntoView({ block: 'nearest' });
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

  public hostConnected() {}

  public hostDisconnected() {
    this.active = SENTINEL_NODE as ActiveNode<T>;
    this.state = NAVIGATION_STATE;
  }

  public navigate(event: KeyboardEvent) {
    if (this.handlers.has(event.key)) {
      event.preventDefault();
      this.handlers.get(event.key)!.call(this);
    }
  }
}
