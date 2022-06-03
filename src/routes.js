import { Navigate, useRoutes } from 'react-router-dom';

// layouts
import MainLayout from './layouts/MainLayout';
import EmptyLayout from './layouts/EmptyLayout';
import NotFound from './layouts/Page404';

// pages
import TokenList from './pages/TokenList';
import TokenDetail from './pages/TokenDetail';

// ----------------------------------------------------------------------
export default function Router() {
    return useRoutes([
        {
            path: '/',
            element: <MainLayout />,
            children: [
                { path: '/', element: <TokenList /> },
                { path: 'token/:urlSlug', element: <TokenDetail/> },
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
