import isPlainObject from 'is-plain-object';
import setStateWithShallowCheck from './setStateWithShallowCheck';
import { State, Subscriber, Unsubscribe } from './types';

/**
 * Simple store class with minimum functions
 */
export default class SimpleStore<T> {
  private state: State;
  private subscribers: Subscriber[];

  constructor(initialState: T = {} as T) {
    if (!isPlainObject(initialState)) {
      throw new TypeError('initialState must be plain Object')
    }

    this.state = initialState ? { ...initialState } : {};
    this.subscribers = [];
  }

  public getState = (): T => {
    return this.state as T;
  }

  public subscribe = (fn: Subscriber): Unsubscribe => {
    this.subscribers.push(fn);

    return (): void => {
      this.subscribers = this.subscribers.filter(sub => sub !== fn);
    };
  }

  public setState = (diff: Partial<T>): void => {
    if (!isPlainObject(diff)) {
      throw new TypeError('new state must be plain Object')
    }

    const newState = setStateWithShallowCheck(diff, this.state);
    if (!Object.is(newState, this.state)) {
      this.state = newState;
      this.subscribers.forEach(sub => sub(newState));
    }
  }
}
