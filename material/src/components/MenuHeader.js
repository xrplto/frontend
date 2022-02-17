import React from 'react'
import { useTheme as useAppTheme } from '../providers/Theme'
import {
  IconButton,
  List,
  ListItem,
  Paper,
} from '@mui/material'

import {
  Brightness4 as Brightness4Icon,
  BrightnessHigh as BrightnessHighIcon,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

const MenuHeader = () => {
    const { toggleThisTheme, isDarkMode } = useAppTheme()
    const theme = useTheme()

  const styles = {
    icon: {
      color: theme.palette.grey.A100,
      cursor: 'pointer',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: theme.spacing(1),
      // necessary for content to be below app bar
      ...theme.mixins.toolbar,
    },
  }

  return (
    <Paper
      square={true}
      elevation={3}
      sx={{
        backgroundColor: (t) =>
          t.palette.mode === 'dark'
            ? t.palette.background.default
            : t.palette.primary.dark,
        margin: 0,
        padding: 0,
      }}
    >
      <List>
          <ListItem
            sx={{
              color: (t) => theme.palette.grey.A100,
              cursor: 'pointer',
              ...theme.mixins.toolbar,
            }}
          >
        
            <IconButton
            onClick={() => {
                toggleThisTheme('isDarkMode')
            }}
            >
            {isDarkMode ? (
                <BrightnessHighIcon sx={{ ...styles.icon }} />
            ) : (
                <Brightness4Icon sx={{ ...styles.icon }} />
            )}
            </IconButton>
            
          </ListItem>
      </List>
    </Paper>
  )
}

export default MenuHeader
