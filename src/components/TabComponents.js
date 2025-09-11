import React, { createContext, useContext, useState } from 'react';
import { Box, Tabs } from '@mui/material';

// Create context for tab value
const TabContextProvider = createContext();

// TabContext component
export const TabContext = ({ value, children }) => {
  return (
    <TabContextProvider.Provider value={value}>
      {children}
    </TabContextProvider.Provider>
  );
};

// TabList component - just export Tabs directly since it's compatible
export const TabList = Tabs;

// TabPanel component
export const TabPanel = ({ value, children, sx = {}, ...props }) => {
  const currentValue = useContext(TabContextProvider);
  
  if (currentValue !== value) {
    return null;
  }
  
  return (
    <Box sx={sx} {...props}>
      {children}
    </Box>
  );
};

export default { TabContext, TabList, TabPanel };