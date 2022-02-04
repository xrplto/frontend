import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import MainLayout from './layouts/MainLayout';
import EmptyLayout from './layouts/EmptyLayout';
//
import Market from './pages/Market';
import Tokens from './pages/Token';
import TokenTester from './pages/tester/TokenTester';
import Spinner from './pages/spinner/Spinner';
import ProgressPage from './pages/progress/ProgressPage';
import TestPage from './pages/testpage/TestPage';
import NotFound from './pages/Page404';

// ----------------------------------------------------------------------
export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { path: '/', element: <Market /> },
        { path: 'market', element: <Market /> },
        { path: 'tokens', element: <Tokens /> },
        { path: 'tester', element: <TokenTester /> },
        { path: 'spinners', element: <Spinner /> },
        { path: 'progress', element: <ProgressPage /> },
        { path: 'test_page', element: <TestPage /> },
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
