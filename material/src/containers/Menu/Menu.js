import React from 'react'
import { useConfig } from '../../providers/Config'

const Menu = (props) => {
  const { appConfig } = useConfig()
  const { menu } = appConfig || {}
  const { MenuHeader, MenuContent } = menu || {}

  return (
    <>
      {MenuHeader && <MenuHeader />}
      {MenuContent && <MenuContent />}
    </>
  )
}

export default Menu
