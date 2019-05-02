import { useState, useMemo, useEffect } from 'react';
import isPlainObject from 'is-plain-object';
import SimpleStore from './SimpleStore';
import { Actions, Action, State, BoundActions, StoreConfig, InitialedStore } from './types';

const defaultStoreConfig = {
  name: 'DefaultStore',
  debug: false
};

const devToolsConect = (
  window &&
  // @ts-ignore
  window.__REDUX_DEVTOOLS_EXTENSION__ &&
  // @ts-ignore
  window.__REDUX_DEVTOOLS_EXTENSION__.connect
) || (() => {});

/**
 * Create new Store for using react hook
 * 
 * @param {Object} initialState Start state
 * @param {Object} actions Object with actions
 * @param {Object} config Object with addidional configuration
 * 
 * @retrun store, dispatch function and useStore hook
 */
const initStore = <T extends State, G extends Actions<T>>(initialState?: T, actions?: G, config: StoreConfig = defaultStoreConfig): InitialedStore<T, G> => {
  const store = new SimpleStore<T>(initialState as T);

  let devTools: any = undefined;
  if (config.debug) {
    devTools = devToolsConect({
      name: config.name,
      features: {
        jump: true
      }
    });
    devTools.init(store.getState());
    devTools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.state) {
        store.setState(JSON.parse(message.state));
      }
    });
  }

  const dispatchAction = (actionFunction: Action<T>, payload: any) => {
    const actionResult = actionFunction({
      state: store.getState(),
      getState: store.getState,
      setState: store.setState,
      dispatch: dispatchAction,
    }, payload);

    if (isPlainObject(actionResult)) {
      store.setState(actionResult as Partial<T>);
    }

    if (devTools) {
      devTools.send(actionFunction.name, store.getState())
    }
  };

  const memoActions = <BoundActions<T, G>>Object.entries(actions || {})
    .reduce((result: BoundActions<T, G>, [key, action]) => {
      if (typeof action === 'function') {
        result[key] = (payload: any) => {
          return new Promise<T>((resolve) => {
            requestAnimationFrame(() => {
              dispatchAction(action, payload);
              resolve(store.getState());
            })
          });
        };
      }
      return result;
    }, {} as BoundActions<T, G>);

  const useStore = (): T & BoundActions<T, G>  => {
    const usingProps = <Set<string>>useMemo(() => new Set, []);
    const [innerState, setInnerState] = <[T, (state: T) => void]>useState({} as T);
    const proxyObject = <T & G>useMemo(() => new Proxy({}, {
      get: (_, prop: string) => {
        usingProps.add(prop);

        const outerState = store.getState();
        if (prop in outerState) {
          return outerState[prop];
        }
        if (prop in memoActions) {
          return memoActions[prop];
        }

        return undefined;
      },
      set: () => {
        throw new ReferenceError('You can\'t modify state directly');
      }
    }), []);

    
    useEffect(() => {
      return store.subscribe((newState) => {
        let isPropsChanged = false;
        const newInnerState: T = {} as T;

        usingProps.forEach(key => {
          if (key in memoActions) {
            return;
          }

          isPropsChanged = isPropsChanged || !Object.is(newState[key], innerState[key]);
          newInnerState[key] = newState[key];
        });

        if (isPropsChanged) {
          setInnerState(newInnerState);
        }
      });
    }, [innerState]);

    return proxyObject;
  };

  return {
    useStore,
    store,
    dispatch: dispatchAction
  };
}

export default initStore;
