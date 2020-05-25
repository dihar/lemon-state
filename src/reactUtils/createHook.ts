import { useState, useEffect, useRef } from 'react';
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
    const listenObject = propertyListener(store.getState());
    const [state, setState] = useState(listenObject.getProxy());
    const firstInitUnsubscriber = useRef<null | (() => void)>(null);

    // if store was changed at interval between first render and calling useEffect function
    if (!firstInitUnsubscriber.current) {
      firstInitUnsubscriber.current = store.subscribe((newState, changedProps) => {
        listenObject.stop();

        if (firstInitUnsubscriber.current) {
          firstInitUnsubscriber.current();
        }

        if (hasIntersection(changedProps, listenObject.getUsedkeys())) {
          setState(newState);
        }
      });
    }

    useEffect(() => {
      listenObject.stop();

      if (firstInitUnsubscriber.current) {
        firstInitUnsubscriber.current();
      }

      return store.subscribe((newState, changedProps) => {
        if (hasIntersection(changedProps, listenObject.getUsedkeys())) {
          setState(newState);
        }
      });
    }, []);

    return Object.assign(state, store.actions);
  };

  return { useStore };
};
