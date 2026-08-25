import { consume } from '@lit/context';
import {
  θaddAdoptedStylesController as addAdoptedStylesController,
  θaddThemingController as addThemingController,
  IgcButtonComponent,
  IgcChipComponent,
  IgcDropdownComponent,
  type IgcDropdownItemComponent,
  type IgcIconComponent,
  IgcInputComponent,
} from 'igniteui-webcomponents';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { StateController } from '../controllers/state.js';
import { addA11y, FILTER_ROW_INDEX } from '../internal/a11y.js';
import { DEFAULT_COLUMN_CONFIG } from '../internal/constants.js';
import { GRID_STATE_CONTEXT } from '../internal/context.js';
import { registerComponent } from '../internal/register.js';
import { GRID_FILTER_ROW_TAG } from '../internal/tags.js';
import type { ColumnConfiguration, Keys, PropertyType } from '../internal/types.js';
import { getFilterOperandsFor } from '../internal/utils.js';
import { watch } from '../internal/watch.js';
import type { FilterExpressionTree } from '../operations/filter/tree.js';
import type { FilterExpression, FilterOperation, OperandKeys } from '../operations/filter/types.js';
import { styles } from '../styles/filter-row/filter-row.css.js';
import { all } from '../styles/themes/filtering-row-themes.js';

/** Number of filter expressions shown as chips before collapsing into a single counted chip. */
const MAX_PREVIEW_CHIPS = 3;

/** Accessible name of the filter row itself. */
const FILTER_ROW_LABEL = 'Column filters';

type ExpressionChipProps<T> = {
  expression: FilterExpression<T>;
  selected: boolean;
  onRemove: (e: Event) => Promise<void>;
  onSelect: (e: Event) => Promise<void>;
};

function prefixedIcon(icon?: string) {
  return html`
    <igc-icon
      slot="prefix"
      name=${ifDefined(icon)}
      collection="internal"
    ></igc-icon>
  `;
}

export default class IgcFilterRow<T extends object> extends LitElement {
  public static get tagName() {
    return GRID_FILTER_ROW_TAG;
  }

  public static override styles = styles;

  /**
   * Only the filter row renders these editor components, so the grid defers this
   * call until a filterable column shows one.
   */
  public static register() {
    registerComponent(
      IgcFilterRow,
      IgcButtonComponent,
      IgcChipComponent,
      IgcInputComponent,
      IgcDropdownComponent
    );
  }

  private readonly _adoptedStylesController = addAdoptedStylesController(this);

  @consume({ context: GRID_STATE_CONTEXT, subscribe: true })
  @property({ attribute: false })
  public state!: StateController<T>;

  protected get isNumeric() {
    return this.column.dataType === 'number';
  }

  protected get filterController() {
    return this.state.filtering;
  }

  protected get condition() {
    return this.expression.condition as FilterOperation<T>;
  }

  @property({ attribute: false })
  public active = false;

  @query(IgcInputComponent.tagName)
  public input!: IgcInputComponent;

  @query('#condition')
  public conditionElement!: IgcIconComponent;

  @query(IgcDropdownComponent.tagName)
  public dropdown!: IgcDropdownComponent;

  @property({ attribute: false })
  public column: ColumnConfiguration<T> = DEFAULT_COLUMN_CONFIG as ColumnConfiguration<T>;

  @property({ attribute: false })
  public expression!: FilterExpression<T>;

  @property({ attribute: false })
  public adoptRootStyles = false;

  constructor() {
    super();

    // `role=grid` permits only rows and rowgroups as children, so a `search`
    // landmark here would be an illegal node in the grid tree. The filter row is
    // modeled as the second header row: one `gridcell` per column, each with that
    // column's filter controls.
    addA11y(this, 'row').set({
      ariaRowIndex: `${FILTER_ROW_INDEX}`,
      ariaLabel: FILTER_ROW_LABEL,
    });

    addThemingController(this, all, {
      themeChange: this._handleThemeChange,
    });
  }

  private _handleThemeChange() {
    this._adoptedStylesController.invalidateCache(this.ownerDocument);
    this._adoptedStylesController.shouldAdoptStyles(
      this.adoptRootStyles && this.column.headerTemplate != null
    );
  }

  protected override update(props: PropertyValues<this>): void {
    if (props.has('adoptRootStyles')) {
      this._adoptedStylesController.shouldAdoptStyles(
        this.adoptRootStyles && this.column.headerTemplate != null
      );
    }

    super.update(props);
  }

  #setDefaultExpression() {
    this.expression = this.filterController.getDefaultExpression(this.column);
  }

  #removeExpression(expression: FilterExpression<T>) {
    this.filterController.removeExpression(expression);
  }

  async #show() {
    this.active = true;

    await this.updateComplete;
    this.input?.select();
  }

  #handleConditionChanged(event: CustomEvent<IgcDropdownItemComponent>) {
    event.stopPropagation();
    const key = event.detail.value as OperandKeys<PropertyType<T, typeof this.column.field>>;

    // XXX: Types
    const condition = (getFilterOperandsFor(this.column) as any)[key] as FilterOperation<
      PropertyType<T, keyof T>
    >;

    if (this.input.value || condition.unary) {
      this.filterController.filterWithEvent(
        { ...this.expression, condition },
        'modify',
        this.expression
      );
    } else {
      // Nothing to filter by yet - the condition is only staged in the UI.
      this.expression.condition = condition;
    }

    this.requestUpdate();
  }

  #handleInput(event: CustomEvent<string>) {
    event.stopPropagation();

    const value = this.isNumeric ? Number.parseFloat(event.detail) : event.detail;
    const shouldUpdate = this.isNumeric ? !Number.isNaN(value as number) : !!value;
    const type = this.filterController.get(this.expression.key)?.has(this.expression)
      ? 'modify'
      : 'add';

    if (shouldUpdate) {
      this.filterController.filterWithEvent(
        { ...this.expression, searchTerm: value as any },
        type,
        this.expression
      );
    } else {
      this.#removeExpression(this.expression);
    }

    this.requestUpdate();
  }

  #handleKeydown(event: KeyboardEvent) {
    event.stopPropagation();

    switch (event.key) {
      case 'Enter':
        this.input.value = '';
        this.#setDefaultExpression();
        return;
      case 'Escape':
        this.active = false;
        return;
      default:
        return;
    }
  }

  #handleResetClick() {
    this.filterController.removeAllExpressions(this.column.field);
    this.requestUpdate();
  }

  #openDropdownList() {
    this.dropdown.toggle(this.input);
  }

  #handleConditionKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    // The trigger sits in the prefix slot of the input. The keystroke must not
    // reach the input and commit a filter behind the open dropdown.
    event.preventDefault();
    event.stopPropagation();

    this.#openDropdownList();
  }

  /** Header text of a column. Names the filter controls that act on it. */
  #nameFor(field: Keys<T>): string {
    const column = this.state.columns.find((each) => each.field === field);
    return String(column?.header ?? field);
  }

  @watch('active', { waitUntilFirstUpdate: true })
  protected activeChanged() {
    this.style.display = this.active ? 'flex' : '';

    if (!this.active) {
      this.column = DEFAULT_COLUMN_CONFIG as ColumnConfiguration<T>;
    }

    // The header row marks the column whose filter editor is open.
    this.state.updateObservers();
  }

  #chipCriteriaFor(expression: FilterExpression<T>) {
    return async (e: Event) => {
      e.stopPropagation();

      const criteria = expression.criteria === 'and' ? 'or' : 'and';

      this.filterController.filterWithEvent({ ...expression, criteria }, 'modify', expression);
      this.requestUpdate();
    };
  }

  #chipSelectFor(expression: FilterExpression<T>) {
    return async (e: Event) => {
      e.stopPropagation();
      this.expression = expression;
      await this.updateComplete;
      this.input?.select();
    };
  }

  #chipRemoveFor(expression: FilterExpression<T>) {
    return async (e: Event) => {
      e.stopPropagation();
      this.#removeExpression(expression);

      if (this.active && this.expression === expression) {
        this.#setDefaultExpression();
        await this.updateComplete;
        this.input.focus();
      }

      this.requestUpdate();
    };
  }

  protected renderCriteriaButton(expr: FilterExpression<T>, index: number) {
    return index
      ? html`
          <igc-button
            variant="flat"
            @click=${this.#chipCriteriaFor(expr)}
          >
            ${expr.criteria}
          </igc-button>
        `
      : nothing;
  }

  protected renderExpressionChip(props: ExpressionChipProps<T>) {
    const { name, unary } = props.expression.condition as FilterOperation<T>;
    const { searchTerm: term } = props.expression;

    const prefix = html`<span slot="select"></span>${prefixedIcon(name)}`;

    // The chip renders its select and remove actions in its own shadow root.
    // Resource strings are the only way to name them after the expression.
    const expression = `${this.#nameFor(props.expression.key)} ${name} ${unary ? '' : term}`.trim();

    return html`
      <igc-chip
        selectable
        removable
        .resourceStrings=${{
          chip_remove: `Remove filter ${expression}`,
          chip_select: `Edit filter ${expression}`,
        }}
        ?selected=${props.selected}
        @igcRemove=${props.onRemove}
        @igcSelect=${props.onSelect}
      >
        ${prefix}${unary ? name : term}
      </igc-chip>
    `;
  }

  protected renderActiveChips() {
    const state = this.filterController.get(this.column.field);

    return !state
      ? nothing
      : Array.from(state).map((expression, idx) => {
          const props: ExpressionChipProps<T> = {
            expression,
            selected: this.expression === expression,
            onRemove: this.#chipRemoveFor(expression),
            onSelect: this.#chipSelectFor(expression),
          };

          return html`${this.renderCriteriaButton(expression, idx)}${this.renderExpressionChip(
            props
          )}`;
        });
  }

  protected renderFilterActions() {
    return html`
      <igc-button
        id="reset"
        variant="flat"
        @click=${this.#handleResetClick}
      >
        ${prefixedIcon('refresh')} Reset
      </igc-button>
      <igc-button
        id="close"
        variant="flat"
        @click=${() => {
          this.active = false;
        }}
      >
        ${prefixedIcon('close')} Close
      </igc-button>
    `;
  }

  protected renderDropdown() {
    return html`<igc-dropdown
      flip
      same-width
      @igcChange=${this.#handleConditionChanged}
    >
      ${Object.entries(getFilterOperandsFor(this.column)).map(
        ([key, operand]) => html`
          <igc-dropdown-item
            .value=${key}
            ?selected=${this.condition.name === key}
          >
            ${prefixedIcon(key)}${operand?.label ?? key}
          </igc-dropdown-item>
        `
      )}
    </igc-dropdown>`;
  }

  protected renderDropdownTarget() {
    const condition = this.condition.label ?? this.condition.name;

    return html`<igc-icon
      id="condition"
      slot="prefix"
      collection="internal"
      role="button"
      tabindex="0"
      aria-haspopup="listbox"
      aria-label=${`Filter condition: ${condition}`}
      .name=${this.condition.name}
      @click=${this.#openDropdownList}
      @keydown=${this.#handleConditionKeydown}
    >
    </igc-icon>`;
  }

  protected renderInputArea() {
    // `igc-input` names its inner control from a slotted label or the placeholder
    // only, so the placeholder carries the column name.
    return html`
      <igc-input
        outlined
        value=${ifDefined(this.expression.searchTerm)}
        placeholder=${`Filter ${this.#nameFor(this.column.field)}`}
        ?readonly=${this.condition.unary}
        @igcInput=${this.#handleInput}
        @keydown=${this.#handleKeydown}
      >
        ${this.renderDropdownTarget()}
      </igc-input>
      ${this.renderDropdown()}
    `;
  }

  protected renderActiveState() {
    return html`
      <div
        part="active-state"
        role="gridcell"
      >
        <div part="filter-row-input">${this.renderInputArea()}</div>
        <div part="filter-row-filters">${this.renderActiveChips()}</div>
        <div part="filter-row-actions">${this.renderFilterActions()}</div>
      </div>
    `;
  }

  protected renderInactiveChips(column: ColumnConfiguration<T>, state: FilterExpressionTree<T>) {
    return Array.from(state).map((expression, idx) => {
      const props: ExpressionChipProps<T> = {
        expression,
        selected: false,
        onRemove: this.#chipRemoveFor(expression),
        onSelect: async (e: Event) => {
          e.stopPropagation();
          this.column = column;
          this.expression = expression;
          this.#show();
        },
      };

      return html`${this.renderCriteriaButton(expression, idx)}${this.renderExpressionChip(props)}`;
    });
  }

  protected renderFilterState(column: ColumnConfiguration<T>) {
    const state = this.filterController.get(column.field);

    const partial = state && state.length < MAX_PREVIEW_CHIPS;
    const hidden = state && state.length >= MAX_PREVIEW_CHIPS;

    const open = () => {
      this.column = column;
      this.#setDefaultExpression();
      this.#show();
    };

    const count = hidden ? html`<span slot="suffix">${state.length}</span>` : nothing;
    const chip = html`<igc-chip
      data-column=${column.field}
      aria-label=${`Filter ${this.#nameFor(column.field)}`}
      @click=${open}
      >${prefixedIcon('filter')}Filter${count}</igc-chip
    >`;

    return partial ? this.renderInactiveChips(column, state) : chip;
  }

  protected renderInactiveState() {
    return this.state.columns
      .filter((column) => !column.hidden)
      .map(
        (column, index) => html`
          <div
            part="filter-row-preview"
            role="gridcell"
            aria-colindex=${index + 1}
          >
            ${column.filterable ? this.renderFilterState(column) : nothing}
          </div>
        `
      );
  }

  protected override render() {
    return html`${this.active ? this.renderActiveState() : this.renderInactiveState()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [IgcFilterRow.tagName]: IgcFilterRow<object>;
  }
}
