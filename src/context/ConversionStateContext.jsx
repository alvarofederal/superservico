
import React, { createContext, useContext, useState, useCallback } from 'react';

const ConversionStateContext = createContext();

export const useConversionState = () => {
  const context = useContext(ConversionStateContext);
  if (!context) {
    throw new Error('useConversionState must be used within a ConversionStateProvider');
  }
  return context;
};

export const ConversionStateProvider = ({ children }) => {
  const [serviceRequestToConvert, setServiceRequestToConvert] = useState(null);

  const setRequestToConvert = useCallback((request) => {
    setServiceRequestToConvert(request);
  }, []);

  const clearServiceRequestToConvert = useCallback(() => {
    setServiceRequestToConvert(null);
  }, []);

  const value = {
    serviceRequestToConvert,
    setRequestToConvert,
    clearServiceRequestToConvert,
  };

  return (
    <ConversionStateContext.Provider value={value}>
      {children}
    </ConversionStateContext.Provider>
  );
};
