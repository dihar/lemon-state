import { LemonState } from '../Store/LemonState';
import { LemonStore } from '../Store/LemonStore';
import { Actions, State, StoreChange, Action } from '../types';

describe('Lemon actions tests', () => {

  interface InitialState {
    foo: number,
    bar: string,
    comp: (state: State<InitialState>) => number
    comp2: (state: State<InitialState>) => string
  }

  const initialState: InitialState = {
    foo: 320,
    bar: 'string',
    comp: (state) => state.foo * 20,
    comp2: (state) => 'calculate: ' + state.comp
  };



  test('Store must be changed',() => {
    interface Actions1 {
      changeFoo: Action<InitialState>
    }

    const actions: Actions<InitialState, Actions1> = {
      changeFoo: ({ getState }, payload: number) => {
        const { foo } = getState();
  
        return {
          foo: foo * payload
        };
      }
    };

    const store = new LemonState(initialState, actions);
    store.actions.changeFoo(10);
    let foo = initialState.foo * 10;

    expect(store.getState()).toMatchObject({
      foo,
      bar: 'string',
      comp: initialState.comp({ foo } as any)
    });

    store.actions.changeFoo(.5);
    foo = initialState.foo * 5;

    expect(store.getState()).toMatchObject({
      foo,
      bar: 'string',
      comp: initialState.comp({ foo } as any)
    });
  });

  test('Action must be dispatched', () => {
    interface Actions2 {
      changeFoo: Action<InitialState>
      changeBar: Action<InitialState>
    }
    const mockFn = jest.fn();

    const actions: Actions<InitialState, Actions2> = {
      changeFoo({ dispatch }) {
        dispatch(actions.changeBar);
      },
      changeBar() {
        mockFn();
      }
    };

    const store = new LemonState(initialState, actions);
    store.actions.changeFoo();
    store.actions.changeFoo();
    store.actions.changeBar();

    expect(mockFn).toBeCalledTimes(3);

    store.remove();
  });
});
