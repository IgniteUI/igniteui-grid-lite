import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import type { Keys } from '../../src/internal/types.js';
import { NumberOperands } from '../../src/operations/filter/operands/number.js';
import { StringOperands } from '../../src/operations/filter/operands/string.js';
import type { FilterExpression, OperandKeys } from '../../src/operations/filter/types.js';
import GridTestFixture from '../utils/grid-fixture.js';
import data, { type TestData } from '../utils/test-data.js';

class FilterFixture<T extends object> extends GridTestFixture<T> {
  public override updateConfig(): void {
    this.columnConfig = this.columnConfig.map((config) => ({
      ...config,
      filterable: true,
    }));
  }

  public get filterableColumns() {
    return this.grid.columns.filter((each) => each.filterable);
  }

  public get activeChips() {
    return this.filterRow.activeStateChips;
  }

  public async activateFilterRow(key: Keys<T>) {
    this.filterRow.open(key);
    await this.waitForUpdate();
  }

  public async closeFilterRow() {
    this.filterRow.close();
    await this.waitForUpdate();
  }

  public async resetFilterRow() {
    this.filterRow.reset();
    await this.waitForUpdate();
  }

  public async filterByInput(value: string) {
    this.filterRow.fireInputEvent(value);
    await this.waitForUpdate();
  }

  public async commitInput() {
    this.filterRow.commitInput();
    await this.waitForUpdate();
  }

  public async resetInput() {
    this.filterRow.resetInput();
    await this.waitForUpdate();
  }

  public async changeFilterCondition(name: OperandKeys<T[keyof T]>) {
    this.filterRow.openDropdown();
    await this.waitForUpdate();
    this.filterRow.selectDropdownCondition(name);
    await this.waitForUpdate();
  }

  public async toggleCriteria(element: HTMLElement) {
    element.click();
    await this.waitForUpdate();
  }

  public async selectChip(chip: HTMLElement) {
    (chip.shadowRoot!.querySelector('[part="base"]') as HTMLElement).click();
    await this.waitForUpdate();
  }

  public async removeChip(chip: HTMLElement) {
    (chip.shadowRoot!.querySelector('slot[name="remove"]') as HTMLElement).click();
    await this.waitForUpdate();
  }

  public assertHasHeaderFilterStyle(name: Keys<T>) {
    expect(this.headers.get(name).hasFilterStyle).to.be.true;
  }

  public assertDoesNotHaveHeaderFilterStyle(name: Keys<T>) {
    expect(this.headers.get(name).hasFilterStyle).to.be.false;
  }

  public assertActiveFilterRowState() {
    expect(this.filterRow.active).to.be.true;
    expect(this.filterRow.input).to.not.be.null;
    expect(this.filterRow.dropdown).to.not.be.null;
  }

  public assertInactiveFilterRowState() {
    expect(this.filterRow.active).to.be.false;
    expect(this.filterRow.input).to.be.null;
    expect(this.filterRow.dropdown).to.be.null;
  }
}

const TDD = new FilterFixture(data);
const keys = ['name', 'address.city'] as const;

describe('Grid UI filter', () => {
  beforeEach(async () => {
    await TDD.setUp();
  });

  afterEach(() => {
    TDD.tearDown();
  });

  describe('Default UI state', () => {
    it('Default state for no filterable columns', async () => {
      await TDD.updateColumns(TDD.columnConfig.map((each) => ({ ...each, filterable: false })));

      expect(TDD.filterRow.element).to.not.exist;
    });

    it('Default state with filterable columns', async () => {
      expect(TDD.filterRow.element).to.exist;
    });

    it('Correct number of UI elements', async () => {
      expect(TDD.filterableColumns).lengthOf(TDD.filterRow.inactiveStateChips.length);

      await TDD.updateColumns({ field: 'name', filterable: false });
      expect(TDD.filterableColumns).lengthOf(TDD.filterRow.inactiveStateChips.length);

      await TDD.updateColumns({ field: 'name', filterable: true });
      expect(TDD.filterableColumns).lengthOf(TDD.filterRow.inactiveStateChips.length);
    });

    keys.forEach((key) => {
      it('Default state when clicking on a filter chip', async () => {
        await TDD.activateFilterRow(key);

        TDD.assertActiveFilterRowState();
        TDD.assertHasHeaderFilterStyle(key);
      });

      it('Default state when exiting from active filter row state', async () => {
        await TDD.activateFilterRow(key);
        await TDD.closeFilterRow();

        TDD.assertInactiveFilterRowState();
        TDD.assertDoesNotHaveHeaderFilterStyle(key);
      });
    });

    it('Correctly changes header style for active column', async () => {
      await TDD.activateFilterRow('name');

      TDD.assertHasHeaderFilterStyle('name');

      await TDD.clickHeader('id');

      TDD.assertActiveFilterRowState();
      TDD.assertDoesNotHaveHeaderFilterStyle('name');
      TDD.assertHasHeaderFilterStyle('id');
    });

    it('Does not change header style when clicking on a non-filterable column', async () => {
      await TDD.updateColumns({ field: 'active', filterable: false });
      await TDD.activateFilterRow('name');
      await TDD.clickHeader('active');

      TDD.assertActiveFilterRowState();
      TDD.assertHasHeaderFilterStyle('name');
      TDD.assertDoesNotHaveHeaderFilterStyle('active');
    });
  });

  describe('Default UI filtering', () => {
    keys.forEach((key) => {
      it('Chip state on input', async () => {
        await TDD.activateFilterRow(key);
        await TDD.filterByInput('a');

        expect(TDD.activeChips).lengthOf(1);
        expect(TDD.activeChips[0].textContent?.trim()).to.equal('a');

        await TDD.filterByInput('');
        expect(TDD.activeChips).to.be.empty;
      });
    });

    it('State on Enter keypress', async () => {
      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');
      await TDD.commitInput();

      expect(TDD.activeChips).lengthOf(1);
      expect(TDD.grid.totalItems).to.equal(2);
      expect(TDD.filterRow.active).to.be.true;
    });

    it('State on Escape keypress', async () => {
      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');
      await TDD.resetInput();

      expect(TDD.activeChips).to.be.empty;
      expect(TDD.grid.totalItems).to.equal(2);
      expect(TDD.filterRow.active).to.be.false;
    });

    it('State on Reset button', async () => {
      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');
      await TDD.commitInput();

      expect(TDD.activeChips).lengthOf(1);
      expect(TDD.grid.totalItems).to.equal(2);

      await TDD.resetFilterRow();
      expect(TDD.activeChips).to.be.empty;
      expect(TDD.grid.totalItems).to.not.equal(2);
    });

    it('Chip interactions', async () => {
      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');
      await TDD.commitInput();
      await TDD.filterByInput('b');
      await TDD.commitInput();

      await TDD.selectChip(TDD.activeChips[0]);

      expect(TDD.activeChips[0]).has.attribute('selected');
      expect(TDD.filterRow.input.value).to.equal(TDD.activeChips[0].textContent?.trim());

      await TDD.removeChip(TDD.activeChips.at(-1)!);
      expect(TDD.activeChips).lengthOf(1);
    });

    it('Condition changed', async () => {
      await TDD.activateFilterRow('importance');
      await TDD.filterByInput('l');

      expect(TDD.grid.totalItems).to.equal(3);

      await TDD.changeFilterCondition('endsWith');
      expect(TDD.grid.totalItems).to.equal(0);

      await TDD.changeFilterCondition('startsWith');
      expect(TDD.grid.totalItems).to.equal(3);
    });

    it('Criteria changed', async () => {
      await TDD.activateFilterRow('importance');
      await TDD.changeFilterCondition('startsWith');

      await TDD.filterByInput('l');
      await TDD.commitInput();
      await TDD.filterByInput('h');
      await TDD.commitInput();

      expect(TDD.grid.totalItems).to.equal(0);

      await TDD.toggleCriteria(TDD.filterRow.activeCriteriaButtons[0]);
      expect(TDD.grid.totalItems).to.equal(5);
    });

    it('String column, single filter [case insensitive]', async () => {
      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');

      expect(TDD.grid.totalItems).to.equal(2);

      await TDD.filterByInput('A');
      expect(TDD.grid.totalItems).to.equal(2);
    });

    it('String column, single filter [case sensitive]', async () => {
      await TDD.updateColumns({
        field: 'name',
        filterable: true,
        filteringCaseSensitive: true,
      });
      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');

      expect(TDD.grid.totalItems).to.equal(1);
      expect(TDD.rows.first.data.name).to.equal('a');

      await TDD.filterByInput('A');

      expect(TDD.grid.totalItems).to.equal(1);
      expect(TDD.rows.first.data.name).to.equal('A');
    });

    it('Number column, single filter [correct type]', async () => {
      await TDD.updateColumns({ field: 'id', dataType: 'number', filterable: true });

      await TDD.activateFilterRow('id');
      await TDD.filterByInput('3');

      expect(TDD.grid.totalItems).to.equal(1);
    });

    it('String column, multiple filters [AND]', async () => {
      await TDD.activateFilterRow('importance');
      await TDD.filterByInput('l');
      await TDD.commitInput();
      await TDD.filterByInput('h');
      await TDD.commitInput();

      expect(TDD.grid.totalItems).to.equal(0);
    });

    it('String column, multiple filters [OR]', async () => {
      await TDD.activateFilterRow('importance');
      await TDD.filterByInput('l');
      await TDD.commitInput();
      await TDD.filterByInput('h');
      await TDD.commitInput();

      await TDD.toggleCriteria(TDD.filterRow.activeCriteriaButtons[0]);
      expect(TDD.grid.totalItems).to.equal(5);
    });
  });

  describe('Events', () => {
    it('Event sequence', async () => {
      const spy = sinon.spy(TDD.grid, 'emitEvent');

      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');

      expect(spy.callCount).to.equal(2);

      const [filtering, filtered] = [spy.firstCall, spy.secondCall];

      expect(filtering.firstArg).to.equal('filtering');
      expect(filtered.firstArg).to.equal('filtered');
    });

    it('Cancellable events', async () => {
      const spy = sinon.spy(TDD.grid, 'emitEvent');

      TDD.grid.addEventListener('filtering', (e) => e.preventDefault(), { once: true });

      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');

      expect(spy.callCount).to.equal(1);

      // No filter operation
      expect(TDD.grid.totalItems).to.equal(8);
    });

    it('Modify event arguments mid-flight', async () => {
      const spy = sinon.spy(TDD.grid, 'emitEvent');

      const expression: FilterExpression<TestData> = {
        key: 'id',
        condition: NumberOperands.greaterThan,
        searchTerm: 7,
      };

      TDD.grid.addEventListener(
        'filtering',
        (e) => Object.assign(e.detail.expressions[0], expression),
        { once: true }
      );

      await TDD.activateFilterRow('name');
      await TDD.filterByInput('a');

      const eventData = spy.firstCall.lastArg.detail;

      expect(eventData.expressions[0].key).to.equal('id');
      expect(eventData.expressions[0].searchTerm).to.equal(7);
      expect(eventData.expressions[0].condition.name).to.equal('greaterThan');

      expect(TDD.grid.totalItems).to.equal(1);
      expect(TDD.rows.first.data.id).to.equal(8);
    });
  });

  describe('API', () => {
    it('Honors column configuration parameters', async () => {
      await TDD.updateColumns({
        field: 'name',
        filterable: true,
        filteringCaseSensitive: true,
      });
      await TDD.filter({ key: 'name', condition: 'contains', searchTerm: 'D' });

      expect(TDD.grid.totalItems).to.equal(1);
    });

    it('Honors overwriting column configuration parameters', async () => {
      await TDD.updateColumns({
        field: 'name',
        filterable: true,
        filteringCaseSensitive: true,
      });
      await TDD.filter({
        key: 'name',
        condition: 'contains',
        searchTerm: 'D',
        caseSensitive: false,
      });

      expect(TDD.grid.totalItems).to.equal(2);
    });

    it('Use of an operand param', async () => {
      await TDD.filter({ key: 'name', condition: StringOperands.contains, searchTerm: 'b' });
      expect(TDD.grid.totalItems).to.equal(2);
    });

    it('Single expression (single column)', async () => {
      await TDD.filter({ key: 'name', condition: 'contains', searchTerm: 'a' });
      expect(TDD.grid.totalItems).to.equal(2);
    });

    it('Single expression (multiple columns)', async () => {
      await TDD.updateColumns({ field: 'id', dataType: 'number' });
      await TDD.filter([
        { key: 'id', condition: 'greaterThan', searchTerm: 4 },
        { key: 'importance', condition: 'startsWith', searchTerm: 'medium' },
      ]);

      expect(TDD.grid.totalItems).to.equal(1);
    });

    it('Multiple expressions (single column)', async () => {
      await TDD.updateColumns({ field: 'id', dataType: 'number' });
      await TDD.filter([
        { key: 'id', condition: 'greaterThan', searchTerm: 4 },
        { key: 'id', condition: 'lessThan', searchTerm: 6 },
      ]);

      expect(TDD.grid.totalItems).to.equal(1);
    });

    it('Multiple expressions (multiple columns)', async () => {
      await TDD.updateColumns({ field: 'id', dataType: 'number' });

      await TDD.filter([
        { key: 'id', condition: 'greaterThan', searchTerm: 1 },
        { key: 'id', condition: 'lessThan', searchTerm: 5 },
        { key: 'name', condition: StringOperands.contains, searchTerm: 'b' },
        { key: 'name', condition: StringOperands.endsWith, searchTerm: 'd', criteria: 'or' },
      ]);

      expect(TDD.grid.totalItems).to.equal(2);
    });

    it('API clear state', async () => {
      await TDD.filter([{ key: 'name', condition: 'contains', searchTerm: 'a' }]);
      expect(TDD.grid.totalItems).to.equal(2);

      await TDD.clearFilter();
      expect(TDD.grid.totalItems).to.equal(data.length);
    });

    it('API clear state (by key)', async () => {
      await TDD.updateColumns({ field: 'active', dataType: 'boolean' });
      await TDD.filter([
        { key: 'name', condition: 'contains', searchTerm: 'a' },
        { key: 'name', condition: 'startsWith', searchTerm: 'a' },
        { key: 'active', condition: 'true' },
      ]);
      expect(TDD.grid.filterExpressions).lengthOf(3);

      await TDD.clearFilter('name');
      expect(TDD.grid.filterExpressions).lengthOf(1);
    });
  });
});
