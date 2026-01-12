import { consume } from '@lit/context';
import {
  IgcDropdownComponent,
  type IgcDropdownItemComponent,
  type IgcIconComponent,
  IgcInputComponent,
} from 'igniteui-webcomponents';
import { html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { StateController } from '../controllers/state.js';
import { DEFAULT_COLUMN_CONFIG } from '../internal/constants.js';
import { GRID_STATE_CONTEXT } from '../internal/context.js';
import { registerComponent } from '../internal/register.js';
import { GRID_FILTER_ROW_TAG } from '../internal/tags.js';
import type { ColumnConfiguration, PropertyType } from '../internal/types.js';
import { getFilterOperandsFor } from '../internal/utils.js';
import { watch } from '../internal/watch.js';
import type { FilterExpressionTree } from '../operations/filter/tree.js';
import type { FilterExpression, FilterOperation, OperandKeys } from '../operations/filter/types.js';
import { styles } from '../styles/filter-row/filter-row.css.js';

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

  public static register() {
    registerComponent(IgcFilterRow);
  }

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
    this.expression.condition = (getFilterOperandsFor(this.column) as any)[key] as FilterOperation<
      PropertyType<T, keyof T>
    >;

    if (this.input.value || this.expression.condition.unary) {
      this.filterController.filterWithEvent(this.expression, 'modify');
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
      this.expression.searchTerm = value as any;

      this.filterController.filterWithEvent(this.expression, type);
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

  @watch('active', { waitUntilFirstUpdate: true })
  protected activeChanged() {
    this.style.display = this.active ? 'flex' : '';

    if (!this.active) {
      this.column = DEFAULT_COLUMN_CONFIG as ColumnConfiguration<T>;
    }

    this.state.host.requestUpdate();
  }

  #chipCriteriaFor(expression: FilterExpression<T>) {
    return async (e: Event) => {
      e.stopPropagation();

      expression.criteria = expression.criteria === 'and' ? 'or' : 'and';
      this.filterController.filterWithEvent(expression, 'modify');
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

    return html`
      <igc-chip
        selectable
        removable
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
    return html`<igc-icon
      id="condition"
      slot="prefix"
      collection="internal"
      .name=${this.condition.name}
      @click=${this.#openDropdownList}
    >
    </igc-icon>`;
  }

  protected renderInputArea() {
    return html`
      <igc-input
        outlined
        value=${ifDefined(this.expression.searchTerm)}
        placeholder="Add filter value"
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
      <div part="active-state">
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

    const partial = state && state.length < 3;
    const hidden = state && state.length >= 3;

    const open = () => {
      this.column = column;
      this.#setDefaultExpression();
      this.#show();
    };

    const count = hidden ? html`<span slot="suffix">${state.length}</span>` : nothing;
    const chip = html`<igc-chip
      data-column=${column.field}
      @click=${open}
      >${prefixedIcon('filter')}Filter${count}</igc-chip
    >`;

    return partial ? this.renderInactiveChips(column, state) : chip;
  }

  protected renderInactiveState() {
    return this.state.columns.map((column) =>
      column.hidden
        ? nothing
        : html`
            <div part="filter-row-preview">
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
