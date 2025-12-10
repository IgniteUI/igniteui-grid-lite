import {
  configureTheme,
  defineComponents,
  IgcButtonComponent,
  IgcAvatarComponent,
  IgcCheckboxComponent,
  IgcRatingComponent,
  IgcSelectComponent,
  IgcSwitchComponent,
} from 'igniteui-webcomponents';
import { html, render } from 'lit';
import { ColumnConfiguration, IgcGridLiteColumn } from '../src/index.js';
import { IgcGridLite } from '../src/index.js';

defineComponents(
  IgcAvatarComponent,
  IgcCheckboxComponent,
  IgcRatingComponent,
  IgcSelectComponent,
  IgcSwitchComponent,
  IgcButtonComponent,
);

type User = {
  id: number;
  name: string;
  age: number;
  subscribed: boolean;
  satisfaction: number;
  priority: string;
  email: string;
  avatar: string;
};

const choices = ['low', 'standard', 'high'];
const themes = ['bootstrap', 'material', 'fluent', 'indigo'];

function getElement<T>(qs: string): T {
  return document.querySelector(qs) as T;
}

function generateData(length: number): User[] {
  return Array.from(
    { length },
    (_, idx) =>
      ({
        id: idx,
        name: `User - ${getRandomInt(length)}`,
        age: getRandomInt(100),
        subscribed: Boolean(getRandomInt(2)),
        satisfaction: getRandomInt(5),
        priority: oneOf(choices),
        email: `user${idx}@org.com`,
        avatar: getAvatar(),
      }) as User,
  );
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function oneOf<T>(collection: T[]) {
  return collection.at(getRandomInt(collection.length));
}

function getAvatar() {
  const [type, idx] = [getRandomInt(2) % 2 ? 'women' : 'men', getRandomInt(100)];
  return `https://static.infragistics.com/xplatform/images/people/${type}/${idx}.jpg`;
}

async function setTheme(theme?: string) {
  theme = theme ?? getElement<IgcSelectComponent>(IgcSelectComponent.tagName).value;
  const variant = getElement<IgcSwitchComponent>(IgcSwitchComponent.tagName).checked
    ? 'dark'
    : 'light';

  await import(
    /* @vite-ignore */
    `/node_modules/igniteui-webcomponents/themes/${variant}/${theme}.css?${Date.now()}`
  );

  Array.from(document.head.querySelectorAll('style[type="text/css"]'))
    .slice(0, -1)
    .forEach((s) => s.remove());

  configureTheme(theme as any);
}

const themeChoose = html`
  <div class="sample-drop-down">
    <igc-select
      value="bootstrap"
      outlined
      title="Choose theme"
      @igcChange=${({ detail }: CustomEvent) => setTheme(detail.value)}
    >
      ${themes.map((theme) => html`<igc-select-item .value=${theme}>${theme}</igc-select-item>`)}
    </igc-select>
    <igc-switch
      label-position="after"
      @igcChange=${() => setTheme()}
      >Dark variant</igc-switch
    >
  </div>
`;

const columns: ColumnConfiguration<User>[] = [
  {
    key: 'id',
    headerText: 'User ID',
    resizable: true,
    type: 'number',
    filterable: true,
    sortable: true,
  },
  {
    key: 'name',
    cellTemplate: (params) => html`<igc-input .value=${params.value}></igc-input>`,
    filterable: true,
    sortable: true,
  },
  {
    key: 'avatar',
    cellTemplate: (params) =>
      html`<igc-avatar
        shape="circle"
        .src=${params.value}
      ></igc-avatar>`,
  },
  {
    key: 'satisfaction',
    type: 'number',
    sortable: true,
    filterable: true,
    cellTemplate: (params) =>
      html`<igc-rating
        readonly
        style="--ig-size: 1"
        .value=${params.value}
      ></igc-rating>`,
  },
  {
    key: 'priority',
    cellTemplate: (params) =>
      html`<igc-select
        outlined
        .value=${params.value}
        style="--ig-size: 1"
        >${choices.map(
          (choice) => html`<igc-select-item .value=${choice}>${choice}</igc-select-item>`,
        )}</igc-select
      >`,
    sortable: true,
    sortConfiguration: {
      comparer: (a, b) => choices.indexOf(a) - choices.indexOf(b),
    },
  },
  {
    key: 'age',
  },
  {
    key: 'email',
  },
  {
    key: 'subscribed',
    type: 'boolean',
    sortable: true,
    filterable: true,
    cellTemplate: (params) =>
      html`<igc-checkbox
        label-position="before"
        ?checked=${params.value}
      ></igc-checkbox>`,
  },
];

const data = generateData(1e3);
IgcGridLite.register();

const column = document.createElement(IgcGridLiteColumn.tagName) as IgcGridLiteColumn<User>;
column.key = 'email';
column.headerText = 'Toggle Me';

const column2 = document.createElement(IgcGridLiteColumn.tagName) as IgcGridLiteColumn<User>;
column2.headerText = 'Non-existent';

const toggleColumn = () => {
  const grid = getElement<IgcGridLite<User>>(IgcGridLite.tagName);
  grid.contains(column) ? column.remove() : grid.prepend(column);
  grid.contains(column2) ? column2.remove() : grid.prepend(column2);
};

const toggleFiltering = () => {
  const grid = getElement<IgcGridLite<User>>(IgcGridLite.tagName);
  const column = Array.from(grid.querySelectorAll(IgcGridLiteColumn.tagName)).find(
    (col) => col.key === 'name',
  )!;

  column.filterable = !column.filterable;
};

render(
  html`
    <igc-button
      variant="outlined"
      @click=${toggleColumn}
      >Toggle column</igc-button
    >
    <igc-button
      variant="outlined"
      @click=${toggleFiltering}
      >Toggle filtering</igc-button
    >
    ${themeChoose}
    <igc-grid-lite .data=${data}>
      ${columns.map(
        (col) =>
          html`<igc-grid-lite-column
            .key=${col.key}
            .dataType=${col.type}
            .headerText=${col.headerText}
            ?hidden=${col.hidden}
            ?resizable=${col.resizable}
            ?sortable=${col.sortable}
            .sortConfiguration=${col.sortConfiguration}
            ?filterable=${col.filterable}
            .cellTemplate=${col.cellTemplate}
            .headerTemplate=${col.headerTemplate as any}
          ></igc-grid-lite-column>`,
      )}
    </igc-grid-lite>
    <igc-grid-lite
      .data=${data}
      auto-generate
    ></igc-grid-lite>
  `,
  document.getElementById('demo')!,
);
await setTheme('bootstrap');
