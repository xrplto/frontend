import React from 'react'
import {
  Dashboard as DashboardIcon,
  GetApp,
  Style as StyleIcon
} from '@mui/icons-material'

//import allLocales from './locales'
import allThemes from './themes'

const getMenuItems = (props) => {
  const {
    intl,
    themeContext,
    a2HSContext,
  } = props

  const { themeID, setThemeID } = themeContext

  const { isAppInstallable, isAppInstalled, deferredPrompt } = a2HSContext

  const themeItems = allThemes.map((t) => {
    return {
      value: undefined,
      visible: true,
      primaryText: intl.formatMessage({ id: t.id }),
      onClick: () => {
        setThemeID(t.id)
      },
      leftIcon: <StyleIcon style={{ color: t.color }} />,
    }
  })
  return [
    {
      value: '/home',
      visible: isAuthorised,
      primaryText: intl.formatMessage({ id: 'home' }),
      leftIcon: <DashboardIcon />,
    },
    { divider: true },
    {
        primaryText: intl.formatMessage({ id: 'theme' }),
        secondaryText: intl.formatMessage({ id: themeID }),
        primaryTogglesNestedList: true,
        leftIcon: <StyleIcon />,
        nestedItems: themeItems,
    },
    {
      value: null,
      visible: isAppInstallable && !isAppInstalled,
      onClick: () => {
        deferredPrompt.prompt()
      },
      primaryText: intl.formatMessage({
        id: 'install',
        defaultMessage: 'Install',
      }),
      leftIcon: <GetApp />,
    },
  ]
}
export default getMenuItems
