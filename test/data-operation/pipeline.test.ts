import { elementUpdated, expect } from '@open-wc/testing';
import sinon from 'sinon';
import type { DataPipelineHook } from '../../src/internal/types.js';
import GridTestFixture from '../utils/grid-fixture.js';
import data, { type TestData } from '../utils/test-data.js';

type PendingCall = {
  data: TestData[];
  resolve: (value: TestData[]) => void;
};

/** Sort hook which defers every call so the test controls the response order. */
function deferredSort(calls: PendingCall[]): DataPipelineHook<TestData> {
  return ({ data }) => new Promise<TestData[]>((resolve) => calls.push({ data, resolve }));
}

function byId(records: TestData[], direction: 'ascending' | 'descending'): TestData[] {
  const sorted = [...records].sort((a, b) => a.id - b.id);
  return direction === 'ascending' ? sorted : sorted.reverse();
}

class PipelineFixture extends GridTestFixture<TestData> {
  public settle() {
    return this.waitForUpdate();
  }
}

const TDD = new PipelineFixture(data);

describe('Grid data pipeline', () => {
  beforeEach(async () => {
    await TDD.setUp();
  });

  afterEach(() => {
    TDD.tearDown();
  });

  it('Applies the latest result when responses arrive out of order', async () => {
    const calls: PendingCall[] = [];
    TDD.grid.dataPipelineConfiguration = { sort: deferredSort(calls) };

    TDD.grid.sort({ key: 'id', direction: 'ascending' });
    await elementUpdated(TDD.grid);

    TDD.grid.sort({ key: 'id', direction: 'descending' });
    await elementUpdated(TDD.grid);

    expect(calls).lengthOf(2);

    // The newer request settles first, the stale one right after it.
    calls[1].resolve(byId(calls[1].data, 'descending'));
    calls[0].resolve(byId(calls[0].data, 'ascending'));

    await TDD.settle();

    expect(TDD.grid.dataView[0].id).to.equal(8);
  });

  it('A rejected hook keeps the previous data state', async () => {
    // The grid surfaces pipeline failures through console.error - capture them.
    const stub = sinon.stub(console, 'error');

    try {
      TDD.grid.dataPipelineConfiguration = {
        sort: () => Promise.reject(new Error('pipeline failure')),
      };

      await TDD.sort({ key: 'id', direction: 'descending' });

      expect(TDD.grid.dataView).lengthOf(data.length);
      expect(TDD.grid.dataView[0].id).to.equal(data[0].id);
      expect(stub.firstCall?.firstArg).to.be.instanceOf(Error);
      expect(stub.firstCall.firstArg.message).to.equal('pipeline failure');
    } finally {
      stub.restore();
    }
  });
});
