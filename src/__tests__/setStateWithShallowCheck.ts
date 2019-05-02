import setStateWithShallowCheck from '../setStateWithShallowCheck';

test('Returns previous state if objects shallow equals', () => {
  const innerObj = {
    some: 'string',
    kuz: 320
  };
  const state = {
    foo: 'string',
    bar: 320,
    baz: innerObj
  };

  let newState = setStateWithShallowCheck({ bar: 320 }, state);
  expect(newState).toBe(state);

  newState = setStateWithShallowCheck({ foo: 'string' }, state);
  expect(newState).toBe(state);

  newState = setStateWithShallowCheck({ baz: innerObj }, state);
  expect(newState).toBe(state);
});

test('Returns new state if objects not shallow equals', () => {
  const innerObj = {
    some: 'string',
    kuz: 320
  };
  const state = {
    foo: 'string',
    bar: 320,
    baz: innerObj
  };

  const diff = { baz: { ...innerObj } };
  let newState = setStateWithShallowCheck(diff, state);
  expect(newState).not.toBe(state);
  expect(newState).toMatchObject({
    ...state,
    ...diff
  });
});
