import { noChange } from 'lit';
import {
  type AttributePart,
  Directive,
  type DirectiveParameters,
  directive,
  type PartInfo,
  PartType,
} from 'lit/directive.js';

export interface PartMapInfo {
  readonly [name: string]: boolean | null | undefined;
}

class PartMapDirective extends Directive {
  private _previousParts?: Set<string>;

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (
      partInfo.type !== PartType.ATTRIBUTE ||
      partInfo.name !== 'part' ||
      (partInfo.strings?.length as number) > 0
    ) {
      throw new Error(
        '`partMap() can only be used in the `part` attribute and must be the only part in the attribute.'
      );
    }
  }

  public override render(partMapInfo: PartMapInfo): string {
    return Object.keys(partMapInfo)
      .filter((key) => partMapInfo[key])
      .join(' ');
  }

  public override update(part: AttributePart, [partMapInfo]: DirectiveParameters<this>) {
    const partList = part.element.part;
    const firstRender = this._previousParts === undefined;
    const previous = this._previousParts ?? new Set<string>();
    this._previousParts = previous;

    for (const name of previous) {
      if (!partMapInfo[name]) {
        partList.remove(name);
        previous.delete(name);
      }
    }

    for (const name in partMapInfo) {
      if (partMapInfo[name] && !previous.has(name)) {
        partList.add(name);
        previous.add(name);
      }
    }

    // The first render must produce the attribute value; later ones patch the
    // part list directly.
    return firstRender ? this.render(partMapInfo) : noChange;
  }
}

/**
 * Similar to Lit's {@link https://lit.dev/docs/templates/directives/#classmap | `classMap`} and
 * {@link https://lit.dev/docs/templates/directives/#stylemap | `styleMap`} but for `part` attributes.
 */
export const partMap = directive(PartMapDirective);
export type { PartMapDirective };
