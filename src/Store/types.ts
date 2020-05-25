// Store types

export type SimpleFunc = (...args: any) => any;

export type ComputeFunc<S, T> = (state: S) => T;

export type LemonStoreInit<T> = {
  [K in keyof T]: T[K] extends SimpleFunc ? ComputeFunc<T, ReturnType<T[K]>> : T[K]
};

export type State<T> = {
  [K in keyof T]: LemonStoreInit<T>[K] extends SimpleFunc ? ReturnType<LemonStoreInit<T>[K]> : T[K];
};

export type ValueInfo = {
  id: symbol,
  type: ValueType,
  store: symbol,
  name: string,
  invoking: Set<symbol>, // ValueInfo was called by it
  depends: Set<symbol>, // ValueInfo call it
  cachedValue: any,
  value: any
};

export enum ValueType {
  STATIC = 'static',
  COMPUTED = 'computed'
}

export interface Subscriber<T> {
  (newState: State<T>, changedProps: Set<keyof T>): void;
}

export interface Unsubscribe {
  (): void
}


// StoreWithActions types

export interface StoreChange<T>{
  getState: () => State<T>,
  setState: (newState: Partial<T>) => void,
  dispatch: Dispatch<T>
}

export interface Action<T> {
  (storeChange: StoreChange<T>, payload?: any): Partial<T> | any;
}

export type BoundActions<A> = {
  [P in keyof A]: (payload?: any) => any
};

export type Actions<T, A> = {
  [P in keyof A]: Action<T>
};

export interface StoreConfig {
  name?: string,
  debug?: boolean
}

export interface Dispatch<T> {
  (actionFunction: Action<T>, payload?: any): void
}
