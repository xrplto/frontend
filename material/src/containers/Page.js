import React, { useContext } from 'react'
import MenuContext from '../providers/Menu/Context'
import { useTheme } from '@mui/material/styles'
import { useConfig } from '../providers/Config'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from '@mui/material'
import { ChevronLeft, Menu as MenuIcon } from '@mui/icons-material'

export default function ({
  pageTitle,
  onBackClick,
  appBarContent = null,
  tabs = null,
}) {
  const theme = useTheme()
  const { appConfig } = useConfig()
  const { menu } = appConfig || {}
  const { width = 240 } = menu || {}

  const { toggleThis, isDesktop, isMenuOpen } = useContext(MenuContext)
  let headerTitle = ''

  if (typeof pageTitle === 'string' || pageTitle instanceof String) {
    headerTitle = pageTitle
  }

  const handleDrawerMenuClick = () => {
    if (!isMenuOpen) {
      toggleThis('isMiniMode', false)
      toggleThis('isMenuOpen', true)
      if (!isDesktop) {
        toggleThis('isMobileMenuOpen')
      }
    } else {
      toggleThis('isMobileMenuOpen')
    }
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <AppBar
        position={isDesktop ? 'absolute' : undefined}
        sx={{
          width:
            isMenuOpen && isDesktop ? `calc(100% - ${width}px)` : undefined,
          zIndex: theme.zIndex['drawer'],
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          maxHeight: 64,
          marginLeft: -12,
        }}
      >
        <Toolbar>
          {(isMenuOpen && isDesktop) ||
            (!onBackClick && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerMenuClick}
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            ))}
          {/* james- check if this is dead code? */}
          {onBackClick && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={onBackClick}
            >
              <ChevronLeft />
            </IconButton>
          )}
          {!onBackClick && isMenuOpen && false && (
            <div style={{ marginRight: 32 }} />
          )}
          {/* james- check if this is dead code? */}
          <Typography variant="h6" color="inherit" noWrap>
            {headerTitle}
          </Typography>
          <div style={{ flex: '1 1 auto' }} />
          {appBarContent}
        </Toolbar>
      </AppBar>
      <div
        style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          //...theme.mixins.toolbar,
          minHeight: 64, //height of AppBar
        }}
      />
    </div>
  )
}
