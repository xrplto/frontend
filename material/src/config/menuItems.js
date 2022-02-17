import React from 'react'
import {
  Dashboard as DashboardIcon,
  GetApp,
  Style as StyleIcon
} from '@mui/icons-material'

import allThemes from './themes'

const getMenuItems = (props) => {
  const { themeContext } = props

  const { themeID, setThemeID } = themeContext

  const themeItems = allThemes.map((t) => {
    return {
      value: undefined,
      visible: true,
      primaryText: {id: t.id },
      onClick: () => {
        setThemeID(t.id)
      },
      leftIcon: <StyleIcon style={{ color: t.color }} />,
    }
  })
  return [
    {
      value: '/home',
      visible: true,
      primaryText: 'home',
      leftIcon: <DashboardIcon />,
    },
    { divider: true },
    {
        primaryText: 'theme',
        secondaryText: { themeID },
        primaryTogglesNestedList: true,
        leftIcon: <StyleIcon />,
        nestedItems: themeItems,
    }
  ]
}
export default getMenuItems
