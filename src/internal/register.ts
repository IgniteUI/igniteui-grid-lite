type IgcComponent = CustomElementConstructor & {
  tagName: string;
  register: () => void;
};

export function registerComponent(component: IgcComponent, ...dependencies: IgcComponent[]): void {
  for (const dependency of dependencies) {
    dependency.register();
  }

  if (!customElements.get(component.tagName)) {
    customElements.define(component.tagName, component);
  }
}
