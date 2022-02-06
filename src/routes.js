import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import MainLayout from './layouts/MainLayout';
import EmptyLayout from './layouts/EmptyLayout';
//
import Tokens from './pages/Token';
import Spinner from './pages/spinner/Spinner';
import NotFound from './pages/Page404';

// ----------------------------------------------------------------------
export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { path: '/', element: <Tokens /> },
        { path: 'tokens', element: <Tokens /> },
        { path: 'spinners', element: <Spinner /> },
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
