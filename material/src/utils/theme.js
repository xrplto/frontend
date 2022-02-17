//import { createTheme } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'

const getThemeSource = (id, ts, isDarkMode) => {
  if (ts) {
    for (let i = 0; i < ts.length; i++) {
      if (ts[i]['id'] === id) {
        const source = ts[i]['source']
        const palette = source != null ? source.palette : {}
        return createTheme({
          ...source,
          palette: { ...palette, mode: isDarkMode ? 'dark' : 'light' },
        })
      }
    }
  }

  return createTheme({
    palette: { mode: isDarkMode ? 'dark' : 'light' }
  })
}

export default getThemeSource
