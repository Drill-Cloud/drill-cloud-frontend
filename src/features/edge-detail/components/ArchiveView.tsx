import { useState } from 'react';
import { CalendarClock, DatabaseZap } from 'lucide-react';
import type { CurrentItem } from '../../../entities/current/types';
import { HistoryChartSet } from '../../../features/history-chart/HistoryChartSet';
import type { AvgLineMode } from '../../../features/history-chart/chartTypes';
import type { DateRangeState } from '../../../features/history/dateRange';
import type { HistoryGranularity } from '../../../utils/historyGranularity';

type ArchiveViewProps = {
  edgeId: string;
  getTagLabel: (tag: string) => string;
  historyAxis: HistoryGranularity;
  historyGranulate?: string;
  items: CurrentItem[];
  range: DateRangeState;
  tagLabels: Record<string, string>;
  tagColors: Record<string, string>;
  onRangeChange: (value: DateRangeState) => void;
};

export function ArchiveView({
  edgeId,
  getTagLabel,
  historyAxis,
  historyGranulate,
  items,
  range,
  tagLabels,
  tagColors,
  onRangeChange,
}: ArchiveViewProps) {
  const [avgLineMode, setAvgLineMode] = useState<AvgLineMode>('auto');

  return (
    <section className="chart-section chart-section--archive">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <CalendarClock size={14} />
            История
          </span>
          <h2>График параметров</h2>
        </div>
        <div className="source-chip">
          <DatabaseZap size={16} />
          cloud-v3 · {historyGranulate ?? 'ожидание'}
        </div>
      </div>

      <HistoryChartSet
        avgLineMode={avgLineMode}
        edgeId={edgeId}
        getTagLabel={getTagLabel}
        historyAxis={historyAxis}
        items={items}
        range={range}
        tagLabels={tagLabels}
        tagColors={tagColors}
        onAvgLineModeChange={setAvgLineMode}
        onRangeChange={onRangeChange}
      />
    </section>
  );
}
