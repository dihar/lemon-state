import SimpleStore from '../SimpleStore';

const initialState = {
  foo: 320,
  bar: 'string',
  obj: {
    kuz: 320,
    baz: 'string'
  }
};

test('Initialing store', () => {
  const store = new SimpleStore(initialState);
  const state = store.getState();
  expect(state).toMatchObject(initialState);
});

test('Change store', () => {
  const diffState = {
    bar: 'string2',
    obj: {
      baz: 'string2',
      kuz: 320,
    }
  };
  const store = new SimpleStore(initialState);
  store.setState(diffState);
  const state = store.getState();

  expect(state).toMatchObject({
    ...initialState,
    ...diffState,
  });
});

test('Subscribe store', () => {
  const callback = jest.fn();
  const diffState = {
    bar: 'string2',
  };
  const diffState2 = {
    bar: 'string3',
  };
  const store = new SimpleStore(initialState);
  const unsubscribe = store.subscribe(callback);

  store.setState(diffState);
  expect(callback).toBeCalledTimes(1);
  expect(callback).lastCalledWith({
    ...initialState,
    ...diffState,
  });

  store.setState(diffState2);
  expect(callback).toBeCalledTimes(2);
  expect(callback).lastCalledWith({
    ...initialState,
    ...diffState2,
  });

  store.setState(diffState2);
  expect(callback).toBeCalledTimes(2);

  store.setState(diffState, true);
  expect(callback).toBeCalledTimes(2);

  unsubscribe();
  store.setState(diffState);
  expect(callback).toBeCalledTimes(2);
});

test('Throwing when wrong change state', () => {
  const store = new SimpleStore(initialState);
  const wrongChangeState = () => {
    // @ts-ignore
    store.setState('string');
  };
  expect(wrongChangeState).toThrowError(TypeError);
});
