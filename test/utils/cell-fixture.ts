import type IgcGridLiteCell from '../../src/components/cell.js';

export default class CellTestFixture<T extends object> {
  constructor(public element: IgcGridLiteCell<T>) {}

  public get value() {
    return this.element.value;
  }

  public get active() {
    return this.element.active;
  }

  public click() {
    this.element.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
  }
}
