/**
 * routes.tsx — Application routes.
 * See architecture.md section 1 for the full route list.
 */
import { createBrowserRouter } from 'react-router-dom';
import { StartPage } from './pages/Start';
import { RoomPage } from './pages/Room';
import { WallPage } from './pages/Wall';
import { IncidentPage } from './pages/Incident';
import { DashboardPage } from './pages/Dashboard';
import { PresenterPage } from './pages/Presenter';
import { SummaryPage } from './pages/Summary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StartPage />,
  },
  {
    path: '/room',
    element: <RoomPage />,
  },
  {
    path: '/wall',
    element: <WallPage />,
  },
  {
    path: '/incident',
    element: <IncidentPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/presenter',
    element: <PresenterPage />,
  },
  {
    path: '/summary',
    element: <SummaryPage />,
  },
]);
