import { expect } from '@open-wc/testing';
import GridTestFixture from './utils/grid-fixture.js';
import data from './utils/test-data.js';

const TDD = new GridTestFixture(data, { transform: 'scale(0.5, 0.5)' });

describe('Grid scaled initial render', () => {
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  it('should position items correctly in virtualizer', async () => {
    function checkRowTopTranslate(index: number) {
      const row = TDD.rows.get(index).element;
      const { height } = row.getBoundingClientRect();
      const offsetHeight = row.offsetHeight;
      const { transform } = row.style;

      expect(offsetHeight / height).to.equal(2);
      expect(transform).to.equal(`translate(0px, ${offsetHeight * index}px)`);
    }

    for (let i = 0; i < data.length; i++) {
      checkRowTopTranslate(i);
    }
  });
});
