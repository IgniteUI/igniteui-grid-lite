import { expect, nextFrame } from '@open-wc/testing';
import GridTestFixture from './utils/grid-fixture.js';
import data, { type TestData } from './utils/test-data.js';

const SCROLLBAR_OFFSET_VAR = '--scrollbar-offset';

/** Stand-in for a scrollbar - headless Chromium renders overlay ones with zero width. */
const FAKE_SCROLLBAR_WIDTH = 20;

class DomFixture<T extends object> extends GridTestFixture<T> {
  public get scrollbarOffset(): string {
    return this.grid.style.getPropertyValue(SCROLLBAR_OFFSET_VAR);
  }

  /**
   * Widens the virtualizer border so that `offsetWidth - clientWidth` reports a
   * non-zero value, the way a classic scrollbar would.
   */
  public async addFakeScrollbar(): Promise<void> {
    const style = document.createElement('style');
    style.textContent = `igc-grid-lite-virtualizer { border-inline-end: ${FAKE_SCROLLBAR_WIDTH}px solid transparent; }`;
    this.grid.renderRoot.appendChild(style);

    // Resize delivery + the deferred CSS variable write.
    await nextFrame();
    await nextFrame();
    await nextFrame();
  }
}

describe('Grid DOM reuse', () => {
  const TDD = new DomFixture<TestData>(data);

  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  it('keeps header and cell elements on a column configuration update', async () => {
    const header = TDD.headers.get('name').element;
    const cell = TDD.rows.first.cells.get('name').element;

    await TDD.updateColumns({ field: 'name', header: 'Updated' });

    expect(TDD.headers.get('name').text).to.equal('Updated');
    expect(TDD.headers.get('name').element === header).to.be.true;
    expect(TDD.rows.first.cells.get('name').element === cell).to.be.true;
  });
});

describe('Grid scrollbar offset', () => {
  const TDD = new DomFixture<TestData>(data, { height: '100px' });

  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  it('tracks the virtualizer scrollbar without a host update', async () => {
    expect(TDD.scrollbarOffset).to.equal('0px');

    await TDD.addFakeScrollbar();

    expect(TDD.scrollbarOffset).to.equal(`${FAKE_SCROLLBAR_WIDTH}px`);
  });

  it('keeps the offset up to date when the data source changes', async () => {
    await TDD.addFakeScrollbar();
    await TDD.updateProperty('data', [data[0]]);

    expect(TDD.scrollbarOffset).to.equal(`${FAKE_SCROLLBAR_WIDTH}px`);
  });
});
