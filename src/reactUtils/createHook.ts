import { useState, useEffect } from 'react';
import { LemonState } from '../Store/LemonState';
import { propertyListener } from '../Store/propertyListener';
import { State, BoundActions } from '../Store/types';

const hasIntersection = <A, B>(set1: Set<keyof A>, set2: Set<keyof B>): boolean => {
  const smallestSet = set1.size < set2.size ? set1 : set2;
  const biggestSet = set1 === smallestSet ? set2 : set1;
  let result = false;

  smallestSet.forEach((key: any) => {
    if (biggestSet.has(key)) {
      result = true;
    }
  });

  return result;
};

export const createHook = <T, A>(store: LemonState<T, A>) => {
  const useStore = (): State<T> & BoundActions<A> => {
    const [listenObject, setListenObject] = useState(propertyListener(store.getState()));
    const [state, setState] = useState(listenObject.proxy);
    const [wasIndexed, setWasIndexed] = useState(false);

    useEffect(() => {
      return store.subscribe((newState, changedProps) => {
        if (!wasIndexed) {
          listenObject.stop();
        }
        if (hasIntersection(changedProps, listenObject.gotKeys)) {
          if (!wasIndexed) {
            setWasIndexed(true);
            setListenObject({
              stop: () => {},
              gotKeys: listenObject.gotKeys,
              proxy: {} as State<T>
            });
          }
          setState(newState);
        }
      });
    }, [wasIndexed, state]);

    return {
      ...state,
      ...store.actions
    };
  };

  return { useStore };
};
