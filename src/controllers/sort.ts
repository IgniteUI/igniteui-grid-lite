import type { ReactiveController } from 'lit';
import { PIPELINE } from '../internal/constants.js';
import type { ColumnConfiguration, GridHost, Keys } from '../internal/types.js';
import { asArray } from '../internal/utils.js';
import type { SortingDirection, SortingExpression, SortState } from '../operations/sort/types.js';

export class SortController<T extends object> implements ReactiveController {
  constructor(protected host: GridHost<T>) {
    this.host.addController(this);
  }

  public state: SortState<T> = new Map();

  get #isMultipleSort() {
    return this.host.sortingOptions.mode === 'multiple';
  }

  #resolveSortOptions(column?: ColumnConfiguration<T>) {
    const expr: Pick<SortingExpression<T>, 'caseSensitive' | 'comparer'> = {
      caseSensitive: false,
      comparer: undefined,
    };

    if (!column) {
      return expr as Partial<SortingExpression<T>>;
    }

    return Object.assign(expr, {
      caseSensitive: column.sortingCaseSensitive,
      comparer: column.sortConfiguration?.comparer,
    }) as Partial<SortingExpression<T>>;
  }

  #createDefaultExpression(key: Keys<T>) {
    const column = this.host.getColumn(key);

    return {
      key,
      direction: 'ascending',
      ...this.#resolveSortOptions(column),
    } as SortingExpression<T>;
  }

  /** Tri-state cycle: ascending -> descending -> none. */
  #orderBy(dir?: SortingDirection): SortingDirection {
    if (dir === 'ascending') {
      return 'descending';
    }

    if (dir === 'descending') {
      return 'none';
    }

    return 'ascending';
  }

  #emitSortingEvent(detail: SortingExpression<T>) {
    return this.host.emitEvent('sorting', { detail, cancelable: true });
  }

  #emitSortedEvent(detail: SortingExpression<T>) {
    return this.host.emitEvent('sorted', { detail });
  }

  #setExpression(expression: SortingExpression<T>) {
    expression.direction === 'none'
      ? this.reset(expression.key)
      : this.state.set(expression.key, { ...expression });
  }

  public async sortFromHeaderClick(column: ColumnConfiguration<T>) {
    const expression = this.prepareExpression(column);

    if (!this.#emitSortingEvent(expression)) {
      return;
    }

    if (!this.#isMultipleSort) {
      this.reset();
    }

    this._sort(expression);

    await this.host._pipelineComplete;
    this.#emitSortedEvent(expression);
  }

  /**
   * Returns the expression the next sort operation would apply for `column`.
   *
   * @remarks
   * The result is a candidate copy - the stored state is only updated once the
   * operation is committed through {@link SortController._sort}.
   */
  public prepareExpression(column: ColumnConfiguration<T>): SortingExpression<T> {
    if (this.state.has(column.field)) {
      const expr = this.state.get(column.field)!;

      return {
        ...expr,
        direction: this.#orderBy(expr.direction),
        ...this.#resolveSortOptions(column),
      };
    }

    // Initial state
    return this.#createDefaultExpression(column.field);
  }

  public reset(key?: Keys<T>) {
    key !== undefined ? this.state.delete(key) : this.state.clear();
  }

  protected _sort(expressions: SortingExpression<T> | SortingExpression<T>[]) {
    for (const expr of asArray(expressions)) {
      this.#setExpression(expr);
    }

    this.host.requestUpdate(PIPELINE);
  }

  public sort(expressions: SortingExpression<T> | SortingExpression<T>[]) {
    this._sort(
      asArray(expressions).map((expr) =>
        Object.assign(this.state.get(expr.key) ?? this.#createDefaultExpression(expr.key), expr)
      )
    );
  }

  public hostConnected() {}
}
