import { expect } from '@open-wc/testing';
import GridTestFixture from './utils/grid-fixture.js';
import data from './utils/test-data.js';

const TDD = new GridTestFixture(data, { transform: 'scale(0.5, 0.5)' });

describe('Grid scaled initial render', () => {
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  it('should position items correctly in virtualizer', async () => {
    // Rows stack without gaps or overlaps at half their layout size.
    const { top } = TDD.rows.byIndex(0).element.getBoundingClientRect();

    for (const row of TDD.grid.rows) {
      const { height, top: rowTop } = row.getBoundingClientRect();

      expect(row.offsetHeight / height).to.equal(2);
      expect(rowTop - top).to.equal(height * row.index);
    }
  });
});
