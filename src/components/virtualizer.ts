import { LitVirtualizer } from '@lit-labs/virtualizer/LitVirtualizer.js';
import { registerComponent } from '../internal/register.js';
import { GRID_BODY } from '../internal/tags.js';
import { IgcFlowLayout } from '../internal/virt-flow-layout.js';

export default class IgcVirtualizer extends LitVirtualizer {
  public static get tagName() {
    return GRID_BODY;
  }

  public override layout: LitVirtualizer['layout'] = {
    type: IgcFlowLayout,
  };

  public static register(): void {
    registerComponent(IgcVirtualizer);
  }

  public override scroller = true;
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcVirtualizer.tagName]: IgcVirtualizer;
  }
}
