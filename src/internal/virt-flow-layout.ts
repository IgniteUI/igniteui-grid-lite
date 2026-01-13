import { FlowLayout } from '@lit-labs/virtualizer/layouts/flow.js';

/**
 * Override for the [built-in item measure function](https://github.com/lit/lit/blob/f243134b226735320b61466cebdaf0c1e574bfa7/packages/labs/virtualizer/src/Virtualizer.ts#L519-L524)
 * @see {@link https://github.com/IgniteUI/igniteui-grid-lite/issues/20 #20} for more.
 * @remarks
 * Note: Unlike the built-in, this does _not_ measure margins and will not work with such.
 */
function measureItemWithScaleAdjust(element: HTMLElement) {
  let { width, height } = element.getBoundingClientRect();
  const offsetHeight = element.offsetHeight;
  if (Math.abs(offsetHeight - height) > 1) {
    // likely scaling, prefer the offsetHeight
    // should check if its on rows vs virtualizer, but oh well
    height = offsetHeight;
  }
  return { width, height };
}

export class IgcFlowLayout extends FlowLayout {
  public override get measureChildren(): boolean {
    // @ts-expect-error - Base class types this as boolean, but runtime accepts a function override
    return measureItemWithScaleAdjust;
  }
}
