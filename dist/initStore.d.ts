import SimpleStore from './SimpleStore';
import { Actions, State } from './types';
/**
 * Create new Store for using reack hook
 *
 * @param {Object} config
 *
 * @retrun store ane useStore hook
 */
declare const initStore: <T extends State, G extends Actions<T>>(initialState?: T | undefined, actions?: G | undefined) => {
    useStore: () => T & G;
    store: SimpleStore<T>;
};
export default initStore;
