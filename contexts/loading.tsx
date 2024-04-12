import React, { ReactNode, createContext, useContext, useState } from 'react';

const LoadingContext = createContext({
  loading: false,
  setLoading: (value: boolean) => {},
});

type Props = {
    children: ReactNode;
}

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }: Props) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}; 