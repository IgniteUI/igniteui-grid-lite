import { LitVirtualizer } from '@lit-labs/virtualizer/LitVirtualizer.js';
import { addA11y } from '../internal/a11y.js';
import { FOCUS_WITHIN } from '../internal/constants.js';
import { registerComponent } from '../internal/register.js';
import { GRID_VIRTUALIZER_TAG } from '../internal/tags.js';
import { IgcFlowLayout } from '../internal/virt-flow-layout.js';

const RANGE_CHANGED = 'rangeChanged';

export default class IgcVirtualizer extends LitVirtualizer {
  public static get tagName() {
    return GRID_VIRTUALIZER_TAG;
  }

  public override layout: LitVirtualizer['layout'] = {
    type: IgcFlowLayout,
  };

  public static register(): void {
    registerComponent(IgcVirtualizer);
  }

  public override scroller = true;

  /** True while DOM focus is inside the data area. */
  #ownsFocus = false;

  constructor() {
    super();

    // The data area is the tab stop of the grid. Navigation moves DOM focus onto
    // the active cell (roving focus). `aria-activedescendant` is not an option:
    // the cell is in a row shadow root and IDREF lookups do not cross shadow
    // boundaries.
    addA11y(this, 'rowgroup');

    this.addEventListener('focusin', () => {
      this.#ownsFocus = true;
    });
    this.addEventListener('focusout', this.#handleFocusOut);
    this.addEventListener(RANGE_CHANGED, () => this.#reclaimFocus());
  }

  #handleFocusOut = (event: FocusEvent): void => {
    const { relatedTarget } = event;

    if (relatedTarget instanceof Node) {
      this.#ownsFocus = this.contains(relatedTarget);
      return;
    }

    // No element gained focus. Either the user focused empty space, or
    // virtualization removes the focused cell. The event fires while the cell is
    // still connected, so the two cases become distinct one microtask later.
    const [origin] = event.composedPath();

    queueMicrotask(() => {
      this.#ownsFocus = !(origin as Node).isConnected;
      this.#reclaimFocus();
    });
  };

  /**
   * A long scroll removes the focused cell and focus falls back to the document
   * body. Take the focus back so that keyboard navigation continues to work.
   */
  #reclaimFocus(): void {
    if (this.#ownsFocus && !this.matches(FOCUS_WITHIN)) {
      this.focus({ preventScroll: true });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcVirtualizer.tagName]: IgcVirtualizer;
  }
}
