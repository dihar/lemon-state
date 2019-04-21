import { useState, useMemo, useEffect } from 'react';
import isPlainObject from 'is-plain-object';
import SimpleStore from './SimpleStore';
import { Actions, State, BoundActions } from './types';

/**
 * Create new Store for using reack hook
 * 
 * @param {Object} config
 * 
 * @retrun store ane useStore hook
 */
const initStore = <T extends State, G extends Actions<T>>(initialState?: T, actions?: G) => {
  const store = new SimpleStore<T>(initialState as T);

  const memoActions = <Actions<T>>Object.entries(actions || {})
    .reduce((result: BoundActions<T>, [key, action]) => {
      if (typeof action === 'function') {
        result[key] = (payload: any) => {
          const actionResult = action({
            state: store.getState(),
            getState: store.getState,
            setState: store.setState
          }, payload);

          if (isPlainObject(actionResult)) {
            store.setState(actionResult);
          }

          return actionResult;
        };
      }

      return result;
    }, {});

  const useStore = (): T & G  => {
    const usingProps = <Set<string>>useMemo(() => new Set, []);
    const [innerState, setInnerState] = <[State, (state: State) => void]>useState({});
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
        const newInnerState: State = {};

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
  };
}

export default initStore;
