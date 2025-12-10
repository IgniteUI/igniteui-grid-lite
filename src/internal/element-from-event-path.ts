import { isString } from './utils.js';

function isElement(node: unknown): node is Element {
  return node instanceof Element;
}

function getElementFromEventPath<T extends Element>(
  predicate: string | ((element: T) => boolean),
  event: Event
): T | undefined {
  const callback = isString(predicate)
    ? (element: Element): element is T => element.matches(predicate)
    : (element: Element) => predicate(element as T);

  return Iterator.from(event.composedPath()).filter(isElement).find(callback) as T | undefined;
}

export { getElementFromEventPath };
