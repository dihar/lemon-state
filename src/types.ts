export type State = {
  [propName: string]: any;
};

export interface Subscriber {
  (newState: State): void;
}

export interface Unsubscribe {
  (): void
}

export interface Store<T> {
  getState: () => State,
  setState: (newState: T) => void
}

export interface StoreChange<T> {
  getState: () => State,
  setState: (newState: T) => void,
  state: T
}

export interface Action<T> {
  (storeChange: StoreChange<T>, payload: any): Partial<T>;
}

export interface BoundAction<T> {
  (payload: any): void;
}

export interface BoundActions<T> {
  [propName: string]: BoundAction<T>;
}

export interface Actions<T> {
  [propName: string]: Action<T>;
}
