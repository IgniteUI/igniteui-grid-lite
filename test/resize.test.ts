import { expect, html } from '@open-wc/testing';
import { MIN_COL_RESIZE_WIDTH } from '../src/internal/constants.js';
import type { Keys } from '../src/internal/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import data from './utils/test-data.js';

class ResizeFixture<T extends object> extends GridTestFixture<T> {
  public override updateConfig(): void {
    this.columnConfig = this.columnConfig.map((config) => ({ ...config, resizable: true }));
  }

  public async assertResized(name: Keys<T>, delta: number) {
    const dom = this.headers.get(name).element;
    const initial = dom.offsetWidth;

    await this.startResizeHeader(name);
    await this.resizeHeader(name, delta);
    await this.stopResizeHeader(name);
    // Header
    expect(dom.offsetWidth).to.equal(initial + delta);

    // Cell
    expect(this.rows.first.cells.get(name).element.offsetWidth).to.equal(initial + delta);
  }

  public getTranslate(element: HTMLElement) {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).getPropertyValue('transform'));
    return {
      x: matrix.m41,
      y: matrix.m42,
    };
  }
}

const TDD = new ResizeFixture(data);

describe('Column resizing', () => {
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  describe('Default', () => {
    it('Resize element state with disabled resizing', async () => {
      await TDD.updateColumns({ field: 'name', resizable: false });
      expect(TDD.resizePart).to.not.exist;
      expect(TDD.headers.get('name').resizePart).to.not.exist;
    });

    it('Resize element state with enabled resizing', async () => {
      expect(TDD.headers.get('name').resizePart).to.exist;

      await TDD.startResizeHeader('name');
      expect(TDD.resizePart).to.exist;
    });

    it('Resize element is at correct x point', async () => {
      await TDD.startResizeHeader('name');
      const header = TDD.headers.get('name').element;
      expect(TDD.getTranslate(TDD.resizePart).x).to.equal(header.offsetLeft + header.offsetWidth);
    });

    it('Resize element is none when resizing stops', async () => {
      await TDD.startResizeHeader('name');
      expect(TDD.resizePart).to.exist;

      await TDD.stopResizeHeader('name');
      expect(TDD.resizePart).to.not.exist;
    });

    it('Header is sized correctly', async () => {
      await TDD.assertResized('name', 100);
      await TDD.assertResized('name', -100);
    });

    it('Header does not fall below min threshold', async () => {
      const dom = TDD.headers.get('name').element;

      await TDD.startResizeHeader('name');
      await TDD.resizeHeader('name', -1e3);
      await TDD.stopResizeHeader('name');

      expect(dom.offsetWidth).to.equal(MIN_COL_RESIZE_WIDTH);
    });

    it('Auto-size (header)', async () => {
      await TDD.updateColumns({
        field: 'name',
        resizable: true,
        headerTemplate: () => html`<div style="width: 300px"></div>`,
      });
      await TDD.autoSizeHeader('name');

      const [header, cell] = [
        TDD.headers.get('name').element,
        TDD.rows.first.cells.get('name').element,
      ];

      expect(header.offsetWidth).greaterThan(300);
      expect(header.offsetWidth).to.equal(cell.offsetWidth);
    });

    it('Auto size (cell)', async () => {
      await TDD.updateColumns({
        field: 'name',
        resizable: true,
        cellTemplate: () => html`<div style="width: 600px"></div>`,
      });
      await TDD.autoSizeHeader('name');

      const [header, cell] = [
        TDD.headers.get('name').element,
        TDD.rows.first.cells.get('name').element,
      ];

      expect(header.offsetWidth).greaterThan(600);
      expect(header.offsetWidth).to.equal(cell.offsetWidth);
    });
  });
});
