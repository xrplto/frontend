import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ConfigProvider from '../../providers/Config/Provider'
import config from './config'

const Layout = lazy(() => import('../../containers/Layout/Layout'))

const App = () => {
  const { pages, components, containers } = config
  const { LandingPage = false } = pages || {}
  const { Loading = () => <div /> } = components || {}
  const { AppContainer = React.Fragment } = containers || {}

  return (
    <Suspense fallback={<Loading />}>
      <ConfigProvider appConfig={config}>
        <AppContainer>
          <BrowserRouter>
            <Routes>
              {LandingPage && (
                <Route path="/" exact element={<LandingPage />} />
              )}
              <Route
                path="*"
                element={
                  <Suspense fallback={<Loading />}>
                    <Layout appConfig={config} />
                  </Suspense>
                }
              />
            </Routes>
          </BrowserRouter>
        </AppContainer>
      </ConfigProvider>
    </Suspense>
  )
}

export default App
