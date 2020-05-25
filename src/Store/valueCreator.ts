import { ValueType } from './types';
import { SharedData } from './SharedData';

/**
 * Create scoped function for creating new Values
 */
export const getValueCreator = (
  sharedData: SharedData,
  valueGetter: (valueId: symbol) => () => void
) => {
  /**
   * Create new setter with store name in closure
   * @param storeName Name of store
   * @returns function
   */
  const createProtectedSetter = (storeName: string) => {
    const chachedSetters = new Map<string, (value: any) => void>();

    if (!chachedSetters.has(storeName)) {
      chachedSetters.set(storeName, (_: any) => {
        sharedData.throwError(ReferenceError, `You can't modify state directly (in ${storeName})`);
      });
    }

    return chachedSetters.get(storeName);
  };

  /**
   * Connect property with accessors
   * @param context This of Store
   * @param valueId Id of value
   * @param propName Connecting property
   */
  const activateAccessors = (
    storeInfo: {
      name: string,
      proxy: any
    },
    valueId: symbol,
    propName: string
  ) => {
    const propertyConfig = {
      enumerable: true,
      configurable: true,
      get: valueGetter(valueId),
      set: createProtectedSetter(storeInfo.name),
    };

    Object.defineProperty(storeInfo.proxy, propName, propertyConfig);
  };

  /**
   * Add in global registry new Value Info
   * @param storeInfo Info of Store
   * @param value Initial state value
   * @param prop Name of property
   * @param notComputed Force not computed type
   */
  const createNewValue = (
    storeInfo: {
      storeId: symbol,
      name: string,
      proxy: any
    },
    value: any,
    propName: string,
    notComputed = false
  ) => {
    const isComputed = typeof value === 'function' && !notComputed;
    const propId = Symbol(`${propName} (in ${storeInfo.name})`);

    sharedData.valueMap.set(propId, {
      id: propId,
      store: storeInfo.storeId,
      name: propName,
      depends: new Set(),
      invoking: new Set(),
      cachedValue: isComputed ? sharedData.nullLastValueSymbol : value,
      type: isComputed ? ValueType.COMPUTED : ValueType.STATIC,
      value
    });

    activateAccessors(storeInfo, propId, propName);

    return propId;
  };

  return {
    createNewValue
  };
};
