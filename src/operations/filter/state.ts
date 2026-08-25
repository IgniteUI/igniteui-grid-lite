import type { Keys } from '../../internal/types.js';
import { FilterExpressionTree } from './tree.js';
import type { FilterExpression } from './types.js';

export class FilterState<T> {
  protected state: Map<Keys<T>, FilterExpressionTree<T>> = new Map();

  public get empty() {
    return this.state.size < 1;
  }

  public get values() {
    return Array.from(this.state.values());
  }

  public has(key: Keys<T>) {
    return this.state.has(key);
  }

  public get(key: Keys<T>) {
    return this.state.get(key);
  }

  public delete(key: Keys<T>) {
    return this.state.delete(key);
  }

  public clear() {
    this.state.clear();
  }

  public set(expression: FilterExpression<T>) {
    const tree = this.state.get(expression.key) ?? new FilterExpressionTree<T>(expression.key);
    this.state.set(expression.key, tree.add(expression));
  }
}
