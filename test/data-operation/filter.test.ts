import { expect } from '@open-wc/testing';
import type { ColumnConfiguration, DataType, Keys } from '../../src/internal/types.js';
import { getFilterOperandsFor, resolveFieldValue } from '../../src/internal/utils.js';
import { FilterState } from '../../src/operations/filter/state.js';
import type { FilterExpression, OperandKeys } from '../../src/operations/filter/types.js';
import FilterDataOperation from '../../src/operations/filter.js';
import data from '../utils/test-data.js';

class TDDFilterState<T extends object> {
  #result: T[] = [];
  #operation: FilterDataOperation<T> = new FilterDataOperation();
  #state: FilterState<T> = new FilterState();

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

  public addCondition(
    key: Keys<T>,
    operand: OperandKeys<T[keyof T]>,
    opts: Partial<FilterExpression<T>> = {}
  ) {
    const config = {
      field: key,
      dataType: typeof resolveFieldValue(this.data[0], key) as DataType,
    } as ColumnConfiguration<T>;

    this.#state.set({
      key,
      condition: (getFilterOperandsFor(config) as any)[operand],
      ...opts,
    } as unknown as FilterExpression<T>);
    return this;
  }

  public clearState() {
    this.#state.clear();
  }

  public run() {
    this.#result = this.#operation.apply(structuredClone(this.data), this.#state);
  }
}

const TDD = new TDDFilterState(data);

describe('Filter operations', () => {
  beforeEach(() => {
    TDD.clearState();
  });

  describe('String operands', () => {
    it('`contains` [case insensitive]', () => {
      TDD.addCondition('name', 'contains', { searchTerm: 'd' }).run();
      expect(TDD.result).lengthOf(2);
    });

    it('`contains` [case sensitive]', () => {
      TDD.addCondition('name', 'contains', { searchTerm: 'd', caseSensitive: true }).run();
      expect(TDD.result).lengthOf(1);
    });

    it('`doesNotContain` [case insensitive]', () => {
      TDD.addCondition('name', 'doesNotContain', { searchTerm: 'a' }).run();
      expect(TDD.result).lengthOf(6);
    });

    it('`doesNotContain` [case sensitive]', () => {
      TDD.addCondition('name', 'doesNotContain', { searchTerm: 'a', caseSensitive: true }).run();
      expect(TDD.result).lengthOf(7);
    });

    it('`startsWith` [case insensitive]', () => {
      TDD.addCondition('importance', 'startsWith', { searchTerm: 'l' }).run();
      expect(TDD.result).lengthOf(3);
    });

    it('`startsWith` [case sensitive]', () => {
      TDD.addCondition('name', 'startsWith', { searchTerm: 'A', caseSensitive: true }).run();
      expect(TDD.result).lengthOf(1);
    });

    it('`endsWith` [case insensitive]', () => {
      TDD.addCondition('name', 'endsWith', { searchTerm: 'A' }).run();
      expect(TDD.result).lengthOf(2);
    });

    it('`endsWith` [case sensitive]', () => {
      TDD.addCondition('name', 'endsWith', { searchTerm: 'A', caseSensitive: true }).run();
      expect(TDD.result).lengthOf(1);
    });

    it('`equals` [case insensitive]', () => {
      TDD.addCondition('name', 'equals', { searchTerm: 'A' }).run();
      expect(TDD.result).lengthOf(2);
    });

    it('`equals` [case sensitive]', () => {
      TDD.addCondition('name', 'equals', { searchTerm: 'A', caseSensitive: true }).run();
      expect(TDD.result).lengthOf(1);
    });

    it('`doesNotEqual` [case insensitive]', () => {
      TDD.addCondition('name', 'doesNotEqual', { searchTerm: 'A' }).run();
      expect(TDD.result).lengthOf(6);
    });

    it('`doesNotEqual` [case sensitive]', () => {
      TDD.addCondition('name', 'doesNotEqual', { searchTerm: 'A', caseSensitive: true }).run();
      expect(TDD.result).lengthOf(7);
    });

    it('`empty`', () => {
      TDD.addCondition('name', 'empty').run();
      expect(TDD.result).empty;
    });

    it('`notEmpty`', () => {
      TDD.addCondition('name', 'notEmpty').run();
      expect(TDD.result).lengthOf(8);
    });
  });

  describe('Number operands', () => {
    it('`equals`', () => {
      TDD.addCondition('id', 'equals', { searchTerm: 1 }).run();
      expect(TDD.result).lengthOf(1);
    });

    it('`doesNotEqual`', () => {
      TDD.addCondition('id', 'doesNotEqual', { searchTerm: 1 }).run();
      expect(TDD.result).lengthOf(7);
    });

    it('`greaterThan`', () => {
      TDD.addCondition('id', 'greaterThan', { searchTerm: 1 }).run();
      expect(TDD.result).lengthOf(7);
    });

    it('`lessThan`', () => {
      TDD.addCondition('id', 'lessThan', { searchTerm: 8 }).run();
      expect(TDD.result).lengthOf(7);
    });

    it('`greaterThanOrEqual``', () => {
      TDD.addCondition('id', 'greaterThanOrEqual', { searchTerm: 1 }).run();
      expect(TDD.result).lengthOf(8);
    });

    it('`lessThanOrEqual`', () => {
      TDD.addCondition('id', 'lessThanOrEqual', { searchTerm: 8 }).run();
      expect(TDD.result).lengthOf(8);
    });

    it('`empty`', () => {
      TDD.addCondition('id', 'empty').run();
      expect(TDD.result).empty;
    });

    it('`notEmpty`', () => {
      TDD.addCondition('id', 'notEmpty').run();
      expect(TDD.result).lengthOf(8);
    });
  });

  describe('Boolean operands', () => {
    it('`all`', () => {
      TDD.addCondition('active', 'all').run();
      expect(TDD.result).lengthOf(8);
    });

    it('`true`', () => {
      TDD.addCondition('active', 'true').run();
      expect(TDD.result).lengthOf(4);
    });

    it('`false`', () => {
      TDD.addCondition('active', 'false').run();
      expect(TDD.result).lengthOf(4);
    });

    it('`empty`', () => {
      TDD.addCondition('active', 'empty').run();
      expect(TDD.result).empty;
    });

    it('`notEmpty`', () => {
      TDD.addCondition('active', 'notEmpty').run();
      expect(TDD.result).lengthOf(8);
    });
  });

  describe('Combinations', () => {
    it('Single field -> A && B', () => {
      TDD.addCondition('id', 'greaterThan', { searchTerm: 3 })
        .addCondition('id', 'lessThan', { searchTerm: 5 })
        .run();

      /**
       * [
       *  { id: 4, ... }
       * ]
       */
      expect(TDD.result).lengthOf(1);
      expect(TDD.first.id).to.equal(4);
    });

    it('Single field -> A || B', () => {
      TDD.addCondition('id', 'greaterThanOrEqual', { searchTerm: 8 })
        .addCondition('id', 'lessThan', { searchTerm: 2, criteria: 'or' })
        .run();

      /**
       * [
       *  { id: 1, ... },
       *  { id: 8, ... }
       * ]
       */
      expect(TDD.result).lengthOf(2);
      expect(TDD.first.id).to.equal(1);
      expect(TDD.last.id).to.equal(8);
    });

    it('Single field -> A && B || C', () => {
      TDD.addCondition('id', 'greaterThan', { searchTerm: 3 })
        .addCondition('id', 'lessThan', {
          searchTerm: 5,
        })
        .addCondition('id', 'greaterThanOrEqual', { searchTerm: 6, criteria: 'or' })
        .run();

      /**
       * [
       *  { id: 4, ... },
       *  { id: 6 ... },
       *  { id: 7 ... },
       *  { id: 8 ... }
       * ]
       */
      expect(TDD.result).lengthOf(4);
      expect(TDD.first.id).to.equal(4);
      expect(TDD.last.id).to.equal(8);
    });

    it('Multiple fields -> A && B', () => {
      TDD.addCondition('active', 'true')
        .addCondition('importance', 'equals', {
          searchTerm: 'high',
        })
        .run();

      /**
       * [
       *  { id: 5, name: 'a', active: true, importance: 'high' },
       *  { id: 8, name: 'd', active: true, importance: 'high' }
       * ]
       */
      expect(TDD.result).lengthOf(2);
      expect(TDD.first.active).to.equal(true);
      expect(TDD.first.importance).to.equal('high');
      expect(TDD.last.active).to.equal(true);
      expect(TDD.last.importance).to.equal('high');
    });
  });

  describe('Nested field operands', () => {
    it('`contains` on nested path [case insensitive]', () => {
      TDD.addCondition('address.city', 'contains', { searchTerm: 'new' }).run();
      // New York entries: id 1, 4, 7
      expect(TDD.result).lengthOf(3);
      expect(TDD.result.every((r) => r.address.city === 'New York')).to.be.true;
    });

    it('`equals` on nested path', () => {
      TDD.addCondition('address.city', 'equals', { searchTerm: 'Chicago' }).run();
      // Chicago entries: id 3, 5, 8
      expect(TDD.result).lengthOf(3);
      expect(TDD.result.every((r) => r.address.city === 'Chicago')).to.be.true;
    });

    it('`greaterThan` on nested number path', () => {
      TDD.addCondition('address.code', 'greaterThan', { searchTerm: 80000 }).run();
      // Codes > 80000: 90001, 90002
      expect(TDD.result).lengthOf(2);
      expect(TDD.result.every((r) => r.address.code > 80000)).to.be.true;
    });

    it('Multiple conditions with nested path', () => {
      TDD.addCondition('address.city', 'equals', { searchTerm: 'Chicago' })
        .addCondition('active', 'true')
        .run();

      // Chicago + active: id 3, 5, 8
      expect(TDD.result).lengthOf(3);
      expect(TDD.result.every((r) => r.address.city === 'Chicago' && r.active === true)).to.be.true;
    });
  });
});
