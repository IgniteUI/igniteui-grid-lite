import { expect } from '@open-wc/testing';
import type { IgcChipComponent } from 'igniteui-webcomponents';
import { ariaOf } from '../src/internal/a11y.js';
import type { ColumnConfiguration } from '../src/internal/types.js';
import GridTestFixture from './utils/grid-fixture.js';
import data, { generateFieldPaths, type TestData } from './utils/test-data.js';

const COLUMN_COUNT = generateFieldPaths(data[0]).length;

/** ARIA semantics live on ElementInternals. `getAttribute` cannot see them. */
function aria(element: Element): ARIAMixin {
  return ariaOf(element)!;
}

/** Grid with a filter row: every column is sortable and filterable. */
class A11yFixture extends GridTestFixture<TestData> {
  public override updateConfig(): void {
    this.columnConfig = this.columnConfig.map((config) => ({
      ...config,
      sortable: true,
      filterable: true,
    }));
  }

  public async openFilterRow(key: keyof TestData) {
    this.filterRow.open(key);
    await this.waitForUpdate();
  }

  public async pressOnConditionTrigger(key: string) {
    this.filterRow.dropdownTarget.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, composed: true })
    );
    await this.waitForUpdate();
  }

  public previewCells(): HTMLElement[] {
    return Array.from(
      this.filterRow.element.renderRoot.querySelectorAll('[part~="filter-row-preview"]')
    );
  }

  public activeCell(): HTMLElement {
    return this.filterRow.element.renderRoot.querySelector('[part~="active-state"]')!;
  }

  /** Preview chips for an applied expression. Plain "Filter" chips are not removable. */
  public expressionChips(): IgcChipComponent[] {
    return Array.from(
      this.filterRow.element.renderRoot.querySelectorAll(
        '[part~="filter-row-preview"] igc-chip[removable]'
      )
    );
  }
}

describe('Grid ARIA', () => {
  const TDD = new A11yFixture(data);

  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  describe('Roles', () => {
    it('follows the ARIA grid pattern', () => {
      expect(aria(TDD.grid).role).to.equal('grid');
      expect(aria(TDD.headerRow).role).to.equal('row');
      expect(aria(TDD.headers.first.element).role).to.equal('columnheader');
      expect(aria(TDD.gridBody).role).to.equal('rowgroup');
      expect(aria(TDD.rows.first.element).role).to.equal('row');
      expect(aria(TDD.rows.first.cells.first.element).role).to.equal('gridcell');
    });

    it('models the filter row as a row of gridcells', () => {
      expect(aria(TDD.filterRow.element).role).to.equal('row');
      expect(aria(TDD.filterRow.element).ariaLabel).to.equal('Column filters');

      const cells = TDD.previewCells();

      expect(cells).to.have.lengthOf(COLUMN_COUNT);
      expect(cells.map((cell) => cell.getAttribute('role'))).to.eql(cells.map(() => 'gridcell'));
      expect(cells.map((cell) => cell.getAttribute('aria-colindex'))).to.eql([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
    });

    it('models the open filter editor as a single gridcell', async () => {
      await TDD.openFilterRow('name');

      expect(TDD.activeCell().getAttribute('role')).to.equal('gridcell');
    });
  });

  describe('Sort state', () => {
    it('follows the sort cycle of the column', async () => {
      const sortState = () => aria(TDD.headers.get('name').element).ariaSort;

      expect(sortState()).to.equal('none');

      await TDD.sortHeader('name');
      expect(sortState()).to.equal('ascending');

      await TDD.sortHeader('name');
      expect(sortState()).to.equal('descending');

      await TDD.sortHeader('name');
      expect(sortState()).to.equal('none');
    });

    it('is not exposed on a header which cannot be sorted', async () => {
      await TDD.updateColumns({ field: 'name', sortable: false } as ColumnConfiguration<TestData>);

      expect(aria(TDD.headers.get('name').element).ariaSort).to.be.null;
    });
  });

  describe('Counts and indices', () => {
    it('counts the header rows and the visible columns', () => {
      // Header row + filter row + data rows.
      expect(aria(TDD.grid).ariaRowCount).to.equal(`${data.length + 2}`);
      expect(aria(TDD.grid).ariaColCount).to.equal(`${COLUMN_COUNT}`);
    });

    it('indexes the header, filter and data rows in one sequence', () => {
      expect(aria(TDD.headerRow).ariaRowIndex).to.equal('1');
      expect(aria(TDD.filterRow.element).ariaRowIndex).to.equal('2');
      expect(aria(TDD.rows.first.element).ariaRowIndex).to.equal('3');
      expect(aria(TDD.rows.get(1).element).ariaRowIndex).to.equal('4');
    });

    it('indexes headers and cells left to right', () => {
      const headers = TDD.headerRow.headers.map((header) => aria(header).ariaColIndex);
      const cells = TDD.rows.first.element.cells.map((cell) => aria(cell).ariaColIndex);

      expect(headers).to.eql(['1', '2', '3', '4', '5', '6']);
      expect(cells).to.eql(headers);
    });

    it('leaves hidden columns out of the column index space', async () => {
      await TDD.updateColumns({ field: 'name', hidden: true } as ColumnConfiguration<TestData>);

      const headers = TDD.headerRow.headers.map((header) => aria(header).ariaColIndex);

      expect(aria(TDD.grid).ariaColCount).to.equal(`${COLUMN_COUNT - 1}`);
      expect(headers).to.eql(['1', '2', '3', '4', '5']);
      expect(TDD.rows.first.element.cells.map((cell) => aria(cell).ariaColIndex)).to.eql(headers);
    });
  });

  describe('Active cell', () => {
    it('is the only cell exposed as selected', async () => {
      const first = TDD.rows.first.cells.get('id');
      const second = TDD.rows.first.cells.get('name');

      await TDD.clickCell(first);
      expect(aria(first.element).ariaSelected).to.equal('true');
      expect(aria(second.element).ariaSelected).to.be.null;

      await TDD.clickCell(second);
      expect(aria(first.element).ariaSelected).to.be.null;
      expect(aria(second.element).ariaSelected).to.equal('true');
    });
  });

  describe('Filter row controls', () => {
    it('names the column filter trigger', () => {
      expect(TDD.filterRow.getInactiveChip('name').getAttribute('aria-label')).to.equal(
        'Filter name'
      );
    });

    it('names the editor input and the condition trigger', async () => {
      await TDD.openFilterRow('name');

      const trigger = TDD.filterRow.dropdownTarget;

      expect(TDD.filterRow.input.placeholder).to.equal('Filter name');
      expect(trigger.getAttribute('role')).to.equal('button');
      expect(trigger.getAttribute('aria-haspopup')).to.equal('listbox');
      expect(trigger.getAttribute('aria-label')).to.equal('Filter condition: Contains');
    });

    it('opens the condition list from the keyboard', async () => {
      await TDD.openFilterRow('name');

      await TDD.pressOnConditionTrigger('Enter');

      expect(TDD.filterRow.dropdown.open).to.be.true;
    });

    it('names the chip actions after the expression they act on', async () => {
      await TDD.filter({ key: 'name', condition: 'contains', searchTerm: 'A' } as any);

      const chip = TDD.expressionChips()[0];

      expect(chip.resourceStrings.chip_remove).to.equal('Remove filter name contains A');
      expect(chip.resourceStrings.chip_select).to.equal('Edit filter name contains A');
    });
  });
});

describe('Grid ARIA without a filter row', () => {
  const TDD = new GridTestFixture<TestData>(data);

  beforeEach(async () => await TDD.setUp());
  afterEach(() => TDD.tearDown());

  it('reserves a single header row in the row index space', () => {
    expect(aria(TDD.grid).ariaRowCount).to.equal(`${data.length + 1}`);
    expect(aria(TDD.headerRow).ariaRowIndex).to.equal('1');
    expect(aria(TDD.rows.first.element).ariaRowIndex).to.equal('2');
  });
});
