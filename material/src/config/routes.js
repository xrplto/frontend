/* eslint-disable react/jsx-key */
import React, { lazy } from 'react'
const Home = lazy(() => import('../pages/Home/Home'))
const routes = [
  {
    path: '/home',
    exact: true,
    element: (
        <Home />
    ),
  }
]

export default routes
