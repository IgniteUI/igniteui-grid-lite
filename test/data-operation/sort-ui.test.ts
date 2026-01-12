import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { SORT_ICON_ASCENDING, SORT_ICON_DESCENDING } from '../../src/internal/constants.js';
import type { Keys } from '../../src/internal/types.js';
import GridTestFixture from '../utils/grid-fixture.js';
import data, { importanceComparer } from '../utils/test-data.js';

class SortFixture<T extends object> extends GridTestFixture<T> {
  public override updateConfig(): void {
    this.columnConfig = this.columnConfig.map((config) => ({ ...config, sortable: true }));
  }

  public sortDOMExists(key: Keys<T>) {
    expect(this.headers.get(key).sortPart).to.exist;
  }

  public sortDOMDoesNotExist(key: Keys<T>) {
    expect(this.headers.get(key).sortPart).to.not.exist;
  }

  public columnIsSorted(key: Keys<T>) {
    expect(this.headers.get(key).isSorted).to.be.true;
  }

  public columnIsNotSorted(key: Keys<T>) {
    expect(this.headers.get(key).isSorted).to.be.false;
  }

  public indicatorExists(key: Keys<T>) {
    expect(this.headers.get(key).sortIcon).to.exist;
  }

  public indicatorDoesNotExist(key: Keys<T>) {
    expect(this.headers.get(key).sortIcon).to.not.exist;
  }

  public indicatorIsAscending(key: Keys<T>) {
    expect(this.headers.get(key).sortIcon.name).to.equal(SORT_ICON_ASCENDING);
  }

  public indicatorIsDescending(key: Keys<T>) {
    expect(this.headers.get(key).sortIcon.name).to.equal(SORT_ICON_DESCENDING);
  }
}

const TDD = new SortFixture(data);

describe('Grid UI sort', () => {
  beforeEach(async () => {
    await TDD.setUp();
  });

  afterEach(() => {
    TDD.tearDown();
  });

  describe('Default UI', () => {
    const keys = ['id', 'address.city'] as const;
    keys.forEach((key) => {
      it('Sort icons state', async () => {
        // Default sort DOM state
        TDD.sortDOMExists(key);
        TDD.columnIsNotSorted(key);

        // Ascending state
        await TDD.sortHeader(key);
        TDD.indicatorIsAscending(key);
        TDD.columnIsSorted(key);

        // Descending state
        await TDD.sortHeader(key);
        TDD.indicatorIsDescending(key);
        TDD.columnIsSorted(key);
      });
    });

    it('Non-sortable columns have no sort DOM', async () => {
      await TDD.updateColumns({ field: 'id', sortable: false });
      TDD.sortDOMDoesNotExist('id');
    });

    it('Single sort by clicking', async () => {
      // Ascending
      await TDD.sortHeader('id');
      expect(TDD.rows.first.data.id).to.equal(1);

      // Descending
      await TDD.sortHeader('id');
      expect(TDD.rows.first.data.id).to.equal(8);
    });

    it('Multiple sort by clicking', async () => {
      // Ascending `active` & ascending `id`
      await TDD.sortHeader('active');
      await TDD.sortHeader('id');
      expect(TDD.rows.first.data.active).to.equal(false);
      expect(TDD.rows.first.data.id).to.equal(1);

      // Ascending `active` & descending `id`
      await TDD.sortHeader('id');
      expect(TDD.rows.first.data.active).to.equal(false);
      expect(TDD.rows.first.data.id).to.equal(6);
    });
  });

  describe('Grid sorting configuration', () => {
    it('Single sort with tri-state', async () => {
      await TDD.updateProperty('sortingOptions', { mode: 'single' });

      // ASC
      await TDD.sortHeader('id');
      TDD.indicatorIsAscending('id');
      TDD.columnIsSorted('id');

      // ASC by `active`, reset `id`
      await TDD.sortHeader('active');

      TDD.columnIsNotSorted('id');
      TDD.columnIsSorted('active');
      TDD.indicatorIsAscending('active');

      // ASC -> DESC
      await TDD.sortHeader('active');
      TDD.indicatorIsDescending('active');

      // Reset
      await TDD.sortHeader('active');
      TDD.columnIsNotSorted('active');
    });

    it('Multiple sort with tri-state', async () => {
      // ASC
      await TDD.sortHeader('id');

      // ASC -> DESC
      await TDD.sortHeader('active');
      await TDD.sortHeader('active');

      TDD.indicatorIsAscending('id');
      TDD.indicatorIsDescending('active');
      TDD.columnIsSorted('id');
      TDD.columnIsSorted('active');

      // Reset
      await TDD.sortHeader('active');

      TDD.indicatorIsAscending('id');
      TDD.columnIsNotSorted('active');
    });
  });

  describe('Events', () => {
    it('Event sequence', async () => {
      const spy = sinon.spy(TDD.grid, 'emitEvent');

      await TDD.sortHeader('id');
      expect(spy.callCount).to.equal(2);
      expect(TDD.rows.first.data.id).to.equal(1);

      expect(spy.firstCall.firstArg).to.equal('sorting');
      expect(spy.firstCall.lastArg).to.eql({
        detail: {
          key: 'id',
          direction: 'ascending',
          comparer: undefined,
          caseSensitive: false,
        },
        cancelable: true,
      });

      expect(spy.lastCall.firstArg).to.equal('sorted');
      expect(spy.lastCall.lastArg).to.eql({
        detail: {
          key: 'id',
          direction: 'ascending',
          comparer: undefined,
          caseSensitive: false,
        },
      });

      spy.resetHistory();

      await TDD.sortHeader('id');

      expect(spy.callCount).to.equal(2);
      expect(TDD.rows.first.data.id).to.equal(8);

      expect(spy.firstCall.firstArg).to.equal('sorting');
      expect(spy.firstCall.lastArg).to.eql({
        detail: {
          key: 'id',
          direction: 'descending',
          comparer: undefined,
          caseSensitive: false,
        },
        cancelable: true,
      });

      expect(spy.lastCall.firstArg).to.equal('sorted');
      expect(spy.lastCall.lastArg).to.eql({
        detail: {
          key: 'id',
          direction: 'descending',
          comparer: undefined,
          caseSensitive: false,
        },
      });
    });

    it('Cancellable sorting event', async () => {
      // ASC sort
      await TDD.sortHeader('id');

      TDD.grid.addEventListener('sorting', (e) => e.preventDefault(), { once: true });
      const spy = sinon.spy(TDD.grid, 'emitEvent');

      // DESC sort
      await TDD.sortHeader('id');

      expect(spy.callCount).to.equal(1);
      expect(TDD.rows.first.data.id).to.equal(1);
    });

    it('Modify event arguments mid-flight', async () => {
      const spy = sinon.spy(TDD.grid, 'emitEvent');
      TDD.grid.addEventListener(
        'sorting',
        (e) => {
          e.detail.direction = 'descending';
        },
        { once: true }
      );

      // Click for ASC sort, but modify to DESC in the handler
      await TDD.sortHeader('id');

      expect(TDD.rows.first.data.id).to.equal(8);
      expect(spy.callCount).to.equal(2);
      expect(spy.firstCall.lastArg).to.eql({
        detail: {
          key: 'id',
          direction: 'descending',
          caseSensitive: false,
          comparer: undefined,
        },
        cancelable: true,
      });
    });
  });

  describe('API', () => {
    it('Default', async () => {
      await TDD.sort({ key: 'id', direction: 'descending' });
      expect(TDD.rows.first.data.id).to.equal(8);
    });

    it('Sort works on non-sortable columns', async () => {
      await TDD.updateColumns({ field: 'id', sortable: false });
      await TDD.sort({ key: 'id', direction: 'descending' });

      expect(TDD.rows.first.data.id).to.equal(8);
    });

    it('Config object', async () => {
      await TDD.sort({ key: 'importance', direction: 'descending', comparer: importanceComparer });
      expect(TDD.rows.first.data.importance).to.equal('high');

      await TDD.sort({ key: 'importance', direction: 'ascending', comparer: importanceComparer });
      expect(TDD.rows.first.data.importance).to.equal('low');
    });

    it('Multiple expressions', async () => {
      await TDD.sort([
        {
          key: 'importance',
          direction: 'ascending',
          comparer: importanceComparer,
        },
        {
          key: 'active',
          direction: 'ascending',
        },
      ]);

      expect(TDD.rows.first.data.importance).to.equal('low');
      TDD.columnIsSorted('importance');
      TDD.columnIsSorted('active');
    });

    it('Expressions with direction `none`', async () => {
      await TDD.sort([
        {
          key: 'importance',
          direction: 'ascending',
          comparer: importanceComparer,
        },
        {
          key: 'active',
          direction: 'ascending',
        },
      ]);

      expect(TDD.rows.first.data.importance).to.equal('low');
      TDD.columnIsSorted('importance');
      TDD.columnIsSorted('active');

      await TDD.sort({ key: 'active', direction: 'none' });
      TDD.columnIsSorted('importance');
      TDD.columnIsNotSorted('active');
      expect(TDD.grid.sortingExpressions).lengthOf(1);

      await TDD.clearSort();
      await TDD.sort({ key: 'importance', direction: 'none', comparer: importanceComparer });

      TDD.columnIsNotSorted('importance');
      expect(TDD.grid.sortingExpressions).to.be.empty;
    });

    it('API clear state', async () => {
      await TDD.sort({ key: 'importance', direction: 'descending', comparer: importanceComparer });
      expect(TDD.rows.first.data.importance).to.equal('high');
      TDD.columnIsSorted('importance');

      await TDD.clearSort();
      TDD.columnIsNotSorted('importance');
    });

    it('API clear state (by key)', async () => {
      await TDD.sort([
        { key: 'importance', direction: 'descending', comparer: importanceComparer },
        { key: 'name', direction: 'ascending' },
      ]);
      expect(TDD.grid.sortingExpressions).lengthOf(2);

      await TDD.clearSort('importance');
      expect(TDD.grid.sortingExpressions).lengthOf(1);
    });
  });
});
