import React, { lazy } from 'react'
import themes from './themes'
const Home = lazy(() => import('../../pages/Home'))

const config = {
  containers: {
    LayoutContainer: lazy(() =>
      import('../../components/LayoutContainer')
    ),
  },
  components: {
    Menu: lazy(() => import('../../components/Menu')),
  },
  routes:[{
    path: '/home',
    exact: true,
    element: (
        <Home />
    ),
  }],
  menu: {
    width: 240,
    MenuHeader: lazy(() =>
      import('../../components/MenuHeader')
    ),
  },
  theme: {
    themes,
    defaultThemeID: 'default',
    defaultIsDarkMode: false
  }
}

export default config
