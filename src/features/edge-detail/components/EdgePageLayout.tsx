import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/authContext';
import { getEdges } from '../../../entities/edge/api';
import { getEdgeDisplayName } from '../../../entities/edge/model';
import { EdgeSidebar } from './EdgeSidebar';
import { EdgeTopbar } from './EdgeTopbar';
import type { DetailView } from '../types';
import { useUiSettings } from '../../settings/model/settings.context';

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
  const settingsStore = useUiSettings();
  // Общий query key берет справочник из кэша после перехода со списка и загружает его при прямой ссылке.
  const edges = useQuery({ queryKey: ['edge'], queryFn: getEdges });
  const sidebarCollapsed = settingsStore.settings.interface.sidebarCollapsed;
  const edgePath = `/edges/${encodeURIComponent(edgeId)}`;
  const edge = edges.data?.items.find((item) => item.id === edgeId);
  const edgeName = edge ? getEdgeDisplayName(edge) : edgeId;

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      <EdgeSidebar
        collapsed={sidebarCollapsed}
        edgePath={edgePath}
        view={view}
        onNavigate={navigate}
        onToggleCollapsed={() => {
          void settingsStore
            .save({
              ...settingsStore.settings,
              interface: { sidebarCollapsed: !sidebarCollapsed },
            })
            .catch(() => undefined);
        }}
      />

      <section className={`workspace workspace--${view}`}>
        <EdgeTopbar
          authEnabled={auth.enabled}
          currentEventsConnected={currentEventsConnected}
          edgeName={edgeName}
          onBack={() => navigate('/edges')}
          onLogout={() => void auth.logout()}
          onRefresh={onRefresh}
        />

        {children}
      </section>
    </main>
  );
}
