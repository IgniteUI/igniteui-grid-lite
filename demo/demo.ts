import {
  configureTheme,
  defineComponents,
  IgcButtonComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
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
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
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
  address: {
    city: string;
    country: string;
  };
};

const choices = ['low', 'standard', 'high'];
const themes = ['bootstrap', 'material', 'fluent', 'indigo'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'London', 'Paris', 'Berlin', 'Tokyo', 'Sydney'];
const countries = ['USA', 'USA', 'USA', 'USA', 'USA', 'UK', 'France', 'Germany', 'Japan', 'Australia'];

function getElement<T>(qs: string): T {
  return document.querySelector(qs) as T;
}

function generateData(length: number): User[] {
  return Array.from(
    { length },
    (_, idx) => {
      const cityIndex = getRandomInt(cities.length);
      return {
        id: idx,
        name: `User - ${getRandomInt(length)}`,
        age: getRandomInt(100),
        subscribed: Boolean(getRandomInt(2)),
        satisfaction: getRandomInt(5),
        priority: oneOf(choices),
        email: `user${idx}@org.com`,
        avatar: getAvatar(),
        address: {
          city: cities[cityIndex],
          country: countries[cityIndex],
        },
      } as User;
    },
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

let currentTheme = sessionStorage.getItem('theme') ?? 'bootstrap';
let currentVariant = sessionStorage.getItem('theme-variant') === 'dark' ? 'dark' : 'light';
const storedSize = Number(sessionStorage.getItem('size') ?? 3);

async function setTheme(theme: string, variant: string) {
  currentTheme = theme;
  currentVariant = variant;

  sessionStorage.setItem('theme', theme);
  sessionStorage.setItem('theme-variant', variant);

  await import(
    /* @vite-ignore */
    `/node_modules/igniteui-webcomponents/themes/${variant}/${theme}.css?${Date.now()}`
  );

  Array.from(document.head.querySelectorAll('style[type="text/css"]'))
    .slice(0, -1)
    .forEach((s) => s.remove());

  configureTheme(theme as any, variant as any);
}

const themeChoose = html`
  <div class="sample-drop-down">
    <igc-select
      style="--ig-size: 1;"
      value=${currentTheme}
      outlined
      title="Choose theme"
      @igcChange=${({ detail }: CustomEvent) => setTheme(detail.value, currentVariant)}
    >
      ${themes.map((theme) => html`<igc-select-item .value=${theme}>${theme}</igc-select-item>`)}
    </igc-select>
    <igc-button-group selection="single-required" style="--ig-size: 1;">
      <igc-toggle-button value="small" ?selected=${storedSize === 1} @click=${() => setSize(1)}>Small</igc-toggle-button>
      <igc-toggle-button value="medium" ?selected=${storedSize === 2} @click=${() => setSize(2)}>Medium</igc-toggle-button>
      <igc-toggle-button value="large" ?selected=${storedSize === 3} @click=${() => setSize(3)}>Large</igc-toggle-button>
    </igc-button-group>
    <igc-switch
      id="theme-variant"
      label-position="after"
      ?checked=${currentVariant === 'dark'}
      @igcChange=${(e: CustomEvent) => setTheme(currentTheme, (e.target as IgcSwitchComponent).checked ? 'dark' : 'light')}
      >Dark variant</igc-switch
    >
  </div>
`;

const columns: ColumnConfiguration<User>[] = [
  {
    field: 'id',
    header: 'User ID',
    resizable: true,
    dataType: 'number',
    filterable: true,
    sortable: true,
  },
  {
    field: 'name',
    cellTemplate: (params) => html`<igc-input style="padding-block: .4rem" .value=${params.value}></igc-input>`,
    filterable: true,
    sortable: true,
  },
  {
    field: 'avatar',
    cellTemplate: (params) =>
      html`<igc-avatar
        shape="circle"
        .src=${params.value}
      ></igc-avatar>`,
  },
  {
    field: 'satisfaction',
    dataType: 'number',
    sortable: true,
    filterable: true,
    cellTemplate: (params) =>
      html`<igc-rating
        readonly
        
        .value=${params.value}
      ></igc-rating>`,
  },
  {
    field: 'priority',
    cellTemplate: (params) =>
      html`<igc-select
        style="padding-block: .4rem"
        outlined
        .value=${params.value}
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
    field: 'age',
  },
  {
    field: 'email',
  },
  {
    field: 'address.city',
    header: 'City',
    sortable: true,
    filterable: true,
  },
  {
    field: 'address.country',
    header: 'Country',
    sortable: true,
    filterable: true,
  },
  {
    field: 'subscribed',
    dataType: 'boolean',
    sortable: true,
    filterable: true,
    cellTemplate: (params) =>
      html`<igc-checkbox
        label-position="before"
        ?checked=${params.value}
        style="margin: 0 auto;"
      ></igc-checkbox>`,
  },
];

const data = generateData(1e3);
IgcGridLite.register();

const column = document.createElement(IgcGridLiteColumn.tagName) as IgcGridLiteColumn<User>;
column.field = 'email';
column.header = 'Toggle Me';

const column2 = document.createElement(IgcGridLiteColumn.tagName) as IgcGridLiteColumn<User>;
column2.header = 'Non-existent';

const toggleColumn = () => {
  const grid = getElement<IgcGridLite<User>>(IgcGridLite.tagName);
  grid.contains(column) ? column.remove() : grid.prepend(column);
  grid.contains(column2) ? column2.remove() : grid.prepend(column2);
};

const toggleFiltering = () => {
  const grid = getElement<IgcGridLite<User>>(IgcGridLite.tagName);
  const column = Array.from(grid.querySelectorAll(IgcGridLiteColumn.tagName)).find(
    (col) => col.field === 'name',
  )!;

  column.filterable = !column.filterable;
};

const setSize = (size: number) => {
  sessionStorage.setItem('size', String(size));
  document.getElementById('demo')!.style.setProperty('--ig-size', String(size));
};

render(
  html`
    <div class="actions-panel">
      <igc-switch
        label-position="after"
        @igcChange=${toggleColumn}
      >Toggle column</igc-switch
      >
      <igc-switch
        label-position="after"
        @igcChange=${toggleFiltering}
      >Toggle filtering</igc-switch
      >
      
      ${themeChoose}
    </div>
    <igc-grid-lite .data=${data}>
      ${columns.map(
        (col) =>
          html`<igc-grid-lite-column
            .field=${col.field}
            .dataType=${col.dataType}
            .header=${col.header}
            ?hidden=${col.hidden}
            ?resizable=${col.resizable}
            ?sortable=${col.sortable}
            .sortConfiguration=${col.sortConfiguration}
            ?filterable=${col.filterable}
            .cellTemplate=${col.cellTemplate}
            .headerTemplate=${col.headerTemplate}
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
setSize(storedSize);
await setTheme(currentTheme, currentVariant);
