import { internalsOf } from './internals.js';

/** Writes the custom states of a host. */
class StatesController<S extends string> {
  readonly #states: CustomStateSet;

  constructor(host: HTMLElement) {
    this.#states = internalsOf(host).states;
  }

  /** Adds `true` states, removes `false` ones. */
  public set(states: Partial<Record<S, boolean>>): void {
    for (const state in states) {
      const active = Boolean(states[state]);

      // `add` restyles the host even when the state is already set.
      if (this.#states.has(state) === active) {
        continue;
      }

      if (active) {
        this.#states.add(state);
        continue;
      }

      this.#states.delete(state);
    }
  }
}

/** Returns a handle to the custom states `S` of `host`. */
export function addStates<S extends string>(host: HTMLElement): StatesController<S> {
  return new StatesController<S>(host);
}
