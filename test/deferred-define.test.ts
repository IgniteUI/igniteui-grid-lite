import { expect } from '@open-wc/testing';
import { GRID_FILTER_ROW_TAG } from '../src/internal/tags.js';
import type { Keys } from '../src/internal/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import data, { type TestData } from './utils/test-data.js';

/** Tags that only the filter row renders. */
const FILTER_ROW_TAGS = [
  GRID_FILTER_ROW_TAG,
  'igc-button',
  'igc-chip',
  'igc-input',
  'igc-dropdown',
] as const;

/** An assertion on the constructor makes chai stringify a whole class on failure. */
function isDefined(tag: string): boolean {
  return customElements.get(tag) !== undefined;
}

class FilterableFixture extends GridTestFixture<TestData> {
  public override updateConfig(): void {
    this.columnConfig = this.columnConfig.map((config) => ({ ...config, filterable: true }));
  }

  public async filterByInput(key: Keys<TestData>, value: string) {
    this.filterRow.open(key);
    await this.waitForUpdate();

    this.filterRow.fireInputEvent(value);
    await this.waitForUpdate();
  }
}

describe('Deferred custom element definitions', () => {
  // `customElements.define` is irreversible per page. The negative assertion must
  // run before a filterable grid in this file defines the filter row dependencies.
  it('a grid without filterable columns defines no filter row dependency', async () => {
    const TDD = new GridTestFixture(data);
    await TDD.setUp();

    expect(TDD.filterRow.element).to.not.exist;

    for (const tag of FILTER_ROW_TAGS) {
      expect(isDefined(tag), tag).to.be.false;
    }

    TDD.tearDown();
  });

  it('a grid with filterable columns renders a working filter row', async () => {
    const TDD = new FilterableFixture(data);
    await TDD.setUp();

    for (const tag of FILTER_ROW_TAGS) {
      expect(isDefined(tag), tag).to.be.true;
    }

    // The default string condition is a case-insensitive `contains`: 'A' and 'a' match.
    await TDD.filterByInput('name', 'a');
    expect(TDD.grid.dataView).lengthOf(2);

    TDD.tearDown();
  });
});
