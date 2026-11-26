import { expect } from '@open-wc/testing';
import GridTestFixture from './utils/grid-fixture.js';
import data, { type TestData } from './utils/test-data.js';

/** A distinct color for each gray shade, so each scrollbar color names its shade. */
const GRAYS = {
  '--ig-gray-100': 'rgb(10, 10, 10)',
  '--ig-gray-400': 'rgb(40, 40, 40)',
};

describe('Grid scrollbars', () => {
  const TDD = new GridTestFixture<TestData>(data, { height: '100px' });

  beforeEach(async () => {
    await TDD.setUp();
    for (const [name, value] of Object.entries(GRAYS)) {
      TDD.grid.parentElement!.style.setProperty(name, value);
    }
  });

  afterEach(() => TDD.tearDown());

  it('colors the grid scrollbar with the scrollbar schema of the default theme', () => {
    expect(getComputedStyle(TDD.grid).scrollbarColor).to.equal('rgb(40, 40, 40) rgb(10, 10, 10)');
  });

  it('gives the virtual scroll of the rows the colors of the grid', () => {
    const scroller = TDD.grid.shadowRoot!.querySelector('igc-virtual-scroll')!;

    expect(getComputedStyle(scroller).scrollbarColor).to.equal(
      getComputedStyle(TDD.grid).scrollbarColor
    );
  });
});
