import SimpleStore from "./SimpleStore";

export type State = {
  [propName: string]: any;
};

export interface Subscriber<T> {
  (newState: T): void;
}

export interface Unsubscribe {
  (): void
}

export interface Store<T> {
  getState: () => T,
  setState: (newState: Partial<T>) => Promise<T>,
}

export interface StoreChange<T>{
  getState: () => T,
  setState: (newState: Partial<T>) => void,
  state: T,
  dispatch: Dispatch<T>
}

export interface Action<T> {
  (storeChange: StoreChange<T>, payload: any): Partial<T> | void;
}

export interface BoundAction<T> {
  (payload?: any): Promise<T>;
}

export type BoundActions<T, G> = {
  [P in keyof G]: BoundAction<T>
}

export interface Actions<T> {
  [propName: string]: Action<T>;
}

export interface StoreConfig {
  name?: string,
  debug?: boolean
}

export interface Dispatch<T> {
  (actionFunction: Action<T>, payload: any): void
}

export interface InitialedStore<T, G> {
  useStore: () => T & BoundActions<T, G>,
  store: SimpleStore<T>,
  dispatch: Dispatch<T>
}
