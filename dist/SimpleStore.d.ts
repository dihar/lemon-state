import { Subscriber, Unsubscribe } from './types';
/**
 * Simple store class with minimum functions
 */
export default class SimpleStore<T> {
    private state;
    private subscribers;
    constructor(initialState?: T);
    getState: () => T;
    subscribe: (fn: Subscriber) => Unsubscribe;
    setState: (diff: Partial<T>) => void;
}
