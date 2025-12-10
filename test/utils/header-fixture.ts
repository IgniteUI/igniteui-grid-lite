import type IgcGridLiteHeader from '../../src/components/header.js';

const DEFAULT_ARGS: PointerEventInit = { pointerId: 1, bubbles: true, composed: true };

export default class HeaderTestFixture<T extends object> {
  constructor(public element: IgcGridLiteHeader<T>) {}

  protected get(selector: string) {
    return this.element.renderRoot.querySelector(selector) as HTMLElement;
  }

  protected get contentPart() {
    return this.get('[part~="content"]');
  }

  protected get actionsPart() {
    return this.get('[part~="actions"]');
  }

  public get sortPart() {
    return this.actionsPart.querySelector('[part~="action"]')! as HTMLElement;
  }

  public get resizePart() {
    return this.get('[part~="resizable"]');
  }

  public get titlePart() {
    return this.get('[part~="title"]');
  }

  public get sortIcon() {
    return this.sortPart.querySelector('igc-icon')!;
  }

  public get isSorted() {
    return this.sortPart.part.contains('sorted');
  }

  public get hasFilterStyle() {
    return this.element.part.contains('filtered');
  }

  public get text() {
    return this.contentPart.textContent?.trim();
  }

  public startResize() {
    this.resizePart.dispatchEvent(new PointerEvent('pointerdown', DEFAULT_ARGS));
  }

  public stopResize() {
    this.resizePart.dispatchEvent(new PointerEvent('pointerup', DEFAULT_ARGS));
    this.resizePart.dispatchEvent(new PointerEvent('lostpointercapture', DEFAULT_ARGS));
  }

  public resize(x: number) {
    this.resizePart.dispatchEvent(
      new PointerEvent('pointermove', {
        ...DEFAULT_ARGS,
        clientX: this.element.getBoundingClientRect().left + this.element.offsetWidth + x,
      })
    );
  }

  public autosize() {
    this.resizePart.dispatchEvent(new Event('dblclick', DEFAULT_ARGS));
  }

  public sort() {
    this.sortPart.click();
  }
}
