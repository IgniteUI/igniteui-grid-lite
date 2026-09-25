import type IgcFilterRow from '../components/filter-row.js';
import type { IgcFilteredEvent, IgcFilteringEvent } from '../components/grid.js';
import { PIPELINE } from '../internal/constants.js';
import type { ColumnConfiguration, Keys } from '../internal/types.js';
import { asArray, getFilterOperandsFor, isString, resolveCondition } from '../internal/utils.js';
import { FilterState } from '../operations/filter/state.js';
import type { FilterExpression } from '../operations/filter/types.js';
import type { GridDOMController } from './dom.js';
import type { StateController } from './state.js';

type FilterEventType = IgcFilteringEvent<object>['type'];

export class FilterController<T extends object> {
  private readonly _stateController: StateController<T>;
  private readonly _dom: GridDOMController<T>;

  constructor(state: StateController<T>, dom: GridDOMController<T>) {
    this._stateController = state;
    this._dom = dom;
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

  #emitFilteredEvent(detail: IgcFilteredEvent<T>) {
    return this.host.emitEvent('filtered', { detail });
  }

  #filter(expression: FilterExpression<T> | FilterExpression<T>[]) {
    for (const expr of asArray(expression)) {
      this.state.set(expr);
    }

    // HACK: a large scrollTop plus a heavy filter broke the scroll position. Reset it.
    this._dom.resetScrollPosition();
    this._stateController.updateObservers();
    this.host.requestUpdate(PIPELINE);
  }

  public get(key: Keys<T>) {
    return this.state.get(key);
  }

  public reset(key?: Keys<T>) {
    if (key === undefined) {
      this.state.clear();
    } else {
      this.state.delete(key);
    }

    // The filter row renders its chips from this state.
    this._stateController.updateObservers();
  }

  public setActiveColumn(column?: ColumnConfiguration<T>) {
    const filterRow = this.filterRow;

    if (!(column?.filterable && filterRow?.active)) {
      return;
    }

    filterRow.column = column;
    filterRow.expression = this.getDefaultExpression(column);

    // The header row marks the filtered column.
    this._stateController.updateObservers();
  }

  public getDefaultExpression(column: ColumnConfiguration<T>) {
    return {
      key: column.field,
      condition: Object.values(getFilterOperandsFor(column))[0],
      caseSensitive: Boolean(column.filteringCaseSensitive),
    } as unknown as FilterExpression<T>;
  }

  /** Emits `filtering`. If not canceled: commits, awaits the pipeline, emits `filtered`. */
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
   * Emits `filtering` for `expression` and, if not canceled, applies it.
   *
   * @remarks
   * `expression` is a candidate copy of the stored `target`, so a canceled event
   * leaves `target` untouched. On commit it merges into `target`, keeping the
   * identity the expression tree and the chip selection use.
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

  /** Stores copies before columns exist. `resolveConditions` rewrites them later. */
  public setRaw(expressions: FilterExpression<T>[]) {
    for (const expr of expressions) {
      this.state.set({ ...expr });
    }
  }

  /** Resolves string conditions and default case sensitivity once columns exist. */
  public resolveConditions() {
    for (const tree of this.state.values) {
      const column = this.host.getColumn(tree.key);

      if (!column) {
        continue;
      }

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
