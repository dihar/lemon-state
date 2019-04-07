import { State, Subscriber, Unsubscribe } from './types';
/**
 * Simple store class with minimum functions
 */
export default class SimpleStore<T> {
    private state;
    private subscribers;
    constructor(initialState?: State);
    getState: () => T;
    subscribe: (fn: Subscriber) => Unsubscribe;
    setState: (diff: T) => void;
}
