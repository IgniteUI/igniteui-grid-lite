import { setupIgnoreWindowResizeObserverLoopErrors } from '@lit-labs/virtualizer/support/resize-observer-errors.js';
import { elementUpdated, expect, fixture, fixtureCleanup, html, nextFrame } from '@open-wc/testing';
import type IgcGridLiteCell from '../src/components/cell.js';
import { IgcGridLite } from '../src/components/grid.js';
import IgcVirtualizer from '../src/components/virtualizer.js';
import { GRID_TAG } from '../src/internal/tags.js';

interface Item {
  id: number;
  name: string;
}

const ITEM_COUNT = 50;

const data: Item[] = Array.from({ length: ITEM_COUNT }, (_, i) => ({ id: i, name: `Item ${i}` }));

function bodyOf(grid: IgcGridLite<Item>): IgcVirtualizer {
  return grid.renderRoot.querySelector<IgcVirtualizer>(IgcVirtualizer.tagName)!;
}

/** The element that holds keyboard focus, found through the shadow roots. */
function focusedElement(): Element | null {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
}

function activeCellOf(grid: IgcGridLite<Item>): IgcGridLiteCell<Item> | undefined {
  for (const row of grid.rows) {
    const cell = row.cells.find((each) => each.active);

    if (cell) {
      return cell;
    }
  }

  return undefined;
}

/**
 * Element identity assertion. On failure, chai's `equal` serializes both
 * operands, which hangs the browser on component instances.
 */
function expectSame(actual: unknown, expected: unknown, message: string): void {
  expect(actual === expected, message).to.be.true;
}

async function setup(): Promise<IgcGridLite<Item>> {
  IgcGridLite.register();

  const wrapper = await fixture<HTMLDivElement>(html`
    <div style="height: 800px">
      <input />
      <igc-grid-lite .data=${data} style="height: 300px">
        <igc-grid-lite-column .field=${'id' as keyof Item}></igc-grid-lite-column>
        <igc-grid-lite-column .field=${'name' as keyof Item}></igc-grid-lite-column>
      </igc-grid-lite>
    </div>
  `);

  const grid = wrapper.querySelector<IgcGridLite<Item>>(GRID_TAG)!;
  await bodyOf(grid).layoutComplete;

  return grid;
}

async function settle(grid: IgcGridLite<Item>): Promise<void> {
  await Promise.all([elementUpdated(grid), nextFrame()]);
  await nextFrame();
}

async function press(target: EventTarget, grid: IgcGridLite<Item>, key: string): Promise<void> {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await settle(grid);
}

describe('Roving focus', () => {
  setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);
  afterEach(() => fixtureCleanup());

  it('Keyboard navigation moves focus onto the active cell', async () => {
    const grid = await setup();

    bodyOf(grid).focus();
    await press(bodyOf(grid), grid, 'ArrowDown');

    const cell = activeCellOf(grid);
    expect(cell).to.exist;
    expectSame(focusedElement(), cell, 'focus should be on the active cell');
  });

  it('Keydown from the focused cell continues navigation', async () => {
    const grid = await setup();

    bodyOf(grid).focus();
    await press(bodyOf(grid), grid, 'ArrowDown');
    expect(activeCellOf(grid)).to.exist;

    await press(activeCellOf(grid)!, grid, 'ArrowRight');

    const next = activeCellOf(grid)!;
    expect(next.column.field).to.equal('name');
    expectSame(focusedElement(), next, 'focus should follow the active cell');
  });

  it('Click activation moves focus onto the clicked cell', async () => {
    const grid = await setup();
    const cell = grid.rows[0].cells[1];

    cell.click();
    await settle(grid);

    expect(cell.active).to.be.true;
    expectSame(focusedElement(), cell, 'focus should be on the clicked cell');
  });

  it('navigateTo does not move focus', async () => {
    const grid = await setup();

    await grid.navigateTo(1, { column: 'name', activate: true });
    await settle(grid);

    expect(activeCellOf(grid)).to.exist;
    expect(focusedElement() !== activeCellOf(grid), 'programmatic navigation must not steal focus')
      .to.be.true;
  });

  it('Activation changes keep the row renderer identity', async () => {
    const grid = await setup();
    const body = bodyOf(grid);
    const renderItem = body.renderItem;

    body.focus();
    await press(body, grid, 'ArrowDown');
    expect(activeCellOf(grid)).to.exist;

    await press(activeCellOf(grid)!, grid, 'ArrowRight');

    expect(activeCellOf(grid)).to.exist;
    expectSame(body.renderItem, renderItem, 'activation must not rebuild the row renderer');
  });

  it('Focus falls back to the scroller when the focused cell is scrolled out', async () => {
    const grid = await setup();
    const body = bodyOf(grid);

    body.focus();
    await press(body, grid, 'ArrowDown');
    expectSame(focusedElement(), activeCellOf(grid), 'focus should be on the active cell');

    body.scrollTo({ top: body.scrollHeight });
    await body.layoutComplete;
    await settle(grid);

    expectSame(focusedElement(), body, 'focus should fall back to the scroller');
  });

  it('Scrolling does not steal focus from outside the grid', async () => {
    const grid = await setup();
    const body = bodyOf(grid);
    const input = grid.parentElement!.querySelector('input')!;

    body.focus();
    await press(body, grid, 'ArrowDown');

    input.focus();
    await nextFrame();

    body.scrollTo({ top: body.scrollHeight });
    await body.layoutComplete;
    await settle(grid);

    expectSame(document.activeElement, input, 'focus should stay outside the grid');
  });
});
