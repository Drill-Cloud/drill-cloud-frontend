import { Activity, BarChart3, Gauge, Menu, PanelLeftClose, PanelLeftOpen, Settings, Video } from 'lucide-react';
import type { DetailView } from '../types';

type EdgeSidebarProps = {
  collapsed: boolean;
  edgePath: string;
  view: DetailView;
  onNavigate: (path: string) => void;
  onToggleCollapsed: () => void;
};

export function EdgeSidebar({ collapsed, edgePath, view, onNavigate, onToggleCollapsed }: EdgeSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.png" alt="" />
        <div className="brand__text">
          <strong>Drill UI</strong>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="nav-list" aria-label="Основная навигация">
        <button className="nav-item nav-item--button" type="button" onClick={() => onNavigate('/edges')}>
          <Menu size={18} />
          <span className="nav-label">Установки</span>
        </button>
        <button
          className={`nav-item nav-item--button ${view === 'overview' ? 'nav-item--active' : ''}`}
          type="button"
          onClick={() => onNavigate(edgePath)}
        >
          <Gauge size={18} />
          <span className="nav-label">Обзор</span>
        </button>
        <button
          className={`nav-item nav-item--button ${view === 'archive' ? 'nav-item--active' : ''}`}
          type="button"
          onClick={() => onNavigate(`${edgePath}/archive`)}
        >
          <BarChart3 size={18} />
          <span className="nav-label">Архив</span>
        </button>
        <button
          className={`nav-item nav-item--button ${view === 'indicators' ? 'nav-item--active' : ''}`}
          type="button"
          onClick={() => onNavigate(`${edgePath}/indicators`)}
        >
          <Activity size={18} />
          <span className="nav-label">Показатели</span>
        </button>
        <button
          className={`nav-item nav-item--button ${view === 'video' ? 'nav-item--active' : ''}`}
          type="button"
          onClick={() => onNavigate(`${edgePath}/video`)}
        >
          <Video size={18} />
          <span className="nav-label">Видео</span>
        </button>
        <button className="nav-item nav-item--button" type="button" onClick={() => onNavigate('/settings')}>
          <Settings size={18} />
          <span className="nav-label">Настройки</span>
        </button>
      </nav>
    </aside>
  );
}
