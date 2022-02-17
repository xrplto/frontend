import React from 'react'
import { useConfig } from '../providers/Config'

const Menu = (props) => {
  const { appConfig } = useConfig()
  const { menu } = appConfig || {}
  const { MenuHeader } = menu || {}

  return (
    <>
      {MenuHeader && <MenuHeader />}
    </>
  )
}

export default Menu
