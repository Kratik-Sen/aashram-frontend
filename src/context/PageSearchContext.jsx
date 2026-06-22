import { createContext, useCallback, useContext, useMemo, useState } from "react";

const PageSearchContext = createContext({
  searchTerm: "",
  setSearchTerm: () => {},
  clearSearch: () => {}
});

export const PageSearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const clearSearch = useCallback(() => setSearchTerm(""), []);
  const value = useMemo(() => ({ searchTerm, setSearchTerm, clearSearch }), [searchTerm, clearSearch]);

  return <PageSearchContext.Provider value={value}>{children}</PageSearchContext.Provider>;
};

export const usePageSearch = () => useContext(PageSearchContext);
