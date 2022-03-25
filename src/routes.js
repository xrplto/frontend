import { Navigate, useRoutes } from 'react-router-dom';

// layouts
import MainLayout from './layouts/MainLayout';
import EmptyLayout from './layouts/EmptyLayout';
import NotFound from './layouts/Page404';

// pages
import Tokens from './pages/Token';
import TokenDetail from './pages/TokenDetail';

// ----------------------------------------------------------------------
export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { path: '/', element: <Tokens /> },
        { path: 'detail/:md5', element: <TokenDetail/> },
        { path: 'tokens', element: <Tokens /> },
        { path: '*', element: <Navigate to="/404/NotFound" /> }
      ]
    },
    {
      path: '/404',
      element: <EmptyLayout />,
      children: [
        { path: '*', element: <NotFound /> }
      ]
    }
  ]);
}
