import { elementUpdated, expect, html } from '@open-wc/testing';
import type { IgcGridLiteColumn } from '../src/index.js';
import { GRID_COLUMN_TAG } from '../src/internal/tags.js';
import type { IgcCellContext, Keys } from '../src/internal/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import data, { type TestData } from './utils/test-data.js';

const TDD = new GridTestFixture(data, { width: '1000px' });
const defaultKeys = Object.keys(data[0]) as Array<Keys<TestData>>;

describe('Column configuration', () => {
  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  describe('Binding', () => {
    it('Through attribute', async () => {
      expect(TDD.grid.columns).lengthOf(defaultKeys.length);

      for (const key of defaultKeys) {
        expect(TDD.grid.getColumn(key)).to.exist;
        expect(TDD.headers.get(key).element).to.exist;
      }
    });

    it('After initial render', async () => {
      const newKeys: Array<Keys<TestData>> = ['id', 'name'];

      TDD.grid.replaceChildren(
        ...newKeys.map((key) => {
          const col = document.createElement(GRID_COLUMN_TAG) as IgcGridLiteColumn<TestData>;
          col.field = key;
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

      // 4 columns * 1fr out of 1000px = 250px

      headerWidthEquals(250);
      cellWidthEquals(250);

      // 0.5 * 1000 = 500
      await TDD.updateColumns({ field: 'id', width: '50%' });
      headerWidthEquals(500);
      cellWidthEquals(500);

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
});
