import { useConfig } from '../providers/Config'
import { CssBaseline } from '@mui/material'
import React from 'react'
import { useTheme } from '../providers/Theme'
import getThemeSource from '../utils/theme'
import { SnackbarProvider } from 'notistack'
import { ThemeProvider } from '@mui/material/styles'
//import MenuProvider from '../providers/Menu/Provider'
import AppThemeProvider from '../providers/Theme/Provider'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

const LayoutContent = ({ children }) => {
  const { appConfig } = useConfig()
  const { themeID, isDarkMode } = useTheme()
  const { theme: themeConfig, notistack } = appConfig || {}
  const { themes = [] } = themeConfig || {}
  const theme = getThemeSource(themeID, themes, isDarkMode)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} {...notistack}>
            {children}
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default function ({ children }) {
  const { appConfig } = useConfig()

  return (
    <React.Fragment>      
        <AppThemeProvider appConfig={appConfig}>
          <div
            style={{
              display: 'flex',
            }}
          >
            <LayoutContent>{children}</LayoutContent>
          </div>
        </AppThemeProvider>
      
    </React.Fragment>
  )
}
