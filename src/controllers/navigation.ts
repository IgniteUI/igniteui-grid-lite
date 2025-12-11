import type { ReactiveController } from 'lit';
import type IgcGridLiteRow from '../components/row.js';
import { NAVIGATION_STATE, SENTINEL_NODE } from '../internal/constants.js';
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

  protected _navigationState = NAVIGATION_STATE;
  protected _active = SENTINEL_NODE;

  protected get nextNode() {
    const node = this._navigationState.get('current')!;
    return node === SENTINEL_NODE
      ? { column: this._firstColumn, row: 0 }
      : ({ ...node } as ActiveNode<T>);
  }

  protected get _columns() {
    return this._state.columns;
  }

  protected get _firstColumn() {
    return this._state.host.getColumn(0)!.field ?? '';
  }

  protected getPreviousColumn(key: Keys<T>) {
    return this._columns[Math.max(this._columns.indexOf(this._state.host.getColumn(key)!) - 1, 0)]
      .field;
  }

  protected getNextColumn(key: Keys<T>) {
    return this._columns[
      Math.min(
        this._columns.indexOf(this._state.host.getColumn(key)!) + 1,
        this._columns.length - 1
      )
    ].field;
  }

  protected scrollToCell(node: ActiveNode<T>) {
    const row = Array.from(this._virtualizer?.querySelectorAll(GRID_ROW_TAG) ?? []).find(
      (row) => row.index === node.row
    ) as unknown as IgcGridLiteRow<T>;

    if (row) {
      row.cells
        .find((cell) => cell.column.field === node.column)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }

  public get active(): ActiveNode<T> {
    return this._active as ActiveNode<T>;
  }

  public set active(node: ActiveNode<T>) {
    this._active = node ?? SENTINEL_NODE;
    this._navigationState.set('previous', this._active);
    this._navigationState.set('current', node);
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
    this._navigationState = NAVIGATION_STATE;
  }

  public navigate(event: KeyboardEvent) {
    if (this.handlers.has(event.key)) {
      event.preventDefault();
      this.handlers.get(event.key)!.call(this);
    }
  }
}
