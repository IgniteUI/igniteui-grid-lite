import type { ReactiveController } from 'lit';
import { PIPELINE } from '../internal/constants.js';
import type {
  ColumnConfiguration,
  ColumnSortConfiguration,
  GridHost,
  Keys,
} from '../internal/types.js';
import { asArray } from '../internal/utils.js';
import type { SortExpression, SortingDirection, SortState } from '../operations/sort/types.js';

export class SortController<T extends object> implements ReactiveController {
  constructor(protected host: GridHost<T>) {
    this.host.addController(this);
  }

  public state: SortState<T> = new Map();

  get #isMultipleSort() {
    return this.host.sortingOptions.mode === 'multiple';
  }

  get #isTriStateSort() {
    return true;
  }

  #resolveSortOptions(options?: boolean | ColumnSortConfiguration<T>) {
    const expr: Pick<SortExpression<T>, 'caseSensitive' | 'comparer'> = {
      caseSensitive: false,
      comparer: undefined,
    };

    if (!options || typeof options === 'boolean') {
      return expr as Partial<SortExpression<T>>;
    }

    return Object.assign(expr, {
      caseSensitive: options.caseSensitive,
      comparer: options.comparer,
    }) as Partial<SortExpression<T>>;
  }

  #createDefaultExpression(key: Keys<T>) {
    const options = this.host.getColumn(key)?.sort;

    return {
      key,
      direction: 'ascending',
      ...this.#resolveSortOptions(options),
    } as SortExpression<T>;
  }

  #orderBy(dir?: SortingDirection): SortingDirection {
    return this.#isTriStateSort
      ? dir === 'ascending'
        ? 'descending'
        : dir === 'descending'
          ? 'none'
          : 'ascending'
      : dir === 'ascending'
        ? 'descending'
        : 'ascending';
  }

  #emitSortingEvent(detail: SortExpression<T>) {
    return this.host.emitEvent('sorting', { detail, cancelable: true });
  }

  #emitSortedEvent(detail: SortExpression<T>) {
    return this.host.emitEvent('sorted', { detail });
  }

  #setExpression(expression: SortExpression<T>) {
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

    await this.host.updateComplete;
    this.#emitSortedEvent(expression);
  }

  public prepareExpression({ key, sort: options }: ColumnConfiguration<T>): SortExpression<T> {
    if (this.state.has(key)) {
      const expr = this.state.get(key)!;

      return Object.assign(expr, {
        direction: this.#orderBy(expr.direction),
        ...this.#resolveSortOptions(options),
      });
    }

    // Initial state
    return this.#createDefaultExpression(key);
  }

  public reset(key?: Keys<T>) {
    key ? this.state.delete(key) : this.state.clear();
  }

  protected _sort(expressions: SortExpression<T> | SortExpression<T>[]) {
    for (const expr of asArray(expressions)) {
      this.#setExpression(expr);
    }

    this.host.requestUpdate(PIPELINE);
  }

  public sort(expressions: SortExpression<T> | SortExpression<T>[]) {
    this._sort(
      asArray(expressions).map((expr) =>
        Object.assign(this.state.get(expr.key) ?? this.#createDefaultExpression(expr.key), expr)
      )
    );
  }

  public hostConnected() {}
}
