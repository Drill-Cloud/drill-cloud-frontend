import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { EdgeDetailPage } from '../features/edge-detail/EdgeDetailPage';
import { EdgesDashboard } from '../features/edges-dashboard/EdgesDashboard';

function DashboardRoute() {
  const navigate = useNavigate();

  return (
    <EdgesDashboard
      onOpenEdge={(edgeId) => navigate(`/edges/${encodeURIComponent(edgeId)}`)}
      onOpenEquipment={(edgeId) => navigate(`/edges/${encodeURIComponent(edgeId)}/equipment`)}
    />
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/edges" replace />} />
        <Route path="/edges" element={<DashboardRoute />} />
        <Route path="/edges/:edgeId" element={<EdgeDetailPage view="overview" />} />
        <Route path="/edges/:edgeId/archive" element={<EdgeDetailPage view="archive" />} />
        <Route path="/edges/:edgeId/indicators" element={<EdgeDetailPage view="indicators" />} />
        <Route path="/edges/:edgeId/equipment" element={<EdgeDetailPage view="equipment" />} />
        {/* Электросхемы временно скрыты до готовности опубликованных схем и diagram-service. */}
        {/* <Route path="/edges/:edgeId/electrical" element={<EdgeDetailPage view="electrical" />} /> */}
        <Route path="*" element={<Navigate to="/edges" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
