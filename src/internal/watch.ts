interface WatchOptions {
  waitUntilFirstUpdate?: boolean;
}

export function watch(propName: string, options?: WatchOptions) {
  return (protoOrDescriptor: any, name: string): any => {
    const { willUpdate } = protoOrDescriptor;
    const waitUntilFirstUpdate = options?.waitUntilFirstUpdate ?? false;

    protoOrDescriptor.willUpdate = function (changedProps: Map<string, any>) {
      willUpdate.call(this, changedProps);

      if (!changedProps.has(propName)) {
        return;
      }

      const oldValue = changedProps.get(propName);
      const newValue = this[propName];

      if (oldValue !== newValue && (!waitUntilFirstUpdate || this.hasUpdated)) {
        this[name].call(this, oldValue, newValue);
      }
    };
  };
}
