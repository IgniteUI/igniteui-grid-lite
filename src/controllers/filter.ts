import type { ReactiveController } from 'lit';
import type IgcFilterRow from '../components/filter-row.js';
import type { IgcFilteredEvent } from '../components/grid.js';
import { PIPELINE } from '../internal/constants.js';
import type { ColumnConfiguration, Keys } from '../internal/types.js';
import { asArray, getFilterOperandsFor, isString } from '../internal/utils.js';
import { FilterState } from '../operations/filter/state.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { StateController } from './state.js';

/** The kind of modification a `filtering` event describes. */
export type FilterEventType = 'add' | 'modify' | 'remove';

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

  #emitFilteringEvent(key: Keys<T>, expressions: FilterExpression<T>[], type: FilterEventType) {
    return this.host.emitEvent('filtering', {
      detail: { key, expressions, type },
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
    key !== undefined ? this.state.delete(key) : this.state.clear();
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
    const keys = Object.keys(operands) as (keyof typeof operands)[];

    // XXX: Types
    return {
      key: column.field,
      condition: operands[keys[0]],
      caseSensitive,
    } as unknown as FilterExpression<T>;
  }

  public async removeAllExpressions(key: Keys<T>) {
    const state = this.get(key)?.all ?? [];

    if (!this.#emitFilteringEvent(key, state, 'remove')) {
      return;
    }

    this.reset(key);
    this.#filter([]);

    await this.host._pipelineComplete;
    this.#emitFilteredEvent({ key, state: this.get(key)?.all ?? [] });
  }

  public async removeExpression(expression: FilterExpression<T>) {
    const state = this.get(expression.key);

    if (!this.#emitFilteringEvent(expression.key, [expression], 'remove')) {
      return;
    }

    state?.remove(expression);

    if (state?.empty) {
      this.reset(state.key);
    }

    this.#filter([]);

    await this.host._pipelineComplete;
    this.#emitFilteredEvent({ key: expression.key, state: state?.all ?? [] });
  }

  /**
   * Emits `filtering` for `expression` and, if it passes, applies it.
   *
   * @remarks
   * `target` is the state-held expression the change belongs to. Callers pass a candidate
   * copy as `expression` so that a canceled event leaves the stored state untouched; on
   * commit the candidate is folded back into `target`, preserving the object identity the
   * expression tree and the chip selection rely on.
   */
  public async filterWithEvent(
    expression: FilterExpression<T>,
    type: FilterEventType,
    target: FilterExpression<T> = expression
  ) {
    if (!this.#emitFilteringEvent(expression.key, [expression], type)) {
      return;
    }

    if (target !== expression) {
      Object.assign(target, expression);
    }

    this.#filter(target);

    await this.host._pipelineComplete;
    this.#emitFilteredEvent({ key: target.key, state: this.get(target.key)?.all ?? [] });
  }

  public filter(expression: FilterExpression<T> | FilterExpression<T>[]) {
    this.#filter(
      asArray(expression).map((expr) =>
        Object.assign(this.getDefaultExpression(this.host.getColumn(expr.key)!), expr)
      )
    );
  }

  /**
   * Stores expressions directly in the filter state without requiring column configuration.
   * Used when setting initial filter expressions before columns are available.
   */
  public setRaw(expressions: FilterExpression<T>[]) {
    for (const expr of expressions) {
      this.state.set(expr);
    }
  }

  /**
   * Resolves any string conditions in the current filter state using available column configuration.
   * Called after columns become available to finalize deferred expressions.
   */
  public resolveConditions() {
    for (const tree of this.state.values) {
      const column = this.host.getColumn(tree.key);
      if (!column) continue;
      const defaults = this.getDefaultExpression(column);
      for (const expr of tree.all) {
        if (isString(expr.condition)) {
          (expr as any).condition = (getFilterOperandsFor(column) as any)[expr.condition as string];
        }
        if (expr.caseSensitive === undefined) {
          expr.caseSensitive = defaults.caseSensitive;
        }
      }
    }
  }
}
