import { setupIgnoreWindowResizeObserverLoopErrors } from '@lit-labs/virtualizer/support/resize-observer-errors.js';
import { expect } from '@open-wc/testing';
import GridTestFixture from './utils/grid-fixture.js';
import data, { generateFieldPaths } from './utils/test-data.js';

// reduced width to force scroll:
const TDD = new GridTestFixture(data, { width: '300px' });
const keys = generateFieldPaths(data[0]);

function isVisibleGrid(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const { top, bottom } = TDD.gridBody.getBoundingClientRect();
  const { left, right } = TDD.grid.getBoundingClientRect();

  return rect.top >= top && rect.bottom <= bottom && rect.left >= left && rect.right <= right;
}

describe('Grid activation', () => {
  setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  describe('Click activation', () => {
    it('Default', async () => {
      const initial = TDD.rows.first.cells.first;
      const next = TDD.rows.first.cells.last;

      await TDD.clickCell(initial);
      expect(initial.active).to.be.true;

      await TDD.clickCell(next);
      expect(initial.active).to.be.false;
      expect(next.active).to.be.true;
    });
  });

  describe('Keyboard navigation & activation', () => {
    it('ArrowRight', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);

      for (const each of keys) {
        expect(TDD.rows.first.cells.get(each).active).to.be.true;
        await TDD.fireNavigationEvent({ key: 'ArrowRight' });
      }
    });

    it('ArrowRight @ boundary', async () => {
      await TDD.clickCell(TDD.rows.first.cells.last);
      await TDD.fireNavigationEvent({ key: 'ArrowRight' });

      expect(TDD.rows.first.cells.last.active).to.be.true;
    });

    it('ArrowLeft', async () => {
      const reversed = keys.toReversed();
      await TDD.clickCell(TDD.rows.first.cells.last);

      for (const each of reversed) {
        expect(TDD.rows.first.cells.get(each).active).to.be.true;
        await TDD.fireNavigationEvent({ key: 'ArrowLeft' });
      }
    });

    it('ArrowLeft @ boundary', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);
      await TDD.fireNavigationEvent({ key: 'ArrowLeft' });

      expect(TDD.rows.first.cells.first.active).to.be.true;
    });

    it('ArrowDown', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);

      for (let i = 0; i < data.length; i++) {
        expect(TDD.rows.get(i).cells.first.active).to.be.true;
        await TDD.fireNavigationEvent({ key: 'ArrowDown' });
      }
    });

    it('ArrowDown @ boundary', async () => {
      await TDD.clickCell(TDD.rows.last.cells.first);
      await TDD.fireNavigationEvent({ key: 'ArrowDown' });

      expect(TDD.rows.last.cells.first.active).to.be.true;
    });

    it('ArrowUp', async () => {
      await TDD.clickCell(TDD.rows.last.cells.first);

      for (let i = data.length - 1; i > -1; i--) {
        expect(TDD.rows.get(i).cells.first.active).to.be.true;
        await TDD.fireNavigationEvent({ key: 'ArrowUp' });
      }
    });

    it('ArrowUp @ boundary', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);
      await TDD.fireNavigationEvent({ key: 'ArrowUp' });

      expect(TDD.rows.first.cells.first.active).to.be.true;
    });

    it('Home', async () => {
      await TDD.clickCell(TDD.rows.last.cells.first);
      await TDD.fireNavigationEvent({ key: 'Home' });

      expect(TDD.rows.first.cells.first.active).to.be.true;
    });

    it('Home @ boundary', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);
      await TDD.fireNavigationEvent({ key: 'Home' });

      expect(TDD.rows.first.cells.first.active).to.be.true;
    });

    it('End', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);
      await TDD.fireNavigationEvent({ key: 'End' });

      expect(TDD.rows.last.cells.first.active).to.be.true;
    });

    it('End (at edge)', async () => {
      await TDD.clickCell(TDD.rows.last.cells.first);
      await TDD.fireNavigationEvent({ key: 'End' });

      expect(TDD.rows.last.cells.first.active).to.be.true;
    });
  });

  describe('Nested field activation', () => {
    it('Click activation on nested field column', async () => {
      const cityCell = TDD.rows.first.cells.get('address.city');

      await TDD.clickCell(cityCell);
      expect(cityCell.active).to.be.true;
    });

    it('Navigate to nested field column with ArrowRight', async () => {
      const importanceCell = TDD.rows.first.cells.get('importance');
      const cityCell = TDD.rows.first.cells.get('address.city');

      await TDD.clickCell(importanceCell);
      expect(importanceCell.active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowRight' });
      expect(cityCell.active).to.be.true;
    });

    it('Navigate between nested field columns', async () => {
      const cityCell = TDD.rows.first.cells.get('address.city');
      const codeCell = TDD.rows.first.cells.get('address.code');

      await TDD.clickCell(cityCell);
      expect(cityCell.active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowRight' });
      expect(codeCell.active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowLeft' });
      expect(cityCell.active).to.be.true;
    });

    it('Navigate from nested field column back to flat column', async () => {
      const importanceCell = TDD.rows.first.cells.get('importance');
      const cityCell = TDD.rows.first.cells.get('address.city');

      await TDD.clickCell(cityCell);
      expect(cityCell.active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowLeft' });
      expect(importanceCell.active).to.be.true;
    });

    it('Navigate vertically on nested field column', async () => {
      const firstRowCityCell = TDD.rows.first.cells.get('address.city');
      const secondRowCityCell = TDD.rows.get(1).cells.get('address.city');

      await TDD.clickCell(firstRowCityCell);
      expect(firstRowCityCell.active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowDown' });
      expect(secondRowCityCell.active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowUp' });
      expect(firstRowCityCell.active).to.be.true;
    });
  });

  describe('navigateTo API', () => {
    // extend test data to move into virtualized scroll:
    const testData = [
      ...data,
      ...data.map((x) => ({ ...x, id: x.id + data.length })),
      ...data.map((x) => ({ ...x, id: x.id + data.length * 2 })),
    ];

    beforeEach(async () => {
      await TDD.updateProperty('data', testData);
      // expect horizontal and vertical scroll to ensure test setup doesn't change
      expect(TDD.grid.scrollWidth > TDD.grid.clientWidth).to.be.true;
      expect(TDD.gridBody.scrollHeight > TDD.gridBody.clientHeight).to.be.true;
    });

    it('navigates to rows only', async () => {
      await TDD.grid.navigateTo(testData.length - 1);

      let cell = TDD.rows.last.cells.first;
      expect(cell.active).to.be.false;
      expect(isVisibleGrid(cell.element)).to.be.true;

      await TDD.grid.navigateTo(0);

      cell = TDD.rows.first.cells.first;
      expect(cell.active).to.be.false;
      expect(isVisibleGrid(cell.element)).to.be.true;
    });

    it('navigates to a specific row and column', async () => {
      await TDD.grid.navigateTo(testData.length - 2, 'name');

      const cell = TDD.rows.get(-2).cells.get('name');
      expect(cell.active).to.be.false;
      expect(isVisibleGrid(cell.element)).to.be.true;
    });

    it('navigates to a cell within already scrolled-to row', async () => {
      await TDD.grid.navigateTo(testData.length - 1, 'id');

      let cell = TDD.rows.last.cells.get('id');
      expect(isVisibleGrid(cell.element)).to.be.true;

      // last cell
      cell = TDD.rows.last.cells.last;
      expect(isVisibleGrid(cell.element)).to.be.false;
      await TDD.grid.navigateTo(testData.length - 1, keys.at(-1));

      expect(isVisibleGrid(cell.element)).to.be.true;
    });

    it('navigates through all columns', async () => {
      for (const key of keys) {
        await TDD.grid.navigateTo(0, key);
        const cell = TDD.rows.first.cells.get(key);
        expect(isVisibleGrid(cell.element)).to.be.true;
      }
    });

    it('updates active state when navigating', async () => {
      await TDD.grid.navigateTo(0, 'id', true);
      expect(TDD.rows.first.cells.get('id').active).to.be.true;

      await TDD.grid.navigateTo(1, 'name', true);
      expect(TDD.rows.first.cells.get('id').active).to.be.false;

      let cell = TDD.rows.get(1).cells.get('name');
      expect(cell.active).to.be.true;
      expect(isVisibleGrid(cell.element)).to.be.true;

      // last cell
      await TDD.grid.navigateTo(testData.length - 1, keys.at(-1), true);

      cell = TDD.rows.last.cells.last;
      expect(cell.active).to.be.true;
      expect(isVisibleGrid(cell.element)).to.be.true;
    });

    it('can navigate after click activation', async () => {
      await TDD.clickCell(TDD.rows.first.cells.first);
      expect(TDD.rows.first.cells.first.active).to.be.true;

      await TDD.grid.navigateTo(3, 'active', true);
      expect(TDD.rows.first.cells.first.active).to.be.false;

      const cell = TDD.rows.get(3).cells.get('active');
      expect(cell.active).to.be.true;
      expect(isVisibleGrid(cell.element)).to.be.true;
    });

    it('keyboard navigation works after navigateTo', async () => {
      await TDD.grid.navigateTo(2, 'id', true);
      expect(TDD.rows.get(2).cells.get('id').active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowRight' });
      expect(TDD.rows.get(2).cells.get('name').active).to.be.true;

      await TDD.fireNavigationEvent({ key: 'ArrowDown' });
      const cell = TDD.rows.get(3).cells.get('name');
      expect(cell.active).to.be.true;
      expect(isVisibleGrid(cell.element)).to.be.true;
    });
  });
});
