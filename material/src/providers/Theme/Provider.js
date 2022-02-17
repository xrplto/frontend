import React, { useState, useEffect } from 'react'
import Context from './Context'

const Provider = ({ children, persistKey = 'theme', appConfig }) => {
  const { theme: themeConfig } = appConfig || {}
  const { defaultThemeID, defaultIsDarkMode } = themeConfig || {}

  const [themeID, setThemeID] = useState(defaultThemeID)
  const [isDarkMode, setIsDarkMode] = useState(defaultIsDarkMode)
  
  const themeIDKey = `${persistKey}:themeID`
  const isDarkModeKey = `${persistKey}:isDarkMode`
  
  const toggleThisTheme = (mode) => {
    if (mode === 'isDarkMode') setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    const persistThemeID = localStorage.getItem(themeIDKey)
    const persistIsDarkMode = localStorage.getItem(isDarkModeKey)
  
    if (persistThemeID) {
      setThemeID(persistThemeID)
    }
    if (persistIsDarkMode) {
      // convert to boolean
      setIsDarkMode(persistIsDarkMode === 'true')
    }
  }, [themeIDKey, isDarkModeKey])

  useEffect(() => {
    try {
      localStorage.setItem(themeIDKey, themeID)
    } catch (error) {
      console.warn(error)
    }
  }, [themeID, themeIDKey])
  useEffect(() => {
    try {
      localStorage.setItem(isDarkModeKey, isDarkMode)
    } catch (error) {
      console.warn(error)
    }
  }, [isDarkMode, isDarkModeKey])

  return (
    <Context.Provider
      value={{
        themeID,
        setThemeID,
        isDarkMode,
        toggleThisTheme,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default Provider
