import { expect, html } from '@open-wc/testing';
import type { FilterExpression } from '../src/operations/filter/types.js';
import type { SortingExpression } from '../src/operations/sort/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import testData from './utils/test-data.js';
import data, { type TestData } from './utils/test-data.js';

class InitialDataStateFixture<T extends TestData> extends GridTestFixture<T> {
  public sortState: SortingExpression<TestData>[] = [
    { key: 'active', direction: 'descending' },
    { key: 'id', direction: 'descending' },
  ];
  public filterState: FilterExpression<TestData>[] = [
    { key: 'importance', condition: 'equals', searchTerm: 'low' },
    { key: 'importance', condition: 'equals', searchTerm: 'high', criteria: 'or' },
  ];

  public override setupTemplate() {
    return html`
      <igc-grid-lite
        .data=${this.data}
        .sortingExpressions=${this.sortState}
        .filterExpressions=${this.filterState}
      >
        ${this.columnConfig.map(
          (col) =>
            html`<igc-grid-lite-column
              .field=${col.field}
              ?filterable=${col.filterable}
              ?sortable=${col.sortable}
              .width=${col.width}
              .header=${col.header}
              .cellTemplate=${col.cellTemplate}
              .headerTemplate=${col.headerTemplate}
              .dataType=${col.dataType}
              ?resizable=${col.resizable}
              ?hidden=${col.hidden}
            ></igc-grid-lite-column>`
        )}
      </igc-grid-lite>
    `;
  }
}

class AutoGenerateFixture<T extends TestData> extends GridTestFixture<T> {
  public override setupTemplate() {
    return html`
      <igc-grid-lite
        auto-generate
        .data=${this.data}
      ></igc-grid-lite>
    `;
  }
}

const TDD = new GridTestFixture(data);
const dataStateTDD = new InitialDataStateFixture(data);
const autoGenerateTDD = new AutoGenerateFixture(data);

describe('Grid auto-generate column configuration', () => {
  const keys = new Set(Object.keys(testData[0]));
  beforeEach(async () => await autoGenerateTDD.setUp());
  afterEach(() => autoGenerateTDD.tearDown());

  it('Default', async () => {
    for (const { field } of autoGenerateTDD.grid.columns) {
      expect(keys.has(field)).to.be.true;
    }

    expect(autoGenerateTDD.grid.rows).lengthOf(testData.length);
  });
});

describe('Grid properties (initial bindings)', () => {
  beforeEach(async () => await dataStateTDD.setUp());
  afterEach(() => dataStateTDD.tearDown());

  it('Initial data state applied', async () => {
    expect(dataStateTDD.rows.first.data.id).to.equal(8);
    expect(dataStateTDD.rows.last.data.id).to.equal(2);

    expect(dataStateTDD.rows.first.data.active).to.equal(true);
    expect(dataStateTDD.rows.last.data.active).to.equal(false);

    const importanceValues = new Set(['low', 'high']);

    for (const row of dataStateTDD.grid.rows) {
      expect(importanceValues.has(row.data!.importance)).to.be.true;
    }
  });
});

describe('Grid properties', () => {
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  it('Sort expressions late binding (set)', async () => {
    await TDD.updateProperty('sortingExpressions', [{ key: 'id', direction: 'descending' }]);
    expect(TDD.rows.first.data.id).to.equal(8);
  });

  it('Filter expressions late binding (set)', async () => {
    await TDD.updateColumns({ field: 'id', dataType: 'number' });
    await TDD.updateProperty('filterExpressions', [
      { key: 'id', condition: 'greaterThanOrEqual', searchTerm: 8 },
    ]);

    expect(TDD.grid.totalItems).to.equal(1);
    expect(TDD.rows.first.data.id).to.equal(8);
  });

  it('Sort expressions (get)', async () => {
    await TDD.sort([
      { key: 'name', direction: 'descending' },
      { key: 'id', direction: 'ascending' },
    ]);

    expect(TDD.grid.sortingExpressions).lengthOf(2);
  });

  it('Filter expressions (get)', async () => {
    await TDD.updateColumns({ field: 'id', dataType: 'number' });
    await TDD.filter([
      { key: 'name', condition: 'startsWith', searchTerm: 'a' },
      { key: 'name', condition: 'contains', searchTerm: 'a' },
      { key: 'id', condition: 'greaterThan', searchTerm: 3 },
    ]);

    expect(TDD.grid.filterExpressions).lengthOf(3);
  });
});
