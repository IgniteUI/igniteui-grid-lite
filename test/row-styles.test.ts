import { expect } from '@open-wc/testing';
import { resetMouse, sendMouse } from '@web/test-runner-commands';
import type IgcGridLiteRow from '../src/components/row.js';
import { GRID_TAG } from '../src/internal/tags.js';
import GridTestFixture from './utils/grid-fixture.js';
import data, { type TestData } from './utils/test-data.js';

const ROW_STATES = ['odd', 'even', 'last'] as const;
const [ODD, EVEN, LAST] = ROW_STATES;

const ODD_COLOR = 'rgb(0, 0, 255)';
const EVEN_COLOR = 'rgb(255, 0, 0)';
const HOVER_COLOR = 'rgb(255, 255, 0)';
const NO_DIVIDER = '0px';

const SCROLL_DATA = Array.from({ length: 50 }, () => data).flat();

type Row = IgcGridLiteRow<TestData>;
type RowState = (typeof ROW_STATES)[number];
type Stripe = typeof ODD | typeof EVEN;

const TDD = new GridTestFixture(data);

/** Index 0 is odd. */
const isEven = (row: Row) => row.index % 2 === 1;

const isLast = (row: Row) => row.index === TDD.grid.dataView.length - 1;

const dividerOf = (row: Row) => getComputedStyle(row).borderBlockEndWidth;

const backgroundOf = (row: Row) => getComputedStyle(row).backgroundColor;

const statesOf = (row: Row) => ROW_STATES.filter((state) => row.matches(`:state(${state})`));

/** Background, text and cell border colors of a row. */
function colorsOf(row: Row): string[] {
  const { backgroundColor, color } = getComputedStyle(row);
  const { borderInlineEndColor } = getComputedStyle(row.cells.at(0)!);

  return [backgroundColor, color, borderInlineEndColor];
}

/** Paints the background, text and cell borders of a stripe in one color. */
function paintStripe(stripe: Stripe, color: string): void {
  const tokens = [
    `--ig-grid-row-${stripe}-background`,
    `--ig-grid-row-${stripe}-text-color`,
    `--ig-grid-body-column-border-color-${stripe}`,
  ];

  for (const token of tokens) {
    TDD.grid.style.setProperty(token, color);
  }
}

function expectDividers(): void {
  for (const row of TDD.grid.rows.filter((row) => !isLast(row))) {
    expect(dividerOf(row), `row ${row.index}`).to.not.equal(NO_DIVIDER);
  }

  expect(dividerOf(TDD.grid.rows.find(isLast)!)).to.equal(NO_DIVIDER);
}

function expectStates(): void {
  for (const row of TDD.grid.rows) {
    const stripe = isEven(row) ? EVEN : ODD;
    const expected: RowState[] = isLast(row) ? [stripe, LAST] : [stripe];

    expect(statesOf(row), `row ${row.index}`).to.deep.equal(expected);
  }
}

describe('Grid body row styles', () => {
  // No palette loads in tests: the default divider color is unset. Set it
  // before the first render: rows growing under a scroll trip a ResizeObserver loop.
  const dividerColor = document.createElement('style');
  dividerColor.textContent = `${GRID_TAG} { --ig-grid-row-border-color: green; }`;

  before(() => document.head.append(dividerColor));
  after(() => dividerColor.remove());

  beforeEach(async () => await TDD.setUp());

  afterEach(async () => {
    await resetMouse();
    await TDD.tearDown();
  });

  it('draws a divider under every row but the last', () => {
    expectDividers();
  });

  it('alternates the odd and even tokens by data index', () => {
    paintStripe(ODD, ODD_COLOR);
    paintStripe(EVEN, EVEN_COLOR);

    for (const row of TDD.grid.rows) {
      const color = isEven(row) ? EVEN_COLOR : ODD_COLOR;
      expect(colorsOf(row), `row ${row.index}`).to.deep.equal([color, color, color]);
    }
  });

  it('paints a hovered row over its stripe', async () => {
    paintStripe(EVEN, EVEN_COLOR);
    TDD.grid.style.setProperty('--ig-grid-row-hover-background', HOVER_COLOR);

    const row = TDD.grid.rows.find(isEven)!;
    const { x, y, width, height } = row.getBoundingClientRect();
    const center: [number, number] = [Math.round(x + width / 2), Math.round(y + height / 2)];

    await sendMouse({ type: 'move', position: center });

    expect(backgroundOf(row)).to.equal(HOVER_COLOR);
  });

  it('matches the odd, even and last states by data index', () => {
    expectStates();
  });

  it('exposes the states to document styles through the row part', () => {
    const style = document.createElement('style');
    style.textContent = `${GRID_TAG}::part(row):state(${EVEN}) { background: ${EVEN_COLOR}; }`;

    // Inside the fixture wrapper: removed on teardown.
    TDD.grid.after(style);

    for (const row of TDD.grid.rows.filter(isEven)) {
      expect(backgroundOf(row), `row ${row.index}`).to.equal(EVEN_COLOR);
    }
  });

  it('moves the last row styles when the data shrinks', async () => {
    await TDD.updateProperty('data', data.slice(0, 3));

    expectDividers();
    expectStates();
  });

  it('moves the last row styles when the data grows', async () => {
    await TDD.updateProperty('data', [...data, ...data]);

    expectDividers();
    expectStates();
  });

  it('follows the data index of recycled rows', async () => {
    await TDD.updateProperty('data', SCROLL_DATA);

    const body = TDD.gridBody;
    body.scrollTo({ top: body.scrollHeight });
    await body.layoutComplete;

    expectDividers();
    expectStates();
  });
});
