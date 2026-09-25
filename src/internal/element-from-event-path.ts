function getElementFromEventPath<T extends Element>(selector: string, event: Event): T | undefined {
  return Iterator.from(event.composedPath()).find(
    (node) => node instanceof Element && node.matches(selector)
  ) as T | undefined;
}

export { getElementFromEventPath };
