import { ValueType } from './types';
import { SharedData } from './SharedData';

export const getDependencyWorker = (sharedData: SharedData) => {
  /**
   * Throw error about circular dependency
   */
  const circularDependencyError = (): never => {
    const dependsChain = Array.from(sharedData.computeChainProp);
    const stackMessage = dependsChain.reverse().reduce((acc, valueId, index) => {
      const endStr = index !== dependsChain.length - 1 ? '<== \n' : '';
      const value = sharedData.getValueInfo(valueId);
      const store = sharedData.getStoreById(value.store);
      return `${acc} '${value.name}' (in ${store.name}) ${endStr}`;
    }, '\n');
    return sharedData.throwError(Error, `Circular dependency detected! ${stackMessage}`);
  };

  /**
   * Check the cached and static value and return it, resolve static values
   * @param valueId Value id
   */
  const checkDependsAndReturnCacheInValue = (valueId: symbol): any => {
    const valueInfo = sharedData.getValueInfo(valueId);

    if (valueInfo.type === ValueType.STATIC) {

      if (sharedData.resolvedValues) {
        sharedData.resolvedValues.add(valueId);
      }
      return valueInfo.cachedValue;
    }

    if (sharedData.computeChainProp.has(valueId)) {
      circularDependencyError();
    }

    if (!sharedData.resolvedValues) {
      return valueInfo.cachedValue;
    }

    if (valueInfo.cachedValue !== sharedData.nullLastValueSymbol && sharedData.resolvedValues) {
      if (sharedData.resolvedValues.has(valueId)) {
        return valueInfo.cachedValue;
      }

      let isDependsChanged = false;

      valueInfo.depends.forEach(depend => {
        getDataWithListeningDependencies(depend);
        isDependsChanged = isDependsChanged || sharedData.changedValues.has(depend);
        if (sharedData.resolvedValues && !sharedData.resolvedValues.has(depend)) {
          const store = sharedData.getStoreById(valueInfo.store);
          sharedData.throwError(Error, `
            Value '${valueInfo.name}' (in ${store.name}) not resolve after calculating. It is library error.
            Please send the issue with description of this case. https://github.com/dihar/lemon-state
          `);
        }
      });

      if (isDependsChanged) {
        return sharedData.nullLastValueSymbol;
      } else {
        sharedData.resolvedValues.add(valueId);
        return valueInfo.cachedValue;
      }
    }

    return sharedData.nullLastValueSymbol;
  };

  /**
   * Get data from value, compute dependencies if need
   * @param valueId Value id
   */
  const getDataWithListeningDependencies = (valueId: symbol): any => {
    const valueInfo = sharedData.getValueInfo(valueId);
    sharedData.needUpdateValues.delete(valueId);

    if (sharedData.activeComputingValueId) {
      valueInfo.invoking.add(sharedData.activeComputingValueId);
      sharedData.getValueInfo(sharedData.activeComputingValueId).depends.add(valueId);
    }

    const cached = checkDependsAndReturnCacheInValue(valueId);
    if (cached !== sharedData.nullLastValueSymbol) {
      return cached;
    }

    valueInfo.depends.forEach(dependId => {
      const dependValueInfo = sharedData.getValueInfo(dependId);
      dependValueInfo.invoking.delete(valueId);
    });

    const prevValueId = sharedData.activeComputingValueId;
    sharedData.computeChainProp.add(valueId);
    sharedData.activeComputingValueId = valueId;
    valueInfo.depends.clear();

    const store = sharedData.getStoreById(valueInfo.store);
    const value = valueInfo.value(store.getState());

    const isValueChanged = !Object.is(value, valueInfo.cachedValue);
    valueInfo.cachedValue = value;
    sharedData.computeChainProp.delete(valueId);
    sharedData.activeComputingValueId = prevValueId;

    if (sharedData.resolvedValues) {
      if (isValueChanged) {
        sharedData.changedValues.add(valueId);
        valueInfo.invoking.forEach(invoke => sharedData.needUpdateValues.add(invoke));
      }

      sharedData.resolvedValues.add(valueId);
    }
  
    return value;
  };


  /**
   * Compute value function
   * @param deps Id of first level values wich need update
   */
  const computeUpdates = (deps: Set<symbol>) => {
    sharedData.resolvedValues = new Set();

    deps.forEach(depend => sharedData.needUpdateValues.add(depend));
    while (sharedData.needUpdateValues.size) {
      sharedData.needUpdateValues.forEach(getDataWithListeningDependencies);
    }
    sharedData.resolvedValues = undefined;

    const needUpdateStoreProps = new Map<symbol, Set<string>>();
    sharedData.changedValues.forEach(valueId => {
      const valueInfo = sharedData.getValueInfo(valueId);
      if (!needUpdateStoreProps.has(valueInfo.store)) {
        needUpdateStoreProps.set(valueInfo.store, new Set());
      }

      needUpdateStoreProps.get(valueInfo.store)!.add(valueInfo.name);
    });

    Array.from(needUpdateStoreProps).forEach(([storeId, propSet]) => {
      const store = sharedData.getStoreById(storeId);
      if (store) {
        const getSubscribers = sharedData.subscribersMap.get(storeId)!;
        const getProxyLinkUpdaters = sharedData.proxyLinkUpdaters.get(storeId)!;
        getProxyLinkUpdaters();
        getSubscribers().forEach((subscriber => subscriber(store.getState(), propSet)));
      }
    });

    sharedData.changedValues.clear();
  };

  return {
    getDataWithListeningDependencies,
    computeUpdates
  };
};
