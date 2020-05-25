import React, { memo, useCallback, NamedExoticComponent } from 'react';
import {  LemonState, createHook } from '../';
import { Actions, Action, State } from '../types';

interface AppState {
  loading: boolean,
  error: boolean,
  data: Array<string>,
  checked: boolean,
  computed: (state: State<AppState>) => string
};

const initState: AppState = {
  loading: false,
  error: false,
  data: [],
  checked: false,
  computed: state => state.data.join(':')
};

interface AppActions {
  onToggleChecked: Action<AppState>,
  onRequestData: Action<AppState>,
  onReset: Action<AppState>,
}

const actions: Actions<AppState, AppActions> = {
  onToggleChecked: ({ getState }) => ({ checked: !getState().checked }),
  onRequestData: ({ setState, getState }, payload) => {
    setState({
      loading: true,
      data: [],
    });

    setTimeout(() => {
      if (payload && payload.withError) {
        setState({
          loading: false,
          error: true
        });
      } else {
        setState({
          loading: false,
          data: [
            'some',
            'data'
          ]
        });
      }
    }, 10);
  },
  onReset: () => initState
};

const appStore = new LemonState(initState, actions);

const { useStore } = createHook(appStore);

interface Props {
  onRender: (param: string) => void
}

type TestComponent = NamedExoticComponent<Props>;

const FirstSection = memo(({ onRender }) => {
  const state = useStore();
  const handleClickErrorRequest = useCallback(() => {
    state.onRequestData({
      withError: true
    });
  }, [state.onRequestData]);

  onRender('first');
  return (
    <div>
      <span data-testid='loading'>{state.loading && 'Loading'}</span>
      <span data-testid='error'>{state.error && 'Error'}</span>
      <div data-testid='list'>
        {state.data.map((item, index) => (
          <span key={index} data-testid={`item(${index})`}>{item}</span>
        ))}
      </div>
      <span data-testid='join-list'>{state.computed}</span>
      <button data-testid='loadButton' onClick={state.onRequestData}>Load data</button>
      <button data-testid='loadErrorButton' onClick={handleClickErrorRequest}>Load data with error</button>
      <input data-testid='checkbox' onChange={state.onToggleChecked} type='checkbox' />
      <button data-testid='resetButton' onClick={state.onReset}>Reset</button>
    </div>
  );
}) as TestComponent;

const SecondSection =  memo(({ onRender }) => {
  const { checked } = useStore();
  onRender('second');
  return (
    <div data-testid='checked'>{checked ? 'Checked' : 'Not checked'}</div>
  );
}) as TestComponent;

const App = ({ onRender = () => {} }) => (
  <div>
    <FirstSection onRender={onRender} />
    <SecondSection onRender={onRender} />
  </div>
);

test('fake test', () => {
  expect('').toBe('');
});

export default App;
