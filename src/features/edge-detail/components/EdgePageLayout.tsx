import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/authContext';
import { EdgeSidebar } from './EdgeSidebar';
import { EdgeTopbar } from './EdgeTopbar';
import type { DetailView } from '../types';

type EdgePageLayoutProps = {
  children: ReactNode;
  currentEventsConnected: boolean;
  edgeId: string;
  onRefresh: () => void;
  view: DetailView;
};

export function EdgePageLayout({
  children,
  currentEventsConnected,
  edgeId,
  onRefresh,
  view,
}: EdgePageLayoutProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const edgePath = `/edges/${encodeURIComponent(edgeId)}`;

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      <EdgeSidebar
        collapsed={sidebarCollapsed}
        edgePath={edgePath}
        view={view}
        onNavigate={navigate}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      <section className={`workspace workspace--${view}`}>
        <EdgeTopbar
          authEnabled={auth.enabled}
          currentEventsConnected={currentEventsConnected}
          edgeId={edgeId}
          onBack={() => navigate('/edges')}
          onLogout={() => void auth.logout()}
          onRefresh={onRefresh}
        />

        {children}
      </section>
    </main>
  );
}
