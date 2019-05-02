**Package moved to https://github.com/dihar/lemon-state**

# react-hooks-state-simple

Very simple satet manager for react, based on hooks. No action constants, providers and HOCs, only one function in component. The component updates only when update used properties. Type-safe checked with state types.

## install

```bash
npm i react-hooks-state-simple
```

## usage

Create file with initialing of store:

AppStore.js

```js
import initStore from "react-hooks-state-simple";

const initialState = {
  loading: true,
  lang: "ru",
  data: []
};

const actions = {
  onSetLoad: ({ state }, payload) => ({
    loading: payload
  }),
  onSwitchLang: ({ state }, payload) => ({
    lang: state.lang === "ru" ? "en" : "ru"
  }),
  onAsyncAction: async ({ getState, setState, state }, payload) => {
    setState({
      loading: true
    });

    data = await loadData(payload);

    setState({
      loading: false,
      data
    });
  })
};

const config = {
  name: 'AppStore',
  debug: process.env.NODE_ENV === 'development'
};

export const { store, useStore } = initStore(initialState, actions, config);
```

`initialState` - your first state and this is scheme for autocompletion, write here all properties, object expected
`actions` - object with actions, it is scheme for autocompletion too
`config` - object with config for debugging

Action expect function with two arguments:

1) `storeMethods` - object with three properties for working with store: `state`, `setState` and `getState`:
  `setState` - update state and rerender all components which used updated (only!) variables
  `getState` - return actual state
  `state` - state current at the time of the action's call 
2) `payload` - any data for working which you call action

Action function can return plain object, it update state.

Function `initStore` expect two arguments `initialState`, `actions`. Each of them not required, but must be object:
`initStore` returns object with `store` and `useStore` keys
`store` - need for working with store outside of component, for side effects and logging, it have interface

```js
class SimpleStore {
  // get actual state
  getState: () => State;

  // method expect function which be called when state will be updated, return unsubscribe callback
  subscribe: (fn) => Unsubscribe;

  // set new state, call subscribers only after check different by Object.is algorithm
  setState: (diff) => void;
}
```

`useStore` - hook for react component. Return your store with actions. If you once get something property, when it property change component will update.

Loading.js
```js
import React, { memo } from "react";
import { useStore } from "./AppStore";

const Language = memo(() => {
  const { lang, onSwitchLang, onSetLoad } = useStore();
  console.log("Loading render");
  return (
    <div>
      <button onClick={onSwitchLang}>change language</button>
      <button onClick={() => onSetLoad(false)}>change loading</button>
      <div>language: {lang}</div>
    </div>
  );
});

export default Language;
```

Language.js
```js
import React, { memo } from "react";
import { useStore } from "./AppStore";
const Loading = memo(() => {
  const { loading } = useStore(); // if you get 'loading' prop, only this prop will update component
  console.log("Language render");

  return <div>{loading ? "loading" : "loaded"}</div>;
});

export default Loading;
```

App.js
```js
import React, { memo } from 'react';
import Language from './Language';
import Loading from './Loading';

export default () => (
  <div>
    <Language />
    <Loading />
  </div>
);
```

See example in [CodeSandbox](https://codesandbox.io/embed/9lp0nl39op)

What we see in console:
1) Components first render:
```
Language render 
Loading render 
```

2) Click to 'Change language' Button, the both components updated, but Loading component doesn't use `lang` property. It was because **first update of store fire updating all dependent components**
In console appended:
```
Language render
Loading render
```

3) Click to 'Change language' Button only Language update forever
In console appended:
```
Language render 
```

4) Click to 'change loading' Button only Loading update
In console appended:
```
Loading render 
```

**You don't need use constants, HOCs and another verbose patterns. Only one function do all you need: data access and action dispatching**

You can use several Stores, like this:

SettingsStore.js
```js
import initStore from "react-hooks-state-simple";
import { store as appStore } from "./AppStore";

const initialState = {
  userSettings
};

const actions = {
  onSetSettings: ({ state }, payload) => {
    if (!appStore.getState().loading) {
      return {
        userSettings: payload
      };
    }
  }
};

export const { store, useStore } = initStore(initialState, actions);
```

If you use IDE, autocompletion will help you ![autocompletion](images/autocompletion.png?raw=true "autocompletion")

## Typescript

You can use helper Types `import { Actions } from 'react-hooks-state-simple'`. See `src/__tests__/TestApp` example.

## Debug

You can use redux-devtools-extension

```js
const config = {
  name: 'AppStore',
  debug: process.env.NODE_ENV === 'development'
};

export const { store, useStore } = initStore(initialState, actions, config);
```


