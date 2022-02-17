import React from 'react'
import ResponsiveMenu from '../ResponsiveMenu/ResponsiveMenu'
import { useConfig } from '../../providers/Config'

const Menu = (props) => {
  const { appConfig } = useConfig()
  const { menu } = appConfig || {}
  const { MenuHeader, MenuContent } = menu || {}

  return (
    <ResponsiveMenu>
      {MenuHeader && <MenuHeader />}
      {MenuContent && <MenuContent />}
    </ResponsiveMenu>
  )
}

export default Menu
