import { lazy } from 'react'
import routes from './routes'
import themes from './themes'

const config = {
  containers: {
    LayoutContainer: lazy(() =>
      import('../containers/LayoutContainer')
    ),
  },
  components: {
    Menu: lazy(() => import('../containers/Menu')),
  },
  routes,
  menu: {
    width: 240,
    initialMobileMenuOpen: false,
    initialMiniSwitchVisibility: true,
    MenuHeader: lazy(() =>
      import('../components/MenuHeader')
    ),
  },
  theme: {
    themes,
    defaultThemeID: 'default',
    defaultIsDarkMode: false
  }
}

export default config
