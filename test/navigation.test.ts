import { setupIgnoreWindowResizeObserverLoopErrors } from '@lit-labs/virtualizer/support/resize-observer-errors.js';
import { elementUpdated, expect, fixture, fixtureCleanup, html, nextFrame } from '@open-wc/testing';
import type { TemplateResult } from 'lit';
import { IgcGridLite } from '../src/components/grid.js';
import IgcVirtualizer from '../src/components/virtualizer.js';
import { GRID_TAG } from '../src/internal/tags.js';

interface Item {
  id: number;
  name: string;
  city: string;
}

const FIELDS = ['id', 'name', 'city'] as const;

const data: Item[] = [
  { id: 1, name: 'Anna', city: 'Sofia' },
  { id: 2, name: 'Boris', city: 'Varna' },
  { id: 3, name: 'Clara', city: 'Burgas' },
  { id: 4, name: 'Doris', city: 'Ruse' },
];

function gridTemplate(hidden: string[] = [], items: Item[] = data): TemplateResult {
  return html`
    <igc-grid-lite .data=${items} style="height: 300px">
      ${FIELDS.map(
        (field) =>
          html`<igc-grid-lite-column
            .field=${field}
            ?hidden=${hidden.includes(field)}
          ></igc-grid-lite-column>`
      )}
    </igc-grid-lite>
  `;
}

function bodyOf(grid: IgcGridLite<Item>): IgcVirtualizer {
  return grid.renderRoot.querySelector<IgcVirtualizer>(IgcVirtualizer.tagName)!;
}

async function setup(...templates: TemplateResult[]): Promise<IgcGridLite<Item>[]> {
  IgcGridLite.register();

  const wrapper = await fixture<HTMLDivElement>(
    html`<div style="height: 800px">${templates}</div>`
  );
  const grids = Array.from(wrapper.querySelectorAll<IgcGridLite<Item>>(GRID_TAG));

  // An empty grid never runs a virtualizer layout, so wait on the host update instead.
  await Promise.all(
    grids.map((grid) => (grid.data.length > 0 ? bodyOf(grid).layoutComplete : elementUpdated(grid)))
  );

  return grids;
}

async function press(grid: IgcGridLite<Item>, key: string): Promise<void> {
  bodyOf(grid).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await Promise.all([elementUpdated(grid), nextFrame()]);
  await nextFrame();
}

/** The active cell of a grid as a plain node, or undefined when nothing is active. */
function activeCell(grid: IgcGridLite<Item>) {
  for (const row of grid.rows) {
    const cell = row.cells.find((each) => each.active);

    if (cell) {
      return { row: row.index, column: cell.column.field };
    }
  }

  return undefined;
}

describe('Grid navigation', () => {
  setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);
  afterEach(() => fixtureCleanup());

  describe('Per-instance state', () => {
    it('Keyboard navigation in one grid is not affected by another', async () => {
      const [first, second] = await setup(gridTemplate(), gridTemplate());

      await first.navigateTo(0, 'id', true);
      await second.navigateTo(2, 'city', true);

      await press(first, 'ArrowDown');

      expect(activeCell(first)).to.eql({ row: 1, column: 'id' });
      expect(activeCell(second)).to.eql({ row: 2, column: 'city' });
    });

    it('Disconnecting a grid does not reset another', async () => {
      const [first, second] = await setup(gridTemplate(), gridTemplate());

      await first.navigateTo(0, 'id', true);
      await second.navigateTo(1, 'name', true);

      first.remove();
      await nextFrame();

      await press(second, 'ArrowDown');
      expect(activeCell(second)).to.eql({ row: 2, column: 'name' });
    });

    it('Nullish active node falls back to the initial position', async () => {
      const [grid] = await setup(gridTemplate());

      await grid.navigateTo(2, 'city', true);

      // @ts-expect-error - private member access
      grid._stateController.active = null;
      await press(grid, 'ArrowDown');

      expect(activeCell(grid)).to.eql({ row: 1, column: 'id' });
    });
  });

  describe('Hidden columns', () => {
    it('ArrowRight skips a hidden column', async () => {
      const [grid] = await setup(gridTemplate(['name']));

      await grid.navigateTo(0, 'id', true);
      await press(grid, 'ArrowRight');

      expect(activeCell(grid)).to.eql({ row: 0, column: 'city' });
    });

    it('ArrowLeft skips a hidden column', async () => {
      const [grid] = await setup(gridTemplate(['name']));

      await grid.navigateTo(0, 'city', true);
      await press(grid, 'ArrowLeft');

      expect(activeCell(grid)).to.eql({ row: 0, column: 'id' });
    });

    it('Initial position is the first visible column', async () => {
      const [grid] = await setup(gridTemplate(['id']));

      await press(grid, 'ArrowDown');

      expect(activeCell(grid)).to.eql({ row: 1, column: 'name' });
    });
  });

  describe('Empty grid', () => {
    it('Navigation is a no-op without columns and rows', async () => {
      const [grid] = await setup(html`<igc-grid-lite style="height: 300px"></igc-grid-lite>`);

      const navigate = () => {
        // @ts-expect-error - private member access
        grid._stateController.navigation.navigate(
          new KeyboardEvent('keydown', { key: 'ArrowDown' })
        );
      };

      expect(navigate).to.not.throw();
      expect(activeCell(grid)).to.be.undefined;
    });
  });
});
