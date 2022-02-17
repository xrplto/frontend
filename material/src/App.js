import React, { Suspense, lazy, Component } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ConfigProvider from './providers/Config/Provider'
import config from './config'

const Layout = lazy(() => import('./containers/Layout'))

const Application = () => {
  const { pages, components, containers } = config
  const { Loading = () => <div /> } = components || {}
  const { AppContainer = React.Fragment } = containers || {}

  return (
    <Suspense fallback={<Loading />}>
      <ConfigProvider appConfig={config}>
        <AppContainer>
          <BrowserRouter>
            <Routes>
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

export default class Demo extends Component {
  render() {
    return <Application/>;
  }
}