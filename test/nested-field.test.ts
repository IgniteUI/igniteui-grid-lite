import { expect } from '@open-wc/testing';
import type { ColumnConfiguration } from '../src/internal/types.js';
import { resolveFieldValue } from '../src/internal/utils.js';
import GridTestFixture from './utils/grid-fixture.js';

interface NestedTestData {
  id: number;
  user: {
    name: string;
    address: {
      city: string;
      zip: string;
    };
  };
  active: boolean;
}

const nestedData: NestedTestData[] = [
  { id: 1, user: { name: 'Alice', address: { city: 'New York', zip: '10001' } }, active: true },
  { id: 2, user: { name: 'Bob', address: { city: 'Los Angeles', zip: '90001' } }, active: false },
  { id: 3, user: { name: 'Charlie', address: { city: 'Chicago', zip: '60601' } }, active: true },
];

describe('Nested field support', () => {
  describe('resolveFieldValue utility', () => {
    const testObj = nestedData[0];

    it('should resolve simple properties', () => {
      expect(resolveFieldValue(testObj, 'id')).to.equal(1);
      expect(resolveFieldValue(testObj, 'active')).to.equal(true);
    });

    it('should resolve single-level nested properties', () => {
      expect(resolveFieldValue(testObj, 'user.name')).to.equal('Alice');
    });

    it('should resolve deeply nested properties', () => {
      expect(resolveFieldValue(testObj, 'user.address.city')).to.equal('New York');
      expect(resolveFieldValue(testObj, 'user.address.zip')).to.equal('10001');
    });

    it('should return undefined for non-existent paths', () => {
      // @ts-expect-error
      expect(resolveFieldValue(testObj, 'nonexistent')).to.be.undefined;
      // @ts-expect-error
      expect(resolveFieldValue(testObj, 'user.nonexistent')).to.be.undefined;
      // @ts-expect-error
      expect(resolveFieldValue(testObj, 'user.address.nonexistent')).to.be.undefined;
    });

    it('should handle undefined intermediate values safely', () => {
      const partialObj = { id: 1, user: undefined } as unknown as NestedTestData;
      expect(resolveFieldValue(partialObj, 'user.name')).to.be.undefined;
    });

    it('should handle null intermediate values safely', () => {
      const partialObj = { id: 1, user: null } as unknown as NestedTestData;
      expect(resolveFieldValue(partialObj, 'user.name')).to.be.undefined;
    });
  });

  describe('Grid rendering with nested fields', () => {
    class NestedFieldFixture extends GridTestFixture<NestedTestData> {
      constructor() {
        super(nestedData, { width: '800px', height: '400px' });
      }

      public override updateConfig() {
        this.columnConfig = [
          { field: 'id' as keyof NestedTestData },
          { field: 'user.name' as keyof NestedTestData, header: 'User Name' },
          { field: 'user.address.city' as keyof NestedTestData, header: 'City' },
        ] as ColumnConfiguration<NestedTestData>[];
      }
    }

    const TDD = new NestedFieldFixture();

    beforeEach(async () => await TDD.setUp());
    afterEach(() => TDD.tearDown());

    it('should render nested field values in cells', async () => {
      const firstRowCells = TDD.rows.first.cells;
      const secondRowCells = TDD.rows.get(1).cells;

      expect(firstRowCells.get(0).value).to.equal(1);
      expect(firstRowCells.get(1).value).to.equal('Alice');
      expect(firstRowCells.get(2).value).to.equal('New York');

      expect(secondRowCells.get(0).value).to.equal(2);
      expect(secondRowCells.get(1).value).to.equal('Bob');
      expect(secondRowCells.get(2).value).to.equal('Los Angeles');
    });
  });
});
