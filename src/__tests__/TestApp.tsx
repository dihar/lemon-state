import React, { memo, useCallback, NamedExoticComponent } from 'react';
import ReactDOM from "react-dom";
import initStore from '../initStore';
import { Actions, Action } from '../types';

interface AppState {
  loading: boolean,
  error: boolean,
  data: Array<string>,
  checked: boolean
};

const initState = {
  loading: false,
  error: false,
  data: [],
  checked: false
} as AppState;

interface AppActions extends Actions<AppState> {
  onToggleChecked: Action<AppState>,
  onRequestData: Action<AppState>,
  onReset: Action<AppState>,
}

const actions:AppActions = {
  onToggleChecked: ({ state }) => ({ checked: !state.checked }),
  onRequestData: ({ setState }, payload) => {
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
    }, 500);
  },
  onReset: () => initState
};

const { useStore } = initStore(initState, actions, 'AppStore');

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

export default App;

test("Test App renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
