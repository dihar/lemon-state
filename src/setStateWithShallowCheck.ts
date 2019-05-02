import { State } from './types';

const setStateWithShallowCheck = (newState: State, state: State = {}): State => {
  if (
    Object.is(newState, state)
  ) {
    return newState;
  }

  const newStateEntries = Object.entries(newState);
  const isObjectsEquals = !newStateEntries.some(([key, value]) => !Object.is(value, state[key]));

  return isObjectsEquals ? state : {
    ...state,
    ...newState
  };
};

export default setStateWithShallowCheck;
