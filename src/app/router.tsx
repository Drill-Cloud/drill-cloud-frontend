import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { EdgeCurrentPage } from '../features/edge-detail/EdgeCurrentPage';
import { EdgeDetailPage } from '../features/edge-detail/EdgeDetailPage';
import { EdgeHistoryPage } from '../features/edge-detail/EdgeHistoryPage';
import { EdgeVideoPage } from '../features/edge-detail/EdgeVideoPage';
import { EdgesDashboard } from '../features/edges-dashboard/EdgesDashboard';

function DashboardRoute() {
  const navigate = useNavigate();

  return <EdgesDashboard onOpenEdge={(edgeId) => navigate(`/edges/${encodeURIComponent(edgeId)}`)} />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/edges" replace />} />
        <Route path="/edges" element={<DashboardRoute />} />
        <Route path="/edges/:edgeId" element={<EdgeDetailPage />} />
        <Route path="/edges/:edgeId/archive" element={<EdgeHistoryPage />} />
        <Route path="/edges/:edgeId/indicators" element={<EdgeCurrentPage />} />
        <Route path="/edges/:edgeId/video" element={<EdgeVideoPage />} />
        <Route path="*" element={<Navigate to="/edges" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
