import { LogOut, Menu, RefreshCw } from 'lucide-react';

type EdgeTopbarProps = {
  authEnabled: boolean;
  currentEventsConnected: boolean;
  edgeId: string;
  onBack: () => void;
  onLogout: () => void;
  onRefresh: () => void;
};

export function EdgeTopbar({
  authEnabled,
  currentEventsConnected,
  edgeId,
  onBack,
  onLogout,
  onRefresh,
}: EdgeTopbarProps) {
  return (
    <header className="topbar">
      <div>
        <span className="page-kicker">Операторская панель</span>
        <h1>Буровая установка {edgeId}</h1>
        <span className={`current-transport current-transport--${currentEventsConnected ? 'sse' : 'polling'}`}>
          {currentEventsConnected ? 'SSE live' : 'polling'}
        </span>
      </div>
      <div className="topbar-actions">
        <button type="button" className="ghost-button" onClick={onBack}>
          <Menu size={17} />
          К списку
        </button>
        <button type="button" className="icon-button" onClick={onRefresh} title="Обновить данные">
          <RefreshCw size={18} />
        </button>
        {authEnabled ? (
          <button type="button" className="ghost-button" onClick={onLogout}>
            <LogOut size={17} />
            Выйти
          </button>
        ) : null}
      </div>
    </header>
  );
}
