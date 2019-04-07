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
  lang: "ru"
};

const actions = {
  onSetLoad: (payload, { setState }) => {
    setState({
      loading: payload
    });
  },
  onSwitchLang: (payload, { setState, getState }) => {
    setState({
      lang: getState().lang === "ru" ? "en" : "ru"
    });
  }
};

export const { store, useStore } = initStore(initialState, actions);
```

`initialState` - your first state and this is scheme for autocompletion, write here all properties, object expected
`actions` - object with actions, it is scheme for autocompletion too

Action expect function with two arguments:

1) `payload` - any data for working which you call action
2) `storeMethods` - object with two methods for working with store: `setState` and `getState`. `setState` - update state and rerender all components which used updated (only!) variables. `getState` - return actual state.

Function `initStore` expect two arguments `initialState`, `actions`. Each of them not required, but must be object;
`initStore` returns object with `store` and `useStore` keys. 
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
console.log("Language render");
const Loading = memo(() => {
  const { loading } = useStore(); // if you get 'loading' prop, only this prop will update component

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

**You don't need use constant, HOCs and another verbose patterns. Only one function do all you need: data access and action dispatching**

You can use several Stores, like this:

SettingsStore.js
```js
import initStore from "react-hooks-state-simple";
import { store as appStore } from "./AppStore";

const initialState = {
  userSettings
};

const actions = {
  onSetSettings: (payload, { setState }) => {
    if (!appStore.getState().loading) {
      setState({
        userSettings: payload
      });
    }
  }
};

export const { store, useStore } = initStore(initialState, actions);
```


If you use IDE, autocompletion will help you ![autocompletion](images/autocompletion.png?raw=true "autocompletion")