/**
 * routes.tsx — Application routes.
 * See architecture.md section 1 for the full route list.
 * Phase 1: only `/` and `/room` are implemented.
 */
import { createBrowserRouter } from 'react-router-dom';
import { StartPage } from './pages/Start';
import { RoomPage } from './pages/Room';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StartPage />,
  },
  {
    path: '/room',
    element: <RoomPage />,
  },
  // Phase 6+: satellite windows and additional routes
  // { path: '/wall', element: <WallPage /> },
  // { path: '/incident', element: <IncidentPage /> },
  // { path: '/dashboard', element: <DashboardPage /> },
  // { path: '/presenter', element: <PresenterPage /> },
  // { path: '/summary', element: <SummaryPage /> },
]);
