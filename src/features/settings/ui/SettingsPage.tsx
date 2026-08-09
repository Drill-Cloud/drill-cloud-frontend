import { ArrowLeft, RotateCcw, Save, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_UI_SETTINGS } from '../model/defaults';
import { useUiSettings } from '../model/settings.context';
import { LIVE_GRANULATE_VALUES, type UiSettings } from '../model/settings.types';
import { SettingsSavedModal } from './SettingsSavedModal';

type NumberFieldProps = {
  label: string;
  hint: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
};

function NumberField({ hint, label, max, min, onChange, step = 1, value }: NumberFieldProps) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small>{hint}</small>
    </label>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const store = useUiSettings();
  const [draft, setDraft] = useState<UiSettings>(store.settings);
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  useEffect(() => setDraft(store.settings), [store.settings]);

  const save = async () => {
    try {
      await store.save(draft);
      setSavedModalOpen(true);
    } catch {
      // Ошибка уже отображается из единого store.
    }
  };

  const reset = async () => {
    setDraft(DEFAULT_UI_SETTINGS);
    try {
      await store.reset();
    } catch {
      // Локальные defaults уже применены, ошибка синхронизации отображается выше.
    }
  };

  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Вернуться назад">
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="page-kicker"><Settings size={14} /> Настройки</span>
          <h1>Глобальные настройки интерфейса</h1>
          <p>Настройки привязаны к вашей учетной записи и применяются на всех буровых.</p>
        </div>
      </header>

      {store.error ? <div className="settings-message settings-message--warning">{store.error}</div> : null}
      {store.loading ? <div className="settings-message">Загрузка серверных настроек…</div> : null}

      <div className="settings-sections">
        <section className="settings-card">
          <header><h2>Видеоплеер</h2><p>Буферизация и очистка live-видео.</p></header>
          <div className="settings-grid">
            <NumberField label="Максимальное отставание" hint="Секунды до перехода ближе к live" min={1} max={120} step={0.5} value={draft.player.liveBufferLatencyMaxLatency} onChange={(value) => setDraft((current) => ({ ...current, player: { ...current.player, liveBufferLatencyMaxLatency: value } }))} />
            <NumberField label="Остаток буфера" hint="Секунды после перехода к live" min={0.5} max={60} step={0.5} value={draft.player.liveBufferLatencyMinRemain} onChange={(value) => setDraft((current) => ({ ...current, player: { ...current.player, liveBufferLatencyMinRemain: value } }))} />
            <NumberField label="Начальный stash" hint="Размер входного буфера, КБ" min={64} max={4096} value={Math.round(draft.player.stashInitialSize / 1024)} onChange={(value) => setDraft((current) => ({ ...current, player: { ...current.player, stashInitialSize: value * 1024 } }))} />
            <NumberField label="Начало очистки истории" hint="Секунд позади текущей позиции" min={5} max={180} value={draft.player.autoCleanupMaxBackwardDuration} onChange={(value) => setDraft((current) => ({ ...current, player: { ...current.player, autoCleanupMaxBackwardDuration: value } }))} />
            <NumberField label="Оставлять истории" hint="Секунд после очистки" min={1} max={120} value={draft.player.autoCleanupMinBackwardDuration} onChange={(value) => setDraft((current) => ({ ...current, player: { ...current.player, autoCleanupMinBackwardDuration: value } }))} />
          </div>
        </section>

        <section className="settings-card">
          <header><h2>Live-график</h2><p>Окно данных, частота обновления и детализация.</p></header>
          <div className="settings-grid">
            <NumberField label="Период окна" hint="Минут на экране" min={1} max={120} value={draft.liveChart.windowMinutes} onChange={(value) => setDraft((current) => ({ ...current, liveChart: { ...current.liveChart, windowMinutes: value } }))} />
            <NumberField label="Сдвиг окна" hint="Интервал в миллисекундах" min={1000} max={60000} step={1000} value={draft.liveChart.shiftIntervalMs} onChange={(value) => setDraft((current) => ({ ...current, liveChart: { ...current.liveChart, shiftIntervalMs: value } }))} />
            <NumberField label="Fallback polling" hint="Опрос при недоступном SSE, мс" min={1000} max={60000} step={1000} value={draft.liveChart.fallbackPollingMs} onChange={(value) => setDraft((current) => ({ ...current, liveChart: { ...current.liveChart, fallbackPollingMs: value } }))} />
            <label className="settings-field">
              <span>Грануляция</span>
              <select value={draft.liveChart.granulate} onChange={(event) => setDraft((current) => ({ ...current, liveChart: { ...current.liveChart, granulate: event.target.value as UiSettings['liveChart']['granulate'] } }))}>
                {LIVE_GRANULATE_VALUES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <small>Размер временного bucket</small>
            </label>
            <NumberField label="Максимум точек" hint="На один показатель" min={50} max={5000} step={50} value={draft.liveChart.maxPointsPerTag} onChange={(value) => setDraft((current) => ({ ...current, liveChart: { ...current.liveChart, maxPointsPerTag: value } }))} />
          </div>
        </section>

        <section className="settings-card">
          <header><h2>Архив и интерфейс</h2><p>Начальный период архива и состояние меню.</p></header>
          <div className="settings-grid">
            <NumberField label="Период архива" hint="Часов при открытии страницы" min={1} max={8760} value={draft.archiveChart.defaultPeriodHours} onChange={(value) => setDraft((current) => ({ ...current, archiveChart: { defaultPeriodHours: value } }))} />
            <label className="settings-toggle">
              <input type="checkbox" checked={draft.interface.sidebarCollapsed} onChange={(event) => setDraft((current) => ({ ...current, interface: { sidebarCollapsed: event.target.checked } }))} />
              <span><strong>Сворачивать боковое меню</strong><small>Использовать компактное меню на страницах буровой</small></span>
            </label>
          </div>
        </section>
      </div>

      <footer className="settings-actions">
        <span>Изменения применяются после сохранения</span>
        <button type="button" className="ghost-button" disabled={store.saving} onClick={() => void reset()}><RotateCcw size={16} /> По умолчанию</button>
        <button type="button" className="primary-button" disabled={store.saving} onClick={() => void save()}><Save size={16} /> {store.saving ? 'Сохранение…' : 'Сохранить'}</button>
      </footer>

      {savedModalOpen ? <SettingsSavedModal onClose={() => setSavedModalOpen(false)} /> : null}
    </main>
  );
}
