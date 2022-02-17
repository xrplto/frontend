import React, { Suspense, useEffect, useState } from 'react'
import { useRoutes } from 'react-router-dom'
import { useConfig } from '../providers/Config'

export const LayoutContent = ({ appConfig = {} }) => {
  const [messages, setMessages] = useState([])
  const {
    components,
    routes = [],
    containers,
    getDefaultRoutes
  } = appConfig || {}
  const { Menu, Loading = () => <div>Loading...</div> } = components || {}
  const { LayoutContainer = React.Fragment } = containers || {}
  const defaultRoutes = getDefaultRoutes ? getDefaultRoutes(appConfig) : []
  
  return (
        <LayoutContainer>
            <Suspense fallback={<Loading />}>{Menu && <Menu />}</Suspense>
            <Suspense fallback={<Loading />}>
            {useRoutes([...routes, ...defaultRoutes])}
            </Suspense>
        </LayoutContainer>
  )
}

export const Layout = () => {
    const { appConfig } = useConfig()
    return (
        <LayoutContent appConfig={appConfig} />
    )
}

export default Layout
