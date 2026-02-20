import {
  adoptStyles,
  type LitElement,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit';

export class AdoptedStylesController implements ReactiveController {
  private static _cachedSheets = new WeakMap<Document, CSSStyleSheet[]>();

  private readonly _host: ReactiveControllerHost & LitElement;
  private _hasAdoptedStyles = false;

  public get hasAdoptedStyles(): boolean {
    return this._hasAdoptedStyles;
  }

  public static invalidateCache(owner?: Document): void {
    AdoptedStylesController._cachedSheets.delete(owner ?? document);
  }

  public constructor(host: ReactiveControllerHost & LitElement) {
    this._host = host;
    host.addController(this);
  }

  public shouldAdoptStyles(condition: boolean): void {
    condition ? this._adoptRootStyles() : this._clearAdoptedStyles();
  }

  /** @internal */
  public hostDisconnected(): void {
    this._clearAdoptedStyles();
  }

  private _adoptRootStyles(): void {
    const ownerDocument = this._host.ownerDocument;

    if (!AdoptedStylesController._cachedSheets.has(ownerDocument)) {
      AdoptedStylesController._cachedSheets.set(
        ownerDocument,
        this._cloneDocumentStyleSheets(ownerDocument)
      );
    }

    const ctor = this._host.constructor as typeof LitElement;
    adoptStyles(this._host.shadowRoot!, [
      ...ctor.elementStyles,
      ...AdoptedStylesController._cachedSheets.get(ownerDocument)!,
    ]);
    this._hasAdoptedStyles = true;
  }

  private _cloneDocumentStyleSheets(ownerDocument: Document): CSSStyleSheet[] {
    const sheets: CSSStyleSheet[] = [];

    for (const sheet of ownerDocument.styleSheets) {
      try {
        const constructed = new CSSStyleSheet();
        let hasRules = false;

        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSImportRule) {
            continue;
          }

          try {
            // insert last to keep rules/override order:
            constructed.insertRule(rule.cssText, constructed.cssRules.length);
            hasRules = true;
          } catch {
            // Ignore rules that can't be adopted.
          }
        }

        if (hasRules) {
          sheets.push(constructed);
        }
      } catch {
        // Ignore stylesheets we can't access due to CORS.
      }
    }
    return sheets;
  }

  private _clearAdoptedStyles(): void {
    const shadowRoot = this._host.shadowRoot;
    if (shadowRoot) {
      shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter(
        (sheet) =>
          !AdoptedStylesController._cachedSheets.get(this._host.ownerDocument)?.includes(sheet)
      );
    }
    this._hasAdoptedStyles = false;
  }
}
