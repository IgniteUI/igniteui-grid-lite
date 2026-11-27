/** `attachInternals()` throws on a second call. */
const internalsByHost = new WeakMap<HTMLElement, ElementInternals>();

/** Attaches on first use. */
export function internalsOf(host: HTMLElement): ElementInternals {
  const internals = internalsByHost.get(host) ?? host.attachInternals();
  internalsByHost.set(host, internals);

  return internals;
}
