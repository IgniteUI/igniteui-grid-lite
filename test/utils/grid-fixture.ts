import { elementUpdated, fixture, fixtureCleanup, html, nextFrame } from '@open-wc/testing';
import IgcFilterRow from '../../src/components/filter-row.js';
import { IgcGridLite } from '../../src/components/grid.js';
import IgcGridLiteHeaderRow from '../../src/components/header-row.js';
import IgcVirtualizer from '../../src/components/virtualizer.js';
import type { ColumnConfiguration, Keys } from '../../src/internal/types.js';
import { isNumber } from '../../src/internal/utils.js';
import type { FilterExpression } from '../../src/operations/filter/types.js';
import type { SortingExpression } from '../../src/operations/sort/types.js';
import type CellTestFixture from './cell-fixture.js';
import FilterRowFixture from './filter-row.fixture.js';
import HeaderTestFixture from './header-fixture.js';
import RowTestFixture from './row-fixture.js';

interface RowCollection<T extends object> {
  first: RowTestFixture<T>;
  last: RowTestFixture<T>;
  get: (id: number) => RowTestFixture<T>;
}

interface HeaderCollection<T extends object> {
  first: HeaderTestFixture<T>;
  last: HeaderTestFixture<T>;
  get: (id: Keys<T> | number) => HeaderTestFixture<T>;
}

export default class GridTestFixture<T extends object> {
  public grid!: IgcGridLite<T>;
  public columnConfig: ColumnConfiguration<T>[];

  constructor(
    protected data: T[],
    protected parentStyle?: Partial<CSSStyleDeclaration>
  ) {
    this.columnConfig = Object.keys(data.at(0)!).map(
      (field) => ({ field }) as ColumnConfiguration<T>
    );
  }

  protected async waitForUpdate() {
    await Promise.all([elementUpdated(this.grid), nextFrame]);
    await nextFrame();
  }

  public registerComponents() {
    IgcGridLite.register();
  }

  public updateConfig() {}

  public setupParentNode(styles: Partial<CSSStyleDeclaration> = { height: '800px' }) {
    const parentNode = document.createElement('div');
    this.parentStyle
      ? Object.assign(parentNode.style, this.parentStyle)
      : Object.assign(parentNode.style, styles);
    return parentNode;
  }

  public setupTemplate() {
    return html`
      <igc-grid-lite .data=${this.data}>
        ${this.columnConfig.map(
          (col) =>
            html`<igc-grid-lite-column
              .field=${col.field}
              ?filterable=${col.filterable}
              ?filtering-case-sensitive=${col.filteringCaseSensitive}
              ?sortable=${col.sortable}
              ?sorting-case-sensitive=${col.sortingCaseSensitive}
              .sortConfiguration=${col.sortConfiguration}
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

  public async setUp() {
    this.registerComponents();
    this.updateConfig();

    this.grid = await fixture(this.setupTemplate(), { parentNode: this.setupParentNode() });
    await this.gridBody.layoutComplete;
  }

  public tearDown() {
    return fixtureCleanup();
  }

  public async updateProperty<K extends keyof IgcGridLite<T>>(prop: K, value: IgcGridLite<T>[K]) {
    Object.assign(this.grid, { [prop]: value });
    await this.waitForUpdate();
  }

  public get filterRow() {
    return new FilterRowFixture<T>(
      this.grid.renderRoot.querySelector(IgcFilterRow.tagName)! as unknown as IgcFilterRow<T>
    );
  }

  public get gridBody() {
    return this.grid.renderRoot.querySelector(IgcVirtualizer.tagName)!;
  }

  public get dataState() {
    // @ts-expect-error - Protected member access
    return this.grid._dataState;
  }

  public get resizePart() {
    return this.grid.renderRoot.querySelector('[part~="resize-indicator"]') as HTMLElement;
  }

  public get headerRow() {
    return this.grid.renderRoot.querySelector<IgcGridLiteHeaderRow<T>>(
      IgcGridLiteHeaderRow.tagName
    )!;
  }

  public get rows(): RowCollection<T> {
    return {
      first: this.getRow(0),
      last: this.getRow(-1),
      get: (id: number) => this.getRow(id),
    };
  }

  public get headers(): HeaderCollection<T> {
    return {
      first: this.getHeader(0),
      last: this.getHeader(-1),
      get: (id) => this.getHeader(id),
    };
  }

  protected getRow(index: number) {
    return new RowTestFixture(this.grid.rows.at(index)!);
  }

  protected getHeader(id: Keys<T> | number) {
    return new HeaderTestFixture(
      isNumber(id)
        ? this.headerRow.headers.at(id)!
        : this.headerRow.headers.find(({ column }) => column.field === id)!
    );
  }

  public async sortHeader(key: Keys<T>) {
    this.getHeader(key).sort();
    await this.waitForUpdate();
  }

  public async startResizeHeader(key: Keys<T>) {
    this.getHeader(key).startResize();
    await this.waitForUpdate();
  }

  public async stopResizeHeader(key: Keys<T>) {
    this.getHeader(key).stopResize();
    await this.waitForUpdate();
  }

  public async resizeHeader(key: Keys<T>, x: number) {
    this.getHeader(key).resize(x);
    await this.waitForUpdate();
  }

  public async autoSizeHeader(key: Keys<T>) {
    this.getHeader(key).autosize();
    await this.waitForUpdate();
  }

  public async clickCell(cell: CellTestFixture<T>) {
    cell.click();
    await this.waitForUpdate();
  }

  public async clickHeader(name: Keys<T>) {
    this.headers.get(name).element.click();
    await this.waitForUpdate();
  }

  public async fireNavigationEvent(options?: KeyboardEventInit) {
    this.gridBody.dispatchEvent(
      new KeyboardEvent('keydown', Object.assign({ composed: true, bubbles: true }, options))
    );
    await this.waitForUpdate();
  }

  public async updateColumns(columns: ColumnConfiguration<T> | ColumnConfiguration<T>[]) {
    this.grid.updateColumns(columns);
    await this.waitForUpdate();
    return this;
  }

  public async sort(config: SortingExpression<T> | SortingExpression<T>[]) {
    this.grid.sort(config);
    await this.waitForUpdate();
    return this;
  }

  public async filter(config: FilterExpression<T> | FilterExpression<T>[]) {
    this.grid.filter(config);
    await this.waitForUpdate();
    return this;
  }

  public async clearSort(key?: Keys<T>) {
    this.grid.clearSort(key);
    await this.waitForUpdate();
    return this;
  }

  public async clearFilter(key?: Keys<T>) {
    this.grid.clearFilter(key);
    await this.waitForUpdate();
    return this;
  }
}
