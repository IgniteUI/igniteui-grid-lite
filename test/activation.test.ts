import { expect } from '@open-wc/testing';
import GridTestFixture from './utils/grid-fixture.js';
import data, { generateFieldPaths } from './utils/test-data.js';

const TDD = new GridTestFixture(data);
const keys = generateFieldPaths(data[0]);

describe('Grid activation', () => {
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
});
