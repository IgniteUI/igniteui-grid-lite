import { expect } from '@open-wc/testing';
import { registerComponent } from '../src/internal/register.js';

describe('registerComponent', () => {
  it('defines the component before its dependencies', () => {
    let hostDefinedFirst = false;

    class Host extends HTMLElement {
      public static readonly tagName = 'test-register-host';
      public static register(): void {}
    }

    class Dependency extends HTMLElement {
      public static readonly tagName = 'test-register-dependency';
      public static register(): void {
        hostDefinedFirst = customElements.get(Host.tagName) !== undefined;
      }
    }

    registerComponent(Host, Dependency);

    expect(hostDefinedFirst).to.be.true;
  });
});
