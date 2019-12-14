import { LemonStore } from './LemonStore';
import isPlainObject from 'is-plain-object';
import {
  Subscriber,
  Unsubscribe,
  Actions,
  Action,
  BoundActions,
  StoreConfig
} from './types';

const defaultStoreConfig = {
  name: 'DefaultStore',
  debug: false
};

const devToolsConect = (
  typeof window !== 'undefined' &&
  // @ts-ignore
  window.__REDUX_DEVTOOLS_EXTENSION__ &&
  // @ts-ignore
  window.__REDUX_DEVTOOLS_EXTENSION__.connect
) || (() => {});

export class LemonState<T, A> {
  public actions = {} as BoundActions<A>;
  public isRemoved = false;

  private store: LemonStore<T>;
  private devTools: any = undefined;

  constructor(initial: T, actions: Actions<T, A>, private config: StoreConfig = defaultStoreConfig) {
    this.store = new LemonStore(initial, config.name);
    this.config = {
      ...defaultStoreConfig,
      ...config
    };

    Object.keys(actions).forEach((actionKey) => {
      const action = actions[actionKey as keyof A];
      if (typeof action !== 'function') {
        throw new Error(`Action ${actionKey} must be a function (in ${this.config.name})`);
      }

      Object.defineProperty(this.actions, actionKey, {
        enumerable: true,
        configurable: true,
        get: () => {
          return (payload?: any) => this.dispatch(action, payload);
        },
        set: () => {
          throw new Error(`Can't modify actions (in ${this.config.name})`);
        }
      });
    });

    if (config.debug) {
      this.devTools = devToolsConect({
        name: config.name,
        features: {
          jump: true
        }
      });
  
      if (this.devTools) {
        this.devTools.init(this.store.getState());
        this.devTools.subscribe((message: any) => {
          if (message.type === 'DISPATCH' && message.state) {
            this.store.setState(JSON.parse(message.state));
          }
        });
      }
    }
  }

  dispatch = (actionFunction: Action<T>, payload?: any): any => {
    const result = actionFunction({
      getState: this.store.getState.bind(this.store),
      setState: this.store.setState.bind(this.store),
      dispatch: this.dispatch.bind(this.store)
    }, payload);

    if (isPlainObject(result)) {
      this.store.setState(result as Partial<T>);
    }

    if (this.devTools) {
      this.devTools.send(actionFunction.name, this.store.getState())
    }

    return result;
  }

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.store.subscribe(subscriber);
  }

  smartSubscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.store.smartSubscribe(subscriber);
  }

  getState = () => {
    return this.store.getState();
  }

  setState = (diff: Partial<T>) => {
    this.store.setState(diff);
  }

  remove(): void {
    const throwAccessError = () => {
      throw new Error(`'${this.config.name}' is removed!`)
    };

    this.store.remove();
    this.isRemoved = true;
    this.actions = {} as BoundActions<A>;
    this.dispatch = throwAccessError;
  }
}
