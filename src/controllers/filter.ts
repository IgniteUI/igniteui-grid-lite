import type { ReactiveController } from 'lit';
import type IgcFilterRow from '../components/filter-row.js';
import type { IgcFilteredEvent } from '../components/grid.js';
import { PIPELINE } from '../internal/constants.js';
import type { ColumnConfiguration, Keys } from '../internal/types.js';
import { asArray, getFilterOperandsFor } from '../internal/utils.js';
import { FilterState } from '../operations/filter/state.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { StateController } from './state.js';

export class FilterController<T extends object> implements ReactiveController {
  private readonly _stateController: StateController<T>;

  constructor(state: StateController<T>) {
    this._stateController = state;
    this._stateController.host.addController(this);
  }

  public state: FilterState<T> = new FilterState();

  public get host() {
    return this._stateController.host;
  }

  public get filterRow(): IgcFilterRow<T> | null {
    return this._stateController.filterRow;
  }

  get #virtualizer() {
    return this._stateController.virtualizer;
  }

  #emitFilteringEvent(expression: FilterExpression<T>, type: 'add' | 'modify' | 'remove') {
    return this.host.emitEvent('filtering', {
      detail: {
        key: expression.key,
        expressions: [expression],
        type,
      },
      cancelable: true,
    });
  }

  #emitFilteredEvent(detail?: IgcFilteredEvent<T>) {
    return this.host.emitEvent('filtered', { detail });
  }

  #filter(expression: FilterExpression<T> | FilterExpression<T>[]) {
    for (const expr of asArray(expression)) {
      this.state.set(expr);
    }

    // HACK: In the case where the scrollTop is a large and amount and a big chunk of data is filtered out
    // HACK: the virtualizer can't recalculate its scroll position correctly. Thus, we reset the scrollTop state.
    this.#virtualizer?.scrollTo({ top: 0 });
    this.host.requestUpdate(PIPELINE);
  }

  public hostConnected() {}

  public hostUpdate(): void {
    this.filterRow?.requestUpdate();
  }

  public get(key: Keys<T>) {
    return this.state.get(key);
  }

  public reset(key?: Keys<T>) {
    key ? this.state.delete(key) : this.state.clear();
  }

  public setActiveColumn(column?: ColumnConfiguration<T>) {
    if (column?.filterable && this.filterRow?.active) {
      this.filterRow.column = column;
      this.filterRow.expression = this.getDefaultExpression(column);
      this.host.requestUpdate();
    }
  }

  public getDefaultExpression(column: ColumnConfiguration<T>) {
    const caseSensitive = Boolean(column.filteringCaseSensitive);
    const operands = getFilterOperandsFor(column);
    const keys = Object.keys(operands) as Keys<typeof operands>[];

    // XXX: Types
    return {
      key: column.key,
      condition: operands[keys[0]],
      caseSensitive,
    } as unknown as FilterExpression<T>;
  }

  public async removeAllExpressions(key: Keys<T>) {
    const state = this.get(key)?.all ?? [];

    if (
      !this.host.emitEvent('filtering', {
        detail: {
          key,
          expressions: state,
          type: 'remove',
        },
        cancelable: true,
      })
    ) {
      return;
    }

    this.reset(key);
    this.#filter([]);

    await this.host.updateComplete;
    this.#emitFilteredEvent({ key, state: this.get(key)?.all ?? [] });
  }

  public async removeExpression(expression: FilterExpression<T>) {
    const state = this.get(expression.key);

    if (!this.#emitFilteringEvent(expression, 'remove')) {
      return;
    }

    state?.remove(expression);

    if (state?.empty) {
      this.reset(state.key);
    }

    this.#filter([]);

    await this.host.updateComplete;
    this.#emitFilteredEvent({ key: expression.key, state: state?.all ?? [] });
  }

  public async filterWithEvent(expression: FilterExpression<T>, type: 'add' | 'modify' | 'remove') {
    if (!this.#emitFilteringEvent(expression, type)) {
      return;
    }

    this.#filter(expression);

    await this.host.updateComplete;
    this.#emitFilteredEvent({ key: expression.key, state: this.get(expression.key)?.all ?? [] });
  }

  public filter(expression: FilterExpression<T> | FilterExpression<T>[]) {
    this.#filter(
      asArray(expression).map((expr) =>
        Object.assign(this.getDefaultExpression(this.host.getColumn(expr.key)!), expr)
      )
    );
  }
}
