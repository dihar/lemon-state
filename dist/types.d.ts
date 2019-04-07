export declare type State = {
    [propName: string]: any;
};
export interface Subscriber {
    (newState: State): void;
}
export interface Unsubscribe {
    (): void;
}
export interface Store<T> {
    getState: () => State;
    setState: (newState: T) => void;
}
export interface Action<T> {
    (payload: string, storeChange: Store<T>): void | Promise<any>;
}
export interface Actions<T> {
    [propName: string]: Action<T>;
}
