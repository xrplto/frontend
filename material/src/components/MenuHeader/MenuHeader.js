import React from 'react'
import { useMenu } from '../../providers/Menu'
import { useTheme as useAppTheme } from '../../providers/Theme'
import {
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  ChromeReaderMode,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  Brightness4 as Brightness4Icon,
  BrightnessHigh as BrightnessHighIcon,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

const MenuHeader = () => {
  const { toggleThisTheme, isDarkMode } = useAppTheme()
  const menuContext = useMenu()
  const theme = useTheme()
  const {
    toggleThis,
    isDesktop,
    isMiniMode,
    isMenuOpen,
  } = menuContext || {}

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
            <ListItemSecondaryAction>
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
              {isDesktop && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={() => {
                      toggleThis('isMenuOpen', false)
                    }}
                  >
                    
                  <ChevronLeft sx={{ ...styles.icon }} />
                  </IconButton>{' '}
                </>
              )}
            </ListItemSecondaryAction>
          </ListItem>

        
          <ListItem
            onClick={() => {
              toggleThis('isAuthMenuOpen')
            }}
          >
            
            <ListItemText
            sx={{
                color: (t) => theme.palette.grey.A100,
                cursor: 'pointer',
                marginLeft:
                !isMenuOpen && isDesktop && authData.photoURL
                    ? 7
                    : undefined,
                textOverflow: 'ellipsis',
            }}
            secondaryTypographyProps={{
                color: (t) => theme.palette.grey.A100,
                width: 80,
                textOverflow: 'ellipsis',
            }}
            primary={"authData.displayName"}
            secondary={"authData.email"}
            />
            
            
            <ListItemSecondaryAction
            onClick={() => {
                toggleThis('isAuthMenuOpen')
            }}
            >
            <IconButton>
            <ArrowDropUpIcon sx={{ ...styles.icon }} />
            </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
      </List>
    </Paper>
  )
}

export default MenuHeader
