import isPlainObject from 'is-plain-object';
import { State } from './types';

export const propertyListener = <T>(data: T) => {
  if (!isPlainObject(data)) {
    throw new Error('Data must be a plain object!');
  }

  const proxy = {} as T;
  const gotKeys = new Set<keyof T>();
  let isActive = true;

  Object.keys(data).forEach((property) => {
    Object.defineProperty(proxy, property, {
      enumerable: true,
      configurable: true,
      set: (value) => data[property as keyof T] = value,
      get: () => {
        if (isActive) {
          gotKeys.add(property as keyof T);
        }
        return data[property as keyof T];
      }
    });
  });

  return {
    proxy,
    gotKeys,
    stop: () => { isActive = false }
  };
};
