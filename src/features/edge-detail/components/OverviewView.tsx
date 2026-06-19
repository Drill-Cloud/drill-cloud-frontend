import { Activity, BarChart3, CalendarClock, Wrench } from 'lucide-react';
import { formatDateTime } from '../../../utils/format';

type OverviewViewProps = {
  edgeId: string;
  latestUpdatedAt?: Date;
  liveCount: number;
  selectedCount: number;
  totalTags: number;
  onOpenArchive: () => void;
  onOpenEquipment: () => void;
  onOpenIndicators: () => void;
};

export function OverviewView({
  edgeId,
  latestUpdatedAt,
  liveCount,
  selectedCount,
  totalTags,
  onOpenArchive,
  onOpenEquipment,
  onOpenIndicators,
}: OverviewViewProps) {
  return (
    <section className="detail-overview">
      <div className="summary-grid">
        <div className="summary-card">
          <span>Всего показателей</span>
          <strong>{totalTags}</strong>
        </div>
        <div className="summary-card">
          <span>Live</span>
          <strong>{liveCount}</strong>
        </div>
        <div className="summary-card">
          <span>Выбрано для графика</span>
          <strong>{selectedCount}</strong>
        </div>
        <div className="summary-card">
          <span>Последнее обновление</span>
          <strong>{latestUpdatedAt ? formatDateTime(latestUpdatedAt) : '-'}</strong>
        </div>
      </div>

      <section className="detail-action-panel">
        <div>
          <span className="page-kicker">Разделы</span>
          <h2>{edgeId}</h2>
        </div>
        <div className="detail-action-grid">
          <button type="button" onClick={onOpenIndicators}>
            <Activity size={18} />
            Текущие показатели
          </button>
          <button type="button" onClick={onOpenArchive}>
            <BarChart3 size={18} />
            Архив и график
          </button>
          <button type="button" onClick={onOpenEquipment}>
            <Wrench size={18} />
            Состояние оборудования
          </button>
          <button type="button">
            <CalendarClock size={18} />
            Техническое обслуживание
          </button>
        </div>
      </section>
    </section>
  );
}
