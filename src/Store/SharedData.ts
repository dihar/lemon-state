import { LemonStore } from './LemonStore';
import { ValueInfo, Subscriber } from './types';

export class SharedData {
  private removedValues = new Set<symbol>();
  private stores = new Map<symbol, LemonStore<any>>();
  
  public subscribersMap = new Map<symbol, () => Subscriber<any>[]>();
  public proxyLinkUpdaters = new Map<symbol, () => void>();
  public computeChainProp = new Set<symbol>();
  public changedValues = new Set<symbol>();
  public needUpdateValues = new Set<symbol>();
  public valueMap = new Map<symbol, ValueInfo>();
  public activeComputingValueId?: symbol = undefined;
  public resolvedValues?: Set<symbol> = undefined;
  public nullLastValueSymbol = Symbol('Null last value');

  /**
   * Remove actual work
   */
  clearWork() {
    this.changedValues.clear();
    this.needUpdateValues.clear();
    this.activeComputingValueId = undefined;
    this.resolvedValues = undefined;
    this.computeChainProp.clear();
  };

  /**
   * Getter of store
   * @param id Store id
   */
  getStoreById(id: symbol): LemonStore<any> {
    return this.stores.get(id)!;
  };

  /**
   * Clear work and throw error
   * @param ErrorConstructor Constructor function of error
   * @param message Error message
   */
  throwError(ErrorConstructor: any, message: string): never {
    this.clearWork();
    throw new ErrorConstructor(message);
  };

  /**
   * Getter of Value Info
   * @param valueId Id in values map
   */
  getValueInfo(valueId: symbol) {
    const valueInfo = this.valueMap.get(valueId)!;

    if (this.removedValues.has(valueId)) {
      const removedStore = this.getStoreById(valueInfo.store);
      this.throwError(ReferenceError, `There is no access to '${valueInfo.name}' (in ${removedStore.name})`);
    }
    return valueInfo;
  };

  /**
   * Simple getter of Value Info by property name
   * @param stateValues Map of store's state values
   * @param propName Name of property
   */
  getValueInfoByStateProp(stateValues: Map<string, symbol>, propName: string) {
    const valueId = stateValues.get(propName)!;
    return this.getValueInfo(valueId);
  };

  /**
   * Add new changed value
   * @param valueId Id of value
   */
  registerChangedValue(valueId: symbol): void {
    this.changedValues.add(valueId);
  }

  /**
   * Add new store
   * @param storeId Id of store
   * @param store Instance of store
   * @param getSubscribers function wich returns array of subscribers
   */
  registerStore(
    storeId: symbol,
    store: LemonStore<any>,
    getSubscribers: () => Subscriber<any>[],
    getUpdateProxyLink: () => void
  ): void {
    this.stores.set(storeId, store);
    this.subscribersMap.set(storeId, getSubscribers);
    this.proxyLinkUpdaters.set(storeId, getUpdateProxyLink)
  }

  /**
   * Clear links between values, mark removed parts
   * @param values Store values ids
   */
  removeStoreValues(values: Set<symbol>) {
    values.forEach(valueId => {
      const valueInfo = this.getValueInfo(valueId);
      valueInfo.depends.forEach(dependId => {
        const dependInfo = this.getValueInfo(dependId);
        dependInfo.invoking.delete(valueId);
      });
      valueInfo.invoking.forEach(invokeId => {
        const invokeInfo = this.getValueInfo(invokeId);
        invokeInfo.depends.delete(valueId);
      });
      valueInfo.cachedValue = this.nullLastValueSymbol;
      valueInfo.value = this.nullLastValueSymbol;
      valueInfo.depends = new Set();
      valueInfo.invoking = new Set();
      this.removedValues.add(valueId);
    });
  };

  /**
   * Clear store subscribers Array
   * @param storeId Store id
   */
  removeStoreSubscribers(storeId: symbol) {
    this.subscribersMap.set(storeId, () => []);
  }


  /**
   * Clear store subscribers Map
   * @param storeId Store id
   */
  removeStoreProxyLinkUpdater(storeId: symbol) {
    this.proxyLinkUpdaters.set(storeId, () => {});
  }

  /**
   * Check that there is no active computing values
   */
  canSetState(): boolean {
    return !this.resolvedValues && !this.activeComputingValueId;
  }
};
