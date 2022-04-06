import { Navigate, useRoutes } from 'react-router-dom';

// layouts
import MainLayout from './layouts/MainLayout';
import EmptyLayout from './layouts/EmptyLayout';
import NotFound from './layouts/Page404';

// pages
import Token from './pages/Token';
import Detail from './pages/Detail';

// ----------------------------------------------------------------------
export default function Router() {
    return useRoutes([
        {
            path: '/',
            element: <MainLayout />,
            children: [
                { path: '/', element: <Token /> },
                { path: 'detail/:exMD5', element: <Detail/> },
                { path: 'tokens', element: <Token /> },
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
