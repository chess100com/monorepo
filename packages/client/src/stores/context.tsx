import { createContext, useContext, type ReactNode, type ReactElement } from 'react';
import { rootStore, type RootStore } from '@chess100com/client-core';

const StoreContext = createContext<RootStore>(rootStore);

export function StoreProvider({ children }: { children: ReactNode }): ReactElement {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
}

export function useStore(): RootStore {
  return useContext(StoreContext);
}
