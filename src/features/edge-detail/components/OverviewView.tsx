import {
  Activity,
  Archive,
  ArrowUpRight,
  Clock3,
  Database,
  Settings,
  SlidersHorizontal,
  Video,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { formatDateTime } from '../../../utils/format';

type OverviewViewProps = {
  edgeId: string;
  latestUpdatedAt?: Date;
  liveCount: number;
  totalTags: number;
  onOpenArchive: () => void;
  onOpenIndicators: () => void;
  onOpenSettings: () => void;
  onOpenVideo: () => void;
};

type NavigationCardProps = {
  accent: 'copper' | 'cyan' | 'green' | 'violet';
  description: string;
  icon: ComponentType<{ size?: number }>;
  kind: 'archive' | 'indicators' | 'settings' | 'video';
  label: string;
  onClick: () => void;
};

function NavigationCard({ accent, description, icon: Icon, kind, label, onClick }: NavigationCardProps) {
  return (
    <button
      className={`overview-nav-card overview-nav-card--${accent} overview-nav-card--${kind}`}
      type="button"
      onClick={onClick}
    >
      <span className="overview-nav-card__visual" aria-hidden="true">
        <span className="overview-nav-card__orb"><Icon size={24} /></span>
        <span className="overview-nav-card__signal" />
      </span>
      <span className="overview-nav-card__copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className="overview-nav-card__action" aria-hidden="true">
        Открыть <ArrowUpRight size={17} />
      </span>
    </button>
  );
}

export function OverviewView({
  edgeId,
  latestUpdatedAt,
  liveCount,
  totalTags,
  onOpenArchive,
  onOpenIndicators,
  onOpenSettings,
  onOpenVideo,
}: OverviewViewProps) {
  return (
    <section className="detail-overview">
      <div className="overview-intro">
        <div>
          <span className="page-kicker"><Database size={15} /> Состояние установки</span>
          <h2>Ключевые данные и разделы</h2>
          <p>Оперативная навигация по телеметрии установки <strong>{edgeId}</strong>.</p>
        </div>
        <span className="overview-intro__pulse" aria-hidden="true"><i /></span>
      </div>

      <div className="summary-grid" aria-label="Сводка по установке">
        <article className="summary-card summary-card--total">
          <span className="summary-card__icon"><SlidersHorizontal size={19} /></span>
          <span className="summary-card__label">Всего показателей</span>
          <strong>{totalTags}</strong>
          <small>Подключено к установке</small>
        </article>
        <article className="summary-card summary-card--live">
          <span className="summary-card__icon"><Activity size={19} /></span>
          <span className="summary-card__label">Live</span>
          <strong>{liveCount}</strong>
          <small>Передают данные сейчас</small>
        </article>
        <article className="summary-card summary-card--archive">
          <span className="summary-card__icon"><Archive size={19} /></span>
          <span className="summary-card__label">Архив</span>
          <strong>Доступен</strong>
          <small>История и сравнение значений</small>
        </article>
        <article className="summary-card summary-card--updated">
          <span className="summary-card__icon"><Clock3 size={19} /></span>
          <span className="summary-card__label">Последнее обновление</span>
          <strong>{latestUpdatedAt ? formatDateTime(latestUpdatedAt) : '—'}</strong>
          <small>Московское время</small>
        </article>
      </div>

      <section className="detail-action-panel">
        <div className="detail-action-panel__heading">
          <div>
            <span className="page-kicker">Разделы установки</span>
            <h2>Куда перейти</h2>
          </div>
          <p>Основные рабочие сценарии собраны в одном месте.</p>
        </div>
        <div className="detail-action-grid">
          <NavigationCard accent="green" description="Плитки параметров и live-график" icon={Activity} kind="indicators" label="Показатели" onClick={onOpenIndicators} />
          <NavigationCard accent="copper" description="История, интервалы и сравнение" icon={Archive} kind="archive" label="Архив" onClick={onOpenArchive} />
          <NavigationCard accent="cyan" description="Камеры и видеопотоки установки" icon={Video} kind="video" label="Видео" onClick={onOpenVideo} />
          <NavigationCard accent="violet" description="Параметры интерфейса и графиков" icon={Settings} kind="settings" label="Настройки" onClick={onOpenSettings} />
        </div>
      </section>
    </section>
  );
}
