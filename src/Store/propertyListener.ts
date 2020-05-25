import isPlainObject from 'is-plain-object';

export const propertyListener = <T>(data: T) => {
  if (!isPlainObject(data)) {
    throw new Error('Data must be a plain object!');
  }

  let proxy = {} as T | null;
  let isActive = true;
  const usedKeys = new Set<keyof T>();

  Object.keys(data).forEach((property) => {
    Object.defineProperty(proxy, property, {
      enumerable: true,
      configurable: true,
      set: (value) => data[property as keyof T] = value,
      get: () => {
        if (isActive) {
          usedKeys.add(property as keyof T);
        }
        return data[property as keyof T];
      }
    });
  });

  return {
    getProxy: () => isActive && proxy ? proxy : data,
    getUsedkeys: () => usedKeys,
    isActive: () => isActive,
    stop: () => {
      isActive = false;
      proxy = null;
    }
  };
};
