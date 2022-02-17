import { lazy } from 'react'
import routes from './routes'
import themes from './themes'
import Loading from '../components/Loading/Loading'

const config = {
  containers: {
    LayoutContainer: lazy(() =>
      import('../containers/LayoutContainer/LayoutContainer')
    ),
  },
  components: {
    Loading,
    Menu: lazy(() => import('../containers/Menu/Menu')),
  },
  auth: {
    signInURL: '/signin',
  },
  pwa: {
    useiOSPWAPrompt: true,
    iOSPWAPromptProps: {},
  },
  routes,
  menu: {
    width: 240,
    offlineIndicatorHeight: 12,
    initialAuthMenuOpen: false,
    initialMiniMode: false,
    initialMenuOpen: true,
    initialMobileMenuOpen: false,
    initialMiniSwitchVisibility: true,
    MenuHeader: lazy(() =>
      import('../components/MenuHeader/MenuHeader')
    ),
    MenuContent: lazy(() => import('../components/Menu/MenuContent')),
    useWindowWatcher: false,
  },
  theme: {
    themes,
    defaultThemeID: 'default',
    defaultIsDarkMode: false
  },
  pages: {
    LandingPage: lazy(() => import('../pages/LandingPage/LandingPage')),
    PageNotFound: lazy(() => import('../pages/PageNotFound/PageNotFound')),
  },
}

export default config
