import { LemonStore } from '../Store/LemonStore';

describe('Lemon store tests', () => {

  const testSymbol = Symbol('test');

  const initialState = {
    foo: 320,
    bar: 'string',
    obj: {
      kuz: 230,
      baz: 'string'
    },
    another: testSymbol
  };

  const computedInit = {
    simple: (state: any) => {
      return `${state.foo * 200} - ${state.bar}`;
    },
    depend: (state: any) => {
      return `${state.simple} + ${state.obj.kuz}`;
    }
  };

  const testCalculateStore = (staticState: any) => {
    const simple = computedInit.simple(staticState);
    const newState = {
      ...staticState,
      simple
    };
    const depend = computedInit.depend(newState);
    return {
      ...newState,
      depend
    };
  };

  test('Initialing store', () => {
    const store = new LemonStore({
      ...initialState,
      ...computedInit
    });
  
    const state = store.getState();
    expect(state).toMatchObject(testCalculateStore(initialState));
  });
  
  test('Change store', () => {
    const diffState = {
      bar: 'string2',
      obj: {
        baz: 'string2',
        kuz: 320,
      }
    };
  
    const store = new LemonStore({
      ...initialState,
      ...computedInit
    });
    store.setState(diffState);
    const state = store.getState();
    const newState = {
      ...initialState,
      ...diffState,
    };
    expect(state).toMatchObject(testCalculateStore(newState));
  
    store.remove();
  });
  
  test('Subscribe store', () => {
    const callback = jest.fn();
    const diffState = {
      bar: 'string2',
    };
    const diffState2 = {
      bar: 'string3',
      obj: {
        kuz: 111,
        baz: 'test string'
      }
    };
    const store = new LemonStore({
      ...initialState,
      ...computedInit
    });
    const unsubscribe = store.subscribe(callback);
  
    store.setState(diffState);
    expect(callback).toBeCalledTimes(1);
    expect(callback).lastCalledWith(testCalculateStore({
      ...initialState,
      ...diffState,
    }), new Set(['bar', 'simple', 'depend']));
  
    store.setState(diffState2);
    expect(callback).toBeCalledTimes(2);
    expect(callback).lastCalledWith(testCalculateStore({
      ...initialState,
      ...diffState,
      ...diffState2,
    }), new Set(['bar', 'obj', 'simple', 'depend']));
  
    store.setState(diffState2);
    expect(callback).toBeCalledTimes(2);
  
    unsubscribe();
    store.setState(diffState);
    expect(callback).toBeCalledTimes(2);
  
    store.remove();
  });
  
  test('Calculate computed function only when it needs', () => {
    let isCallForExpected = false;
    const logCall = (fn: () => {}) => {
      if (!isCallForExpected) {
        fn();
      }
    };
    const firstCompFn = jest.fn();
    const secondCompFn = jest.fn();
    const threeCompFn = jest.fn();
    const fourCompFn = jest.fn();
    const computedProps = {
      firstComp: (state: any) => {
        logCall(firstCompFn);
        return state.foo + ' ' + state.bar;
      },
      secondComp: (state: any) => {
        logCall(secondCompFn);
        return state.obj.kuz;
      },
      threeComp: (state: any) => {
        logCall(threeCompFn);
        return state.firstComp + ' ' + state.bar;
      },
      fourComp: (state: any) => {
        logCall(fourCompFn);
        return state.secondComp + '----' + state.threeComp;
      }
    };
    const computeExpectedState = (staticState: any) => {
      isCallForExpected = true;
      const newState = {
        ...staticState,
        firstComp: computedProps.firstComp(staticState),
        secondComp: computedProps.secondComp(staticState),
      };
      const newState1 = {
        ...newState,
        threeComp: computedProps.threeComp(newState)
      };
      const newState2 = {
        ...newState1,
        fourComp: computedProps.fourComp(newState1)
      };
      isCallForExpected = false;
      return newState2;
    };
  
    const store = new LemonStore({
      ...initialState,
      ...computedProps
    });
    expect(firstCompFn).toBeCalledTimes(1);
    expect(secondCompFn).toBeCalledTimes(1);
    expect(threeCompFn).toBeCalledTimes(1);
    expect(fourCompFn).toBeCalledTimes(1);
    expect(store.getState()).toMatchObject(computeExpectedState(initialState));
  
    const diff = {
      foo: 222,
      bar: 'sss',
      obj: {
        kuz: 444,
        baz: 'dddddd'
      }
    };
    store.setState(diff);
    expect(firstCompFn).toBeCalledTimes(2);
    expect(secondCompFn).toBeCalledTimes(2);
    expect(threeCompFn).toBeCalledTimes(2);
    expect(fourCompFn).toBeCalledTimes(2);
    expect(store.getState()).toMatchObject(computeExpectedState({
      ...initialState,
      ...diff
    }));
  
    const diff2 = {
      foo: 555,
    };
    store.setState(diff2);
    expect(firstCompFn).toBeCalledTimes(3);
    expect(secondCompFn).toBeCalledTimes(2);
    expect(threeCompFn).toBeCalledTimes(3);
    expect(fourCompFn).toBeCalledTimes(3);
    expect(store.getState()).toMatchObject(computeExpectedState({
      ...initialState,
      ...diff,
      ...diff2
    }));
  
    const diff3 = {
      obj: {
        kuz: 123,
        baz: '777777'
      },
    };
    store.setState(diff3);
    expect(firstCompFn).toBeCalledTimes(3);
    expect(secondCompFn).toBeCalledTimes(3);
    expect(threeCompFn).toBeCalledTimes(3);
    expect(fourCompFn).toBeCalledTimes(4);
    expect(store.getState()).toMatchObject(computeExpectedState({
      ...initialState,
      ...diff,
      ...diff2,
      ...diff3
    }));
  
    store.remove();
  });
  
  test('Cross store dependency', () => {
      const mainStore = new LemonStore({ name: '' });
  
      const splitedStore = new LemonStore({
        first: () => mainStore.getState().name.split(' ')[0] || '',
        second: () => mainStore.getState().name.split(' ')[1] || ''
      });
  
      const lenStore = new LemonStore({
        first: () => splitedStore.getState().first.length,
        second: () => splitedStore.getState().second.length
      });
  
      const mockFn = jest.fn();
      lenStore.subscribe(mockFn);
      
      mainStore.setState({ name: 'dima dihar' });
      expect(mockFn).lastCalledWith({ first: 4, second: 5 }, new Set(['first', 'second']));
  
      mainStore.setState({ name: 'dima dihar' });
      expect(mockFn).toBeCalledTimes(1);
  
      mainStore.setState({ name: 'diha dimar' });
      expect(mockFn).toBeCalledTimes(1);
  
      mainStore.setState({ name: 'dmitrii dimas' });
      expect(mockFn).lastCalledWith({ first: 7, second: 5 }, new Set(['first']));
  
      mainStore.remove();
      splitedStore.remove();
      lenStore.remove();
  });

  test('Smart subscriber was triggered only when target property changes', () => {
    const store = new LemonStore({
      ...initialState,
      ...computedInit
    });

    const mockSubscriber = jest.fn();
    const callback = (state: any, props: any) => {
      const { foo, depend } = state;
      mockSubscriber(state, props);
    };

    store.smartSubscribe(callback);

    const diff = {
      foo: 300
    };
    store.setState(diff);

    expect(mockSubscriber).toBeCalledTimes(1);
    expect(mockSubscriber).lastCalledWith(testCalculateStore({
      ...initialState,
      ...diff
    }), new Set(['foo', 'simple', 'depend']));

    const diff2 = {
      another: Symbol()
    };
    store.setState(diff2);

    expect(mockSubscriber).toBeCalledTimes(1);

    const diff3 = {
      bar: 'newSsss'
    };

    store.setState(diff3);

    expect(mockSubscriber).toBeCalledTimes(2);
    expect(mockSubscriber).lastCalledWith(testCalculateStore({
      ...initialState,
      ...diff,
      ...diff2,
      ...diff3
    }), new Set(['bar', 'simple', 'depend']));
  });
  
  test('Throwing errors', () => {
    const store = new LemonStore({
      ...initialState,
      ...computedInit
    });
    const wrongChangeState = () => {
      // @ts-ignore
      store.setState('not object');
    };
    expect(wrongChangeState).toThrowError(TypeError);
  
    const wrongChangeStateDirectly = () => {
      store.getState().bar = 'trying set value directly';
    };
    expect(wrongChangeStateDirectly).toThrowError(ReferenceError);
  
    const wrongChangeComputedValue = () => {
      store.setState({
        simple: (() => {}) as any
      });
    };
    expect(wrongChangeComputedValue).toThrowError(TypeError);
  
    const wrongSetStateInComputeValue = () => {
      new LemonStore({
        anotherComp: () => {
          store.setState({
            foo: 2342
          });
        }
      });
    };
    expect(wrongSetStateInComputeValue).toThrowError(Error);
  
    const wrongCircularDependencyComputedValues = () => {
      const newComputed = {
        first: (state: any) => {
          return state.depend + ' ' + state.third;
        },
        second: (state: any) => {
          return state.first;
        },
        third: (state: any) => {
          return state.second;
        }
      };
  
      new LemonStore({
        ...initialState,
        ...computedInit,
        ...newComputed
      }, 'ErrorState');
    };
    expect(wrongCircularDependencyComputedValues).toThrowError(Error);
  
    const wrongRemoveStoreInComputed = () => {
      const store = new LemonStore({ ...initialState });
      new LemonStore({
        comp: () => store.remove()
      });
    };
    expect(wrongRemoveStoreInComputed).toThrowError(Error);
  
    const wrongAccessToRemovedStore = () => {
      const store = new LemonStore({ ...initialState });
      store.remove();
      store.subscribe(() => {});
    };
    expect(wrongAccessToRemovedStore).toThrowError(ReferenceError);
  
    const wrongAccessToRemoveStoreAfterInit = () => {
      const firstStore = new LemonStore({ ...initialState });
      const firstStoreState = firstStore.getState();
      const secondStore = new LemonStore({
        bar: 'string',
        comp: (state: any) => firstStoreState.foo + ' ' + state.bar
      });
      firstStore.remove();
      secondStore.setState({
        bar: 'string2'
      });
    };
    expect(wrongAccessToRemoveStoreAfterInit).toThrowError(ReferenceError);
    store.remove();
  });
});
