import type { StoreApi } from "zustand";

/**
 * A zustand hook that can only be called with a selector (PFA-241). `create()` also accepts a
 * bare `useStore()`, which subscribes to the whole state and re-renders on every write; exposing
 * the hook through this type turns that call into a type error, so the deploy gate refuses it.
 * `getState` / `setState` / `subscribe` stay available for code outside React.
 */
export type SelectorStore<State> = (<Selected>(selector: (state: State) => Selected) => Selected) & StoreApi<State>;
