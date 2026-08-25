import type { ReactiveController } from 'lit';
import type IgcFilterRow from '../components/filter-row.js';
import type { IgcFilteredEvent } from '../components/grid.js';
import { PIPELINE } from '../internal/constants.js';
import type { ColumnConfiguration, Keys } from '../internal/types.js';
import { asArray, getFilterOperandsFor, isString, resolveCondition } from '../internal/utils.js';
import { FilterState } from '../operations/filter/state.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { GridDOMController } from './dom.js';
import type { StateController } from './state.js';

/** The kind of modification a `filtering` event describes. */
export type FilterEventType = 'add' | 'modify' | 'remove';

export class FilterController<T extends object> implements ReactiveController {
  private readonly _stateController: StateController<T>;
  private readonly _dom: GridDOMController<T>;

  constructor(state: StateController<T>, dom: GridDOMController<T>) {
    this._stateController = state;
    this._dom = dom;
    this._stateController.host.addController(this);
  }

  public state: FilterState<T> = new FilterState();

  public get host() {
    return this._stateController.host;
  }

  public get filterRow(): IgcFilterRow<T> | null {
    return this._dom.filterRow;
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
    this._dom.resetScrollPosition();
    this._stateController.updateObservers();
    this.host.requestUpdate(PIPELINE);
  }

  public hostConnected() {}

  public get(key: Keys<T>) {
    return this.state.get(key);
  }

  public reset(key?: Keys<T>) {
    key !== undefined ? this.state.delete(key) : this.state.clear();

    // The filter row renders its chips from this state.
    this._stateController.updateObservers();
  }

  public setActiveColumn(column?: ColumnConfiguration<T>) {
    if (column?.filterable && this.filterRow?.active) {
      this.filterRow.column = column;
      this.filterRow.expression = this.getDefaultExpression(column);

      // The header row marks the filtered column.
      this._stateController.updateObservers();
    }
  }

  public getDefaultExpression(column: ColumnConfiguration<T>) {
    // XXX: Types
    return {
      key: column.field,
      condition: Object.values(getFilterOperandsFor(column))[0],
      caseSensitive: Boolean(column.filteringCaseSensitive),
    } as unknown as FilterExpression<T>;
  }

  /**
   * Emits `filtering` and, if it passes, runs `commit`, waits for the pipeline
   * and emits `filtered` with the resulting state of the column.
   */
  async #applyWithEvents(
    key: Keys<T>,
    expressions: FilterExpression<T>[],
    type: FilterEventType,
    commit: () => void
  ) {
    if (!this.#emitFilteringEvent(key, expressions, type)) {
      return;
    }

    commit();

    await this.host._pipelineComplete;
    this.#emitFilteredEvent({ key, state: this.get(key)?.all ?? [] });
  }

  public async removeAllExpressions(key: Keys<T>) {
    await this.#applyWithEvents(key, this.get(key)?.all ?? [], 'remove', () => {
      this.reset(key);
      this.#filter([]);
    });
  }

  public async removeExpression(expression: FilterExpression<T>) {
    const state = this.get(expression.key);

    await this.#applyWithEvents(expression.key, [expression], 'remove', () => {
      state?.remove(expression);

      if (state?.empty) {
        this.reset(state.key);
      }

      this.#filter([]);
    });
  }

  /**
   * Emits `filtering` for `expression` and, if it passes, applies it.
   *
   * @remarks
   * `target` is the stored expression the change applies to. Callers pass a
   * candidate copy as `expression`, so a canceled event does not touch the stored
   * state. On commit the candidate is merged back into `target`. This keeps the
   * object identity that the expression tree and the chip selection use.
   */
  public async filterWithEvent(
    expression: FilterExpression<T>,
    type: FilterEventType,
    target: FilterExpression<T> = expression
  ) {
    await this.#applyWithEvents(expression.key, [expression], type, () => {
      if (target !== expression) {
        Object.assign(target, expression);
      }

      this.#filter(target);
    });
  }

  public filter(expression: FilterExpression<T> | FilterExpression<T>[]) {
    this.#filter(
      asArray(expression).map((expr) =>
        Object.assign(this.getDefaultExpression(this.host.getColumn(expr.key)!), expr)
      )
    );
  }

  /**
   * Stores expressions in the filter state without requiring column configuration.
   * Used when setting initial filter expressions before columns are available.
   *
   * @remarks
   * Copies are stored. `resolveConditions` later rewrites each stored expression,
   * and those writes must not reach the caller's objects.
   */
  public setRaw(expressions: FilterExpression<T>[]) {
    for (const expr of expressions) {
      this.state.set({ ...expr });
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
          (expr as any).condition = resolveCondition(column, expr.condition);
        }
        if (expr.caseSensitive === undefined) {
          expr.caseSensitive = defaults.caseSensitive;
        }
      }
    }
  }
}
