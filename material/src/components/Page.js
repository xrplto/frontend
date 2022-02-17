import React, { useContext } from 'react'
import { useTheme } from '@mui/material/styles'
import { useConfig } from '../providers/Config'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from '@mui/material'

export default function ({
  pageTitle,
  onBackClick,
  appBarContent = null
}) {
  const theme = useTheme()
  const { appConfig } = useConfig()
  const { menu } = appConfig || {}
  const { width = 240 } = menu || {}

  let headerTitle = ''

  if (typeof pageTitle === 'string' || pageTitle instanceof String) {
    headerTitle = pageTitle
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
        position={'absolute'}
        sx={{
          width:`calc(100% - ${width}px)`,
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
