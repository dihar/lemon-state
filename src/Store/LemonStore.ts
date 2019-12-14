import isPlainObject from 'is-plain-object';
import { createWorkers } from './createWorkers';
import { SharedData } from './SharedData';
import { SmartSubscriber } from './SmartSubscriber';
import {
  Subscriber,
  Unsubscribe,
  ValueType,
  State
} from './types';

const sharedData = new SharedData();
const {
  createNewValue,
  computeUpdates
} = createWorkers(sharedData);

/**
 * Simple store class
 */
export class LemonStore<T> {
  private stateValues: Map<string, symbol>;
  private subscribers: Subscriber<T>[];
  private id = Symbol(this.name);
  private proxy: State<T>;
  private smartSubscriber: SmartSubscriber<T>;

  public isRemoved: boolean = false;

  constructor(initialState: T, public name = 'Unknown') {
    if (!isPlainObject(initialState)) {
      sharedData.throwError(TypeError, `InitialState (in ${name}) must be plain Object`);
    }

    sharedData.registerStore(this.id, this, () => this.subscribers);
    this.proxy = {} as State<T>;

    const initStateKeys = Object.keys(initialState) as (keyof T)[];
    this.stateValues = new Map();
    initStateKeys.forEach((key) => {
      const value = initialState[key];

      this.stateValues.set(key as string, createNewValue(
        {
          storeId: this.id,
          name: this.name,
          proxy: this.proxy
        },
        value,
        key as string
      ));
    });

    initStateKeys.forEach((key) => this.proxy[key]); // trigger every getter
    this.subscribers = [];
    this.smartSubscriber = new SmartSubscriber<T>(this);
  }

  public getState = (): State<T> => {
    return this.proxy;
  }

  public subscribe = (fn: Subscriber<T>): Unsubscribe => {
    this.subscribers.push(fn);

    return (): void => {
      this.subscribers = this.subscribers.filter(sub => sub !== fn);
    };
  }

  public smartSubscribe = (fn: Subscriber<T>): Unsubscribe => {
    return this.smartSubscriber.smartSubscribe(fn);
  }

  public setState = (diff: Partial<T>): void => {
    if (!isPlainObject(diff)) {
      sharedData.throwError(TypeError, `New state must be plain Object (in ${this.name})`);
    }
    if (!sharedData.canSetState()) {
      sharedData.throwError(Error, `Can't modify any state when values is computing (in ${this.name})`);
    }

    const newStateEntries = Object.entries(diff);
    const firstLevelDepsArr = new Array<symbol>();
    let isObjectsEquals = true;

    newStateEntries.forEach(([key, value]) => {
      if (this.stateValues.has(key)) {
        const valueInfo = sharedData.getValueInfoByStateProp(this.stateValues, key);

        if (valueInfo.type === ValueType.COMPUTED) {
          sharedData.throwError(TypeError, `Can't modify '${key}' property (in ${this.name}), this is computed value.`);
        }

        if (!Object.is(valueInfo.value, value)) {
          valueInfo.value = value;
          valueInfo.cachedValue = value;
          sharedData.registerChangedValue(valueInfo.id);
          isObjectsEquals = false;
  
          firstLevelDepsArr.push(...Array.from(valueInfo.invoking));
        }
      } else {
        isObjectsEquals = false;
        this.stateValues.set(key, createNewValue(
          {
            storeId: this.id,
            name: this.name,
            proxy: this.proxy
          },
          value,
          key,
          true
        ));
      }
    });

    if (!isObjectsEquals) {
      computeUpdates(new Set(firstLevelDepsArr));
    }
  }

  public remove() {
    if (!sharedData.canSetState()) {
      sharedData.throwError(Error, `Can't remove store in computed value (in ${this.name})`);
    }

    this.subscribers = [];
    const throwAccessError = () => {
      return sharedData.throwError(ReferenceError, `Store is removed! (in ${this.name})`);
    };
    this.proxy = {} as State<T>;
    this.setState = throwAccessError;
    this.subscribe = throwAccessError;
    this.smartSubscribe = throwAccessError;
    this.smartSubscriber.remove();
    const values = Array.from(this.stateValues).map(([_, value]) => value);
    this.name = `${this.name}[removed]`;
    sharedData.removeStoreValues(new Set(values));
    this.stateValues.clear();
    this.isRemoved = true;
  }
}
