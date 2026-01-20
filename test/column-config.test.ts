import { elementUpdated, expect, html } from '@open-wc/testing';
import type { IgcGridLiteColumn } from '../src/index.js';
import { GRID_COLUMN_TAG } from '../src/internal/tags.js';
import type { IgcCellContext, Keys } from '../src/internal/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import data, { generateFieldPaths, type TestData } from './utils/test-data.js';

const TDD = new GridTestFixture(data, { width: '1500px' });
const defaultKeys = generateFieldPaths(data[0]);

describe('Column configuration', () => {
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  describe('Binding', () => {
    it('Through attribute', async () => {
      expect(TDD.grid.columns).lengthOf(6);

      for (const key of defaultKeys) {
        expect(TDD.grid.getColumn(key)).to.exist;
        expect(TDD.headers.get(key).element).to.exist;
      }
    });

    it('After initial render', async () => {
      const newKeys: Array<Keys<TestData>> = ['id', 'name'];

      TDD.grid.replaceChildren(
        ...newKeys.map((key, i) => {
          const col = document.createElement(GRID_COLUMN_TAG) as IgcGridLiteColumn<TestData>;
          col.field = key;
          if (i % 2 === 0) {
            const div = document.createElement('div');
            div.appendChild(col);
            return div;
          }
          return col;
        })
      );

      // TDD.grid.columns = newKeys.map((key) => ({ key }));
      await elementUpdated(TDD.grid);

      for (const key of newKeys) {
        expect(TDD.grid.getColumn(key)).to.exist;
        expect(TDD.headers.get(key).element).to.exist;
      }
    });

    it('Updating configuration', async () => {
      await TDD.updateColumns([
        { field: 'id', header: 'Primary' },
        { field: 'name', header: 'Username' },
      ]);

      expect(TDD.grid.getColumn('id')?.header).to.equal('Primary');
      expect(TDD.grid.getColumn('name')?.header).to.equal('Username');
    });
  });

  describe('Properties', () => {
    it('Header text', async () => {
      const header = 'Primary key';
      expect(TDD.headers.first.text).to.equal('id');

      await TDD.updateColumns({ field: 'id', header });
      expect(TDD.headers.first.text).to.equal(header);
    });

    it('Visibility', async () => {
      expect(TDD.headers.first.element).to.exist;

      await TDD.updateColumns({ field: 'id', hidden: true });
      expect(TDD.headers.get('id').element).to.not.exist;

      await TDD.updateColumns({ field: 'id', hidden: false });
      expect(TDD.headers.first.element).to.exist;
    });

    it('Header template', async () => {
      await TDD.updateColumns({
        field: 'id',
        headerTemplate: (props) => html`<h3>Custom template for ${props.column.field}</h3>`,
      });
      expect(TDD.headers.first.text).to.equal('Custom template for id');
      expect(TDD.headers.first.titlePart).dom.equal(
        `<span part="title">
            <span>
              <h3>Custom template for id</h3>
            </span>
          </span>`
      );
    });

    it('Cell template', async () => {
      await TDD.updateColumns({
        field: 'name',
        cellTemplate: (props: IgcCellContext<TestData, 'name'>) =>
          html`<input value=${props.value} />`,
      });

      expect(TDD.rows.first.cells.get('name').element).shadowDom.equal(
        `<input value="${data[0].name}" />`
      );
    });

    it('Width', async () => {
      const headerWidthEquals = (expected: number) =>
        expect(TDD.headers.first.element.getBoundingClientRect().width).to.equal(expected);

      const cellWidthEquals = (expected: number) =>
        expect(TDD.rows.first.cells.get('id').element.getBoundingClientRect().width).to.equal(
          expected
        );

      // 6 columns * 1fr out of 1500px = 250px

      headerWidthEquals(250);
      cellWidthEquals(250);

      // 0.5 * 1500 = 750
      await TDD.updateColumns({ field: 'id', width: '50%' });
      headerWidthEquals(750);
      cellWidthEquals(750);

      await TDD.updateColumns({ field: 'id', width: '200px' });
      headerWidthEquals(200);
      cellWidthEquals(200);
    });

    it('Resize', async () => {
      expect(TDD.grid.getColumn('name')?.resizable).to.be.false;

      await TDD.updateColumns({ field: 'name', resizable: true });

      expect(TDD.grid.getColumn('name')?.resizable).to.be.true;
      expect(TDD.headers.get('name').resizePart).to.exist;
    });
  });

  describe('Nested field columns', () => {
    it('Renders nested string field values in cells', async () => {
      const cityHeader = TDD.headers.get('address.city');
      expect(cityHeader.text).to.equal('address.city');

      const firstRowCell = TDD.rows.first.cells.get('address.city');
      expect(firstRowCell.value).to.equal(data[0].address.city);
    });

    it('Renders nested number field values in cells', async () => {
      const codeHeader = TDD.headers.get('address.code');
      expect(codeHeader.text).to.equal('address.code');

      const firstRowCell = TDD.rows.first.cells.get('address.code');
      expect(firstRowCell.value).to.equal(data[0].address.code);
    });

    it('Nested field column with custom header', async () => {
      await TDD.updateColumns({
        field: 'address.city',
        header: 'City',
      });

      expect(TDD.headers.get('address.city').text).to.equal('City');
    });

    it('Nested field column with custom cell template', async () => {
      await TDD.updateColumns({
        field: 'address.city',
        cellTemplate: (props: any) => html`<strong>${props.value}</strong>`,
      });

      expect(TDD.rows.first.cells.get('address.city').element).shadowDom.equal(
        `<strong>${data[0].address.city}</strong>`
      );
    });
  });
});
