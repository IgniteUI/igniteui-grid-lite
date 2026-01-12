import { expect } from '@open-wc/testing';
import type { Keys } from '../../src/internal/types.js';
import type { SortingExpression, SortState } from '../../src/operations/sort/types.js';
import SortDataOperation from '../../src/operations/sort.js';
import data, { importanceComparer } from '../utils/test-data.js';

class TDDSortState<T extends object> {
  #result: T[] = [];
  #operation: SortDataOperation<T> = new SortDataOperation();
  #state: SortState<T> = new Map();

  constructor(protected data: T[]) {}

  public get result() {
    return this.#result;
  }

  public get first() {
    return this.at(0);
  }

  public get last() {
    return this.at(-1);
  }

  public at(index: number) {
    return this.result.at(index) as T;
  }

  public run() {
    this.#result = this.#operation.apply(structuredClone(this.data), this.#state);
  }

  public setState(state: Partial<SortingExpression<T>>) {
    this.#state.set(state.key!, {
      ...{ direction: 'ascending', caseSensitive: false },
      ...state,
    } as SortingExpression<T>);
    return this;
  }

  public clearState(key?: Keys<T>) {
    key ? this.#state.delete(key) : this.#state.clear();
    return this;
  }
}

const TDD = new TDDSortState(data);

describe('Sort operations', () => {
  beforeEach(() => {
    TDD.clearState();
  });

  describe('Default sort', () => {
    it('type: number', () => {
      TDD.setState({ key: 'id', direction: 'descending' }).run();

      expect(TDD.first.id).to.equal(8);
      expect(TDD.last.id).to.equal(1);

      TDD.setState({ key: 'id' }).run();

      expect(TDD.first.id).to.equal(1);
      expect(TDD.last.id).to.equal(8);
    });

    it('type: string [case insensitive]', () => {
      TDD.setState({ key: 'name', direction: 'descending' }).run();

      expect(TDD.first.name).to.equal('D');
      expect(TDD.last.name).to.equal('a');

      TDD.setState({ key: 'name' }).run();

      expect(TDD.first.name).to.equal('A');
      expect(TDD.last.name).to.equal('d');
    });

    it('type: string [case sensitive]', () => {
      TDD.setState({ key: 'name', direction: 'descending', caseSensitive: true }).run();

      expect(TDD.first.name).to.equal('D');
      expect(TDD.last.name).to.equal('a');

      TDD.setState({ key: 'name', caseSensitive: true }).run();

      expect(TDD.first.name).to.equal('a');
      expect(TDD.last.name).to.equal('D');
    });

    it('type: boolean', () => {
      TDD.setState({ key: 'active', direction: 'descending' }).run();

      expect(TDD.first.active).to.be.true;
      expect(TDD.last.active).to.be.false;

      TDD.setState({ key: 'active' }).run();

      expect(TDD.first.active).to.be.false;
      expect(TDD.last.active).to.be.true;
    });
  });

  describe('Multiples sort', () => {
    it('Default', () => {
      // [
      //   { id: 1, name: 'A', active: false },
      //   { id: 2, name: 'B', active: false },
      //   { id: 4, name: 'D', active: false },
      //   { id: 6, name: 'b', active: false },
      //   ....
      // ]
      TDD.setState({ key: 'active' }).setState({ key: 'id' }).run();
      expect(TDD.first.active).to.equal(false);
      expect(TDD.first.id).to.equal(1);

      // [
      //   { id: 6, name: 'b', active: false },
      //   { id: 4, name: 'D', active: false },
      //   { id: 2, name: 'B', active: false },
      //   { id: 1, name: 'A', active: false },
      //   ...
      // ]
      TDD.setState({ key: 'id', direction: 'descending' }).run();
      expect(TDD.first.active).to.equal(false);
      expect(TDD.first.id).to.equal(6);

      // [
      //   { id: 8, name: 'd', active: true },
      //   { id: 7, name: 'c', active: true },
      //   { id: 5, name: 'a', active: true },
      //   { id: 3, name: 'C', active: true },
      //   ...
      // ]
      TDD.setState({ key: 'active', direction: 'descending' }).run();
      expect(TDD.first.active).to.equal(true);
      expect(TDD.first.id).to.equal(8);

      // [
      //   { id: 3, name: 'C', active: true },
      //   { id: 5, name: 'a', active: true },
      //   { id: 7, name: 'c', active: true },
      //   { id: 8, name: 'd', active: true },
      //   ...
      // ]
      TDD.setState({ key: 'id' }).run();
      expect(TDD.first.active).to.equal(true);
      expect(TDD.first.id).to.equal(3);
    });
  });

  describe('Custom comparer', () => {
    it('Default', () => {
      // [
      //   { id: 5, name: 'a', active: true, importance: 'high' },
      //   { id: 8, name: 'd', active: true, importance: 'high' },
      //   { id: 1, name: 'A', active: false, importance: 'medium' },
      //   { id: 3, name: 'C', active: true, importance: 'medium' },
      //   ...
      // ]
      TDD.setState({
        key: 'importance',
        comparer: importanceComparer,
        direction: 'descending',
      }).run();

      expect(TDD.first.importance).to.equal('high');
      expect(TDD.last.importance).to.equal('low');
    });

    // [
    //   { id: 2, name: 'B', active: false, importance: 'low' },
    //   { id: 4, name: 'D', active: false, importance: 'low' },
    //   { id: 7, name: 'c', active: true, importance: 'low' },
    //   { id: 1, name: 'A', active: false, importance: 'medium' },
    //   ...
    // ]
    TDD.setState({ key: 'importance', comparer: importanceComparer }).run();
    expect(TDD.first.importance).to.equal('low');
    expect(TDD.last.importance).to.equal('high');
  });

  describe('Nested field sort', () => {
    it('type: string [nested path]', () => {
      TDD.setState({ key: 'address.city', direction: 'ascending' }).run();

      expect(TDD.first.address.city).to.equal('Chicago');
      expect(TDD.last.address.city).to.equal('New York');

      TDD.setState({ key: 'address.city', direction: 'descending' }).run();

      expect(TDD.first.address.city).to.equal('New York');
      expect(TDD.last.address.city).to.equal('Chicago');
    });

    it('type: number [nested path]', () => {
      TDD.setState({ key: 'address.code', direction: 'ascending' }).run();

      expect(TDD.first.address.code).to.equal(10001);

      TDD.setState({ key: 'address.code', direction: 'descending' }).run();

      expect(TDD.first.address.code).to.equal(90002);
    });
  });
});
