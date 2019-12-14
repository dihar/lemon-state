import { LemonStore } from './LemonStore';
import { propertyListener } from './propertyListener';
import {
  Subscriber,
  Unsubscribe,
  State
} from './types';


export class SmartSubscriber<T> {
  private smartSubscribersTriggers = new Map<keyof T, Set<Subscriber<T>>>();
  private smartSubscribers = new Map<Subscriber<T>, (keyof T)[]>();
  private noIndexedSubscribers = new Set<Subscriber<T>>();

  constructor(private state: LemonStore<T>) {
    state.subscribe(this.mainSubscriber.bind(this));
  }

  private smartUnsubscribe(subscriber: Subscriber<T>): void {
    this.noIndexedSubscribers.delete(subscriber);
    this.smartSubscribers.get(subscriber)!.forEach(key => {
      this.smartSubscribersTriggers.get(key)!.delete(subscriber);
      if (!this.smartSubscribersTriggers.get(key)!.size) {
        this.smartSubscribersTriggers.delete(key);
      }
    });
    this.smartSubscribers.delete(subscriber);
  }

  private indexSubscriber(subscriber: Subscriber<T>, state: State<T>, changedProps: Set<keyof T>): Set<keyof T>{
    const {
      proxy,
      gotKeys,
      stop
    } = propertyListener(state);

    subscriber(proxy, changedProps);
    stop();

    return gotKeys;
  }

  private mainSubscriber(newState: State<T>, changedProps: Set<keyof T>) {
    const needToCall = new Set<Subscriber<T>>();

    changedProps.forEach(prop => {
      if (this.smartSubscribersTriggers.has(prop)) {
        this.smartSubscribersTriggers.get(prop)!.forEach(needToCall.add, needToCall);
      }
    });

    needToCall.forEach(subscriber => subscriber(newState, changedProps));

    this.noIndexedSubscribers.forEach(subscriber => {
      const keysToIndex = this.indexSubscriber(subscriber, newState, changedProps);
      keysToIndex.forEach(key => {
        if (!this.smartSubscribersTriggers.get(key)){
          this.smartSubscribersTriggers.set(key, new Set<Subscriber<T>>());
        }

        this.smartSubscribersTriggers.get(key)!.add(subscriber);
      });
      this.noIndexedSubscribers.delete(subscriber);
    });
  }

  public smartSubscribe(subscriber: Subscriber<T>): Unsubscribe {
    this.noIndexedSubscribers.add(subscriber);
    return () => this.smartUnsubscribe(subscriber);
  }

  public remove() {
    this.smartSubscribers.clear();
    this.smartSubscribersTriggers.clear();
    this.noIndexedSubscribers.clear();
  }
}
