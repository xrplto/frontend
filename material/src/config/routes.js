/* eslint-disable react/jsx-key */
import React, { lazy } from 'react'
import AuthorizedRoute from '../components/AuthorizedRoute'
import UnauthorizedRoute from '../components/UnauthorizedRoute'

const SignIn = lazy(() => import('../pages/SignIn/SignIn'))

const SignUp = lazy(() => import('../pages/SignUp/SignUp'))
const PasswordReset = lazy(() => import('../pages/PasswordReset/PasswordReset'))
const Home = lazy(() => import('../pages/Home/Home'))
const MyAccount = lazy(() => import('../pages/MyAccount/MyAccount'))

const routes = [
  {
    path: '/signin',
    exact: true,
    element: (
      <UnauthorizedRoute>
        <SignIn redirectTo="/home" />
      </UnauthorizedRoute>
    ),
  },
  {
    path: '/signup',
    exact: true,
    element: (
      <UnauthorizedRoute>
        <SignUp redirectTo="/home" />
      </UnauthorizedRoute>
    ),
  },
  {
    path: '/password_reset',
    exact: true,
    element: (
      <UnauthorizedRoute>
        <PasswordReset redirectTo="/home" />
      </UnauthorizedRoute>
    ),
  },
  {
    path: '/my_account',
    exact: true,
    element: (
      <AuthorizedRoute>
        <MyAccount />
      </AuthorizedRoute>
    ),
  },
  {
    path: '/home',
    exact: true,
    element: (
      <AuthorizedRoute>
        <Home />
      </AuthorizedRoute>
    ),
  }
]

export default routes
