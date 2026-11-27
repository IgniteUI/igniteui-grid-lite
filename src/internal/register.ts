type IgcComponent = CustomElementConstructor & {
  tagName: string;
  register: () => void;
};

export function registerComponent(component: IgcComponent, ...dependencies: IgcComponent[]): void {
  // Host first: children upgraded before it miss its context providers.
  if (!customElements.get(component.tagName)) {
    customElements.define(component.tagName, component);
  }

  for (const dependency of dependencies) {
    dependency.register();
  }
}
