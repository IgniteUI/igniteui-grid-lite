import type {
  CSSResult,
  LitElement,
  ReactiveController,
  ReactiveControllerHost,
  ReactiveElement,
} from 'lit';
import { adoptStyles, css, isServer } from 'lit';

type Theme = 'material' | 'bootstrap' | 'indigo' | 'fluent';
type ThemeVariant = 'light' | 'dark';

export type Themes = {
  light: {
    [K in Theme | 'shared']?: CSSResult;
  };
  dark: {
    [K in Theme | 'shared']?: CSSResult;
  };
};

type ThemeChangedCallback = (theme: Theme) => unknown;
type ThemingControllerConfig = {
  themeChange?: ThemeChangedCallback;
};

const CHANGE_THEME_EVENT = 'igc-change-theme';
let theme: Theme;
let themeVariant: ThemeVariant;

function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return rule != null && 'style' in rule;
}

function cssKeyToJsKey(key: string): string {
  return key.replace(/^--|-./g, (match) => {
    return match.startsWith('--') ? '' : match.charAt(1).toUpperCase();
  });
}

function getAllCssVariableNames(): Set<string> {
  const cssVars = new Set<string>();
  const styleSheets = Array.from(document.styleSheets);

  for (const sheet of styleSheets) {
    let rules: CSSRuleList | undefined;

    // Potential CORS or access errors
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    if (!rules) {
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (isStyleRule(rule)) {
        const length = rule.style.length;

        for (let i = 0; i < length; i++) {
          const style = rule.style[i];

          if (style.startsWith('--')) {
            cssVars.add(style);
          }
        }
      }
    }
  }

  return cssVars;
}

function getElementCssVariables(
  allCssVars: Set<string>,
  element: HTMLElement,
  pseudo?: string
): Record<string, string> {
  const cssVars: Record<string, string> = {};
  const styles = getComputedStyle(element, pseudo);

  for (const key of allCssVars) {
    const value = styles.getPropertyValue(key);

    if (value) {
      cssVars[cssKeyToJsKey(key)] = value.trim();
    }
  }

  return cssVars;
}

function getAllCssVariables(): Record<string, string> {
  /* c8 ignore next 2 */
  return isServer ? {} : getElementCssVariables(getAllCssVariableNames(), document.documentElement);
}

function isOfTypeTheme(theme: string): theme is Theme {
  return ['bootstrap', 'material', 'indigo', 'fluent'].includes(theme);
}

function isOfTypeThemeVariant(variant: string): variant is ThemeVariant {
  return ['light', 'dark'].includes(variant);
}

function getTheme() {
  const cssVars = getAllCssVariables();
  const foundTheme = cssVars.igTheme;
  const foundVariant = cssVars.igThemeVariant;

  theme = isOfTypeTheme(foundTheme) ? foundTheme : 'bootstrap';
  themeVariant = isOfTypeThemeVariant(foundVariant) ? foundVariant : 'light';

  return { theme, themeVariant };
}

class ThemingController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & ReactiveElement;
  private readonly _themes: Themes;
  private readonly _options?: ThemingControllerConfig;

  private _theme: Theme = 'bootstrap';
  private _variant: ThemeVariant = 'light';

  public get theme(): Theme {
    return this._theme;
  }

  constructor(
    host: ReactiveControllerHost & ReactiveElement,
    themes: Themes,
    config?: ThemingControllerConfig
  ) {
    this._host = host;
    this._themes = themes;
    this._options = config;
    this._host.addController(this);
  }

  /** @internal */
  public hostConnected(): void {
    this._handleThemeChanged();
    globalThis.addEventListener(CHANGE_THEME_EVENT, this);
  }

  /** @internal */
  public hostDisconnected(): void {
    globalThis.addEventListener(CHANGE_THEME_EVENT, this);
  }

  /** @internal */
  public handleEvent(): void {
    this._handleThemeChanged();
  }

  private _getStyles() {
    const props = this._themes[this._variant];
    const styles = { shared: css``, theme: css`` };

    for (const [name, sheet] of Object.entries(props)) {
      if (name === 'shared') {
        styles.shared = sheet;
      }
      if (name === this.theme) {
        styles.theme = sheet;
      }
    }

    return styles;
  }

  protected _adoptStyles(): void {
    const { theme: currentTheme, themeVariant } = getTheme();
    this._theme = currentTheme;
    this._variant = themeVariant;

    const ctor = this._host.constructor as typeof LitElement;
    const { shared, theme } = this._getStyles();

    adoptStyles(this._host.shadowRoot!, [...ctor.elementStyles, shared, theme]);
  }

  private _handleThemeChanged(): void {
    this._adoptStyles();
    this._options?.themeChange?.call(this._host, this._theme);
    this._host.requestUpdate();
  }
}

export function addThemingController(
  host: ReactiveControllerHost & ReactiveElement,
  themes: Themes,
  config?: ThemingControllerConfig
): ThemingController {
  return new ThemingController(host, themes, config);
}

export type { ThemingController };
