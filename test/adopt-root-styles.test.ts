import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { html as litHtml } from 'lit';
import type IgcGridLiteCell from '../src/components/cell.js';
import type { IgcGridLite } from '../src/components/grid.js';
import type IgcGridLiteHeader from '../src/components/header.js';
import type { IgcCellContext, IgcHeaderContext } from '../src/internal/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import data, { type TestData } from './utils/test-data.js';

class AdoptRootStylesFixture extends GridTestFixture<TestData> {
  private styleElement?: HTMLStyleElement;

  public override async setUp() {
    // Add styles to the document before setting up the grid
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .custom-cell-class {
        color: rgb(255, 0, 0);
        font-weight: bold;
      }

      .custom-header-class {
        color: rgb(0, 255, 0);
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(this.styleElement);

    await super.setUp();
  }

  public override tearDown() {
    if (this.styleElement) {
      this.styleElement.remove();
    }
    return super.tearDown();
  }

  public override setupTemplate() {
    return html`
      <igc-grid-lite
        .data=${this.data}
        adopt-root-styles
      >
        ${this.columnConfig.map(
          (col) =>
            html`<igc-grid-lite-column
              .field=${col.field}
              ?filterable=${col.filterable}
              ?sortable=${col.sortable}
              .width=${col.width}
              .header=${col.header}
              .cellTemplate=${col.cellTemplate}
              .headerTemplate=${col.headerTemplate}
              .dataType=${col.dataType}
              ?resizable=${col.resizable}
              ?hidden=${col.hidden}
            ></igc-grid-lite-column>`
        )}
      </igc-grid-lite>
    `;
  }
}

class NoAdoptRootStylesFixture extends GridTestFixture<TestData> {
  private styleElement?: HTMLStyleElement;

  public override async setUp() {
    // Add styles to the document before setting up the grid
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .custom-cell-class {
        color: rgb(255, 0, 0);
        font-weight: bold;
      }

      .custom-header-class {
        color: rgb(0, 255, 0);
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(this.styleElement);

    await super.setUp();
  }

  public override tearDown() {
    if (this.styleElement) {
      this.styleElement.remove();
    }
    return super.tearDown();
  }

  public override setupTemplate() {
    return html`
      <igc-grid-lite .data=${this.data}>
        ${this.columnConfig.map(
          (col) =>
            html`<igc-grid-lite-column
              .field=${col.field}
              ?filterable=${col.filterable}
              ?sortable=${col.sortable}
              .width=${col.width}
              .header=${col.header}
              .cellTemplate=${col.cellTemplate}
              .headerTemplate=${col.headerTemplate}
              .dataType=${col.dataType}
              ?resizable=${col.resizable}
              ?hidden=${col.hidden}
            ></igc-grid-lite-column>`
        )}
      </igc-grid-lite>
    `;
  }
}

const adoptRootStylesTDD = new AdoptRootStylesFixture(data);
const noAdoptRootStylesTDD = new NoAdoptRootStylesFixture(data);

function createParentNode() {
  const parentNode = document.createElement('div');
  Object.assign(parentNode.style, { height: '800px' });
  return parentNode;
}

describe('Grid adopt-root-styles property', () => {
  describe('With cell templates', () => {
    beforeEach(async () => {
      adoptRootStylesTDD.columnConfig = [
        {
          field: 'name',
          cellTemplate: (ctx: IgcCellContext<TestData>) =>
            litHtml`<div class="custom-cell-class">${ctx.value}</div>`,
        },
        { field: 'id' },
      ];
      await adoptRootStylesTDD.setUp();
    });

    afterEach(() => adoptRootStylesTDD.tearDown());

    it('should adopt root styles to cell shadow DOM when adopt-root-styles is true', async () => {
      const cell = adoptRootStylesTDD.rows.first.cells.get(0);
      const cellElement = cell.element;

      expect(cellElement.adoptRootStyles).to.be.true;

      const customDiv = cellElement.shadowRoot!.querySelector('.custom-cell-class');
      expect(customDiv).to.exist;

      const computedStyle = window.getComputedStyle(customDiv!);
      expect(computedStyle.color).to.equal('rgb(255, 0, 0)');
      expect(computedStyle.fontWeight).to.equal('700');
    });

    it('should have adopted styles in cell component', async () => {
      const cell = adoptRootStylesTDD.rows.first.cells.get(0);
      const cellElement = cell.element as IgcGridLiteCell<TestData>;

      // @ts-expect-error - Accessing private controller for testing
      expect(cellElement._adoptedStylesController.hasAdoptedStyles).to.be.true;
    });

    it('should not affect cells without templates', async () => {
      const cellWithoutTemplate = adoptRootStylesTDD.rows.first.cells.get(1);
      const cellElement = cellWithoutTemplate.element as IgcGridLiteCell<TestData>;

      // @ts-expect-error - Accessing private controller for testing
      expect(cellElement._adoptedStylesController.hasAdoptedStyles).to.be.false;
    });
  });

  describe('With header templates', () => {
    beforeEach(async () => {
      adoptRootStylesTDD.columnConfig = [
        {
          field: 'name',
          headerTemplate: (ctx: IgcHeaderContext<TestData>) =>
            litHtml`<div class="custom-header-class">${ctx.column.header || ctx.column.field}</div>`,
        },
        { field: 'id' },
      ];
      await adoptRootStylesTDD.setUp();
    });

    afterEach(() => adoptRootStylesTDD.tearDown());

    it('should adopt root styles to header shadow DOM when adopt-root-styles is true', async () => {
      const header = adoptRootStylesTDD.headers.get('name');
      const headerElement = header.element;

      expect(headerElement.adoptRootStyles).to.be.true;

      const customDiv = headerElement.shadowRoot!.querySelector('.custom-header-class');
      expect(customDiv).to.exist;

      const computedStyle = window.getComputedStyle(customDiv!);
      expect(computedStyle.color).to.equal('rgb(0, 255, 0)');
      expect(computedStyle.textTransform).to.equal('uppercase');
    });

    it('should have adopted styles in header component', async () => {
      const header = adoptRootStylesTDD.headers.get('name');
      const headerElement = header.element as IgcGridLiteHeader<TestData>;

      // @ts-expect-error - Accessing private controller for testing
      expect(headerElement._adoptedStylesController.hasAdoptedStyles).to.be.true;
    });

    it('should not affect headers without templates', async () => {
      const headerWithoutTemplate = adoptRootStylesTDD.headers.get('id');
      const headerElement = headerWithoutTemplate.element as IgcGridLiteHeader<TestData>;

      // @ts-expect-error - Accessing private controller for testing
      expect(headerElement._adoptedStylesController.hasAdoptedStyles).to.be.false;
    });
  });

  describe('With both cell and header templates', () => {
    beforeEach(async () => {
      adoptRootStylesTDD.columnConfig = [
        {
          field: 'name',
          cellTemplate: (ctx: IgcCellContext<TestData>) =>
            litHtml`<div class="custom-cell-class">${ctx.value}</div>`,
          headerTemplate: (ctx: IgcHeaderContext<TestData>) =>
            litHtml`<div class="custom-header-class">${ctx.column.header || ctx.column.field}</div>`,
        },
        { field: 'id' },
      ];
      await adoptRootStylesTDD.setUp();
    });

    afterEach(() => adoptRootStylesTDD.tearDown());

    it('should adopt root styles to both cell and header shadow DOMs', async () => {
      const cell = adoptRootStylesTDD.rows.first.cells.get(0);
      const header = adoptRootStylesTDD.headers.get('name');

      const cellElement = cell.element;
      const headerElement = header.element;

      expect(cellElement.adoptRootStyles).to.be.true;
      expect(headerElement.adoptRootStyles).to.be.true;

      const customCellDiv = cellElement.shadowRoot!.querySelector('.custom-cell-class');
      const customHeaderDiv = headerElement.shadowRoot!.querySelector('.custom-header-class');

      expect(customCellDiv).to.exist;
      expect(customHeaderDiv).to.exist;

      const cellComputedStyle = window.getComputedStyle(customCellDiv!);
      const headerComputedStyle = window.getComputedStyle(customHeaderDiv!);

      expect(cellComputedStyle.color).to.equal('rgb(255, 0, 0)');
      expect(headerComputedStyle.color).to.equal('rgb(0, 255, 0)');
    });
  });

  describe('Without adopt-root-styles property', () => {
    beforeEach(async () => {
      noAdoptRootStylesTDD.columnConfig = [
        {
          field: 'name',
          cellTemplate: (ctx: IgcCellContext<TestData>) =>
            litHtml`<div class="custom-cell-class">${ctx.value}</div>`,
          headerTemplate: (ctx: IgcHeaderContext<TestData>) =>
            litHtml`<div class="custom-header-class">${ctx.column.header || ctx.column.field}</div>`,
        },
      ];
      await noAdoptRootStylesTDD.setUp();
    });

    afterEach(() => noAdoptRootStylesTDD.tearDown());

    it('should not adopt root styles when adopt-root-styles is false', async () => {
      const cell = noAdoptRootStylesTDD.rows.first.cells.get(0);
      const header = noAdoptRootStylesTDD.headers.get('name');

      const cellElement = cell.element as IgcGridLiteCell<TestData>;
      const headerElement = header.element as IgcGridLiteHeader<TestData>;

      expect(cellElement.adoptRootStyles).to.be.false;
      expect(headerElement.adoptRootStyles).to.be.false;

      // @ts-expect-error - Accessing private controller for testing
      expect(cellElement._adoptedStylesController.hasAdoptedStyles).to.be.false;
      // @ts-expect-error - Accessing private controller for testing
      expect(headerElement._adoptedStylesController.hasAdoptedStyles).to.be.false;
    });

    it('should not apply document styles to templated cells when adopt-root-styles is false', async () => {
      const cell = noAdoptRootStylesTDD.rows.first.cells.get(0);
      const cellElement = cell.element;

      const customDiv = cellElement.shadowRoot!.querySelector('.custom-cell-class');
      expect(customDiv).to.exist;

      const computedStyle = window.getComputedStyle(customDiv!);
      // Without adopted styles, the custom class styles won't apply
      expect(computedStyle.color).to.not.equal('rgb(255, 0, 0)');
    });

    it('should not apply document styles to templated headers when adopt-root-styles is false', async () => {
      const header = noAdoptRootStylesTDD.headers.get('name');
      const headerElement = header.element;

      const customDiv = headerElement.shadowRoot!.querySelector('.custom-header-class');
      expect(customDiv).to.exist;

      const computedStyle = window.getComputedStyle(customDiv!);
      // Without adopted styles, the custom class styles won't apply
      expect(computedStyle.color).to.not.equal('rgb(0, 255, 0)');
    });
  });

  describe('Dynamic property toggling', () => {
    let grid: IgcGridLite<TestData>;
    let styleElement: HTMLStyleElement;

    beforeEach(async () => {
      // Add styles to the document
      styleElement = document.createElement('style');
      styleElement.textContent = `
        .dynamic-cell-class {
          color: rgb(0, 0, 255);
        }
      `;
      document.head.appendChild(styleElement);

      grid = await fixture(
        html`
          <igc-grid-lite .data=${data}>
            <igc-grid-lite-column
              .field=${'name'}
              .cellTemplate=${(ctx: IgcCellContext<TestData>) =>
                litHtml`<div class="dynamic-cell-class">${ctx.value}</div>`}
            ></igc-grid-lite-column>
          </igc-grid-lite>
        `,
        { parentNode: createParentNode() }
      );
      await grid.updateComplete;

      // Wait for virtualizer to complete layout
      const virtualizer = grid.renderRoot.querySelector('igc-virtualizer');
      if (virtualizer) {
        await virtualizer.layoutComplete;
      }
    });

    afterEach(() => {
      styleElement.remove();
    });

    it('should adopt styles when property is set to true dynamically', async () => {
      // Initially false
      let cell = grid.rows[0]!.cells[0];
      expect(cell.adoptRootStyles).to.be.false;
      // @ts-expect-error - Accessing private controller for testing
      expect(cell._adoptedStylesController.hasAdoptedStyles).to.be.false;

      // Set adopt-root-styles to true
      grid.adoptRootStyles = true;
      await grid.updateComplete;

      // Wait for rows to update
      const row = grid.rows[0];
      await row.updateComplete;

      // Get the cell again after the update
      cell = grid.rows[0]!.cells[0];
      expect(cell.adoptRootStyles).to.be.true;
      // @ts-expect-error - Accessing private controller for testing
      expect(cell._adoptedStylesController.hasAdoptedStyles).to.be.true;

      const customDiv = cell.shadowRoot!.querySelector('.dynamic-cell-class');
      const computedStyle = window.getComputedStyle(customDiv!);
      expect(computedStyle.color).to.equal('rgb(0, 0, 255)');
    });

    it('should remove adopted styles when property is set to false dynamically', async () => {
      // Start with adopt-root-styles true
      grid.adoptRootStyles = true;
      await grid.updateComplete;

      // Wait for rows to update
      let row = grid.rows[0];
      await row.updateComplete;

      let cell = grid.rows[0]!.cells[0];
      expect(cell.adoptRootStyles).to.be.true;
      // @ts-expect-error - Accessing private controller for testing
      expect(cell._adoptedStylesController.hasAdoptedStyles).to.be.true;

      // Set adopt-root-styles to false
      grid.adoptRootStyles = false;
      await grid.updateComplete;

      // Wait for rows to update
      row = grid.rows[0];
      await row.updateComplete;

      // Get the cell again after the update
      cell = grid.rows[0]!.cells[0];
      expect(cell.adoptRootStyles).to.be.false;
      // @ts-expect-error - Accessing private controller for testing
      expect(cell._adoptedStylesController.hasAdoptedStyles).to.be.false;
    });
  });

  describe('Dynamic templates toggling', () => {
    beforeEach(async () => {
      adoptRootStylesTDD.columnConfig = [{ field: 'name' }];
      await adoptRootStylesTDD.setUp();
    });

    afterEach(() => adoptRootStylesTDD.tearDown());

    it('should adopt styles when header template is set dynamically', async () => {
      let header = adoptRootStylesTDD.headers.get('name');
      let headerElement = header.element;

      expect(headerElement.adoptRootStyles).to.be.true;
      // @ts-expect-error - Accessing private controller for testing
      expect(headerElement._adoptedStylesController.hasAdoptedStyles).to.be.false;

      const column = adoptRootStylesTDD.grid.querySelector('igc-grid-lite-column')!;
      column.headerTemplate = (ctx: IgcHeaderContext<TestData>) =>
        litHtml`<div class="custom-header-class">${ctx.column.header || ctx.column.field}</div>`;
      await adoptRootStylesTDD.grid.updateComplete;
      await adoptRootStylesTDD.headerRow.updateComplete;

      header = adoptRootStylesTDD.headers.get('name');
      headerElement = header.element;

      // @ts-expect-error - Accessing private controller for testing
      expect(headerElement._adoptedStylesController.hasAdoptedStyles).to.be.true;

      const customDiv = headerElement.shadowRoot!.querySelector('.custom-header-class');
      expect(customDiv).to.exist;

      const computedStyle = window.getComputedStyle(customDiv!);
      expect(computedStyle.color).to.equal('rgb(0, 255, 0)');
      expect(computedStyle.textTransform).to.equal('uppercase');
    });

    it('should adopt styles when cell template is set dynamically', async () => {
      let cell = adoptRootStylesTDD.rows.first.cells.get(0);
      let cellElement = cell.element;

      expect(cellElement.adoptRootStyles).to.be.true;
      // @ts-expect-error - Accessing private controller for testing
      expect(cellElement._adoptedStylesController.hasAdoptedStyles).to.be.false;

      const column = adoptRootStylesTDD.grid.querySelector('igc-grid-lite-column')!;
      column.cellTemplate = (ctx: IgcCellContext<TestData>) =>
        litHtml`<div class="custom-cell-class">${ctx.value}</div>`;
      await adoptRootStylesTDD.grid.updateComplete;
      await nextFrame();

      cell = adoptRootStylesTDD.rows.first.cells.get(0);
      cellElement = cell.element;

      // @ts-expect-error - Accessing private controller for testing
      expect(cellElement._adoptedStylesController.hasAdoptedStyles).to.be.true;

      const customDiv = cellElement.shadowRoot!.querySelector('.custom-cell-class');
      expect(customDiv).to.exist;

      const computedStyle = window.getComputedStyle(customDiv!);
      expect(computedStyle.color).to.equal('rgb(255, 0, 0)');
      expect(computedStyle.fontWeight).to.equal('700');
    });
  });
});
