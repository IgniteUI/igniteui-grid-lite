import { elementUpdated, expect, fixture, html } from '@open-wc/testing';
import { IgcGridLiteColumn } from '../src/components/column.js';
import { IgcGridLite } from '../src/components/grid.js';
import data, { type TestData } from './utils/test-data.js';

const FIELD = 'id';
const WIDTH = '200px';

// Define is irreversible per page: this file owns the order.
describe('Columns upgraded before the grid', () => {
  it('passes later column changes to the grid', async () => {
    const grid = await fixture<IgcGridLite<TestData>>(html`
      <igc-grid-lite>
        <igc-grid-lite-column field="name"></igc-grid-lite-column>
        <igc-grid-lite-column field=${FIELD}></igc-grid-lite-column>
      </igc-grid-lite>
    `);

    // Column first: its connect-time context request goes unanswered.
    IgcGridLiteColumn.register();
    IgcGridLite.register();

    grid.data = data;
    await elementUpdated(grid);

    const column = grid.querySelector<IgcGridLiteColumn<TestData>>(`[field="${FIELD}"]`)!;
    column.hidden = true;
    column.width = WIDTH;
    await elementUpdated(column);

    const config = grid.getColumn(FIELD);
    expect(config?.hidden).to.be.true;
    expect(config?.width).to.equal(WIDTH);
  });
});
