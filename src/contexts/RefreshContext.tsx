import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefreshTrigger = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefreshTrigger must be used within RefreshProvider");
  }
  return context;
};
