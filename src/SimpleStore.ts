import isPlainObject from 'is-plain-object';
import setStateWithShallowCheck from './setStateWithShallowCheck';
import { Subscriber, Unsubscribe } from './types';

/**
 * Simple store class with minimum functions
 */
export default class SimpleStore<T> {
  private state: T;
  private subscribers: Subscriber<T>[];

  constructor(initialState: T = {} as T) {
    if (!isPlainObject(initialState)) {
      throw new TypeError('initialState must be plain Object')
    }

    this.state = initialState ? { ...initialState } : ({} as T);
    this.subscribers = [];
  }

  public getState = (): T => {
    return this.state as T;
  }

  public subscribe = (fn: Subscriber<T>): Unsubscribe => {
    this.subscribers.push(fn);

    return (): void => {
      this.subscribers = this.subscribers.filter(sub => sub !== fn);
    };
  }

  public setState = (diff: Partial<T>, silent?: boolean): void => {
    if (!isPlainObject(diff)) {
      throw new TypeError('new state must be plain Object')
    }

    const newState = setStateWithShallowCheck(diff, this.state) as T;
    if (!Object.is(newState, this.state)) {
      this.state = newState;
      if (!silent) {
        this.subscribers.forEach(sub => sub(newState));
      }
    }
  }
}
