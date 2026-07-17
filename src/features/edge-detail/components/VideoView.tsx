import { useState } from 'react';
import { ChevronDown, ChevronUp, Video } from 'lucide-react';
import { CameraView, DEFAULT_CAMERA_PLAYBACK_SETTINGS, type CameraPlaybackSettings } from '../../../components/CameraView';
import { CameraViewsContainer } from '../../../components/CameraViewsContainer';
import type { CameraItem } from '../../../entities/camera/types';

type VideoViewProps = {
  cameras: CameraItem[];
  error: unknown;
  isError: boolean;
  loading: boolean;
};

function createWsUrl(camera: CameraItem): string {
  const protocol = camera.protocol.replace(/:\/?\/?$/, '');
  const source = camera.source.replace(/^\/\//, '');
  return `${protocol}://${source}`;
}

const CAMERA_PLAYBACK_SETTINGS_KEY = 'drill.camera.playbackSettings';

type CameraPlaybackSettingsDraft = {
  liveBufferLatencyMaxLatency: string;
  liveBufferLatencyMinRemain: string;
};

type CameraPlaybackSettingName = keyof CameraPlaybackSettingsDraft;

function toDraft(settings: CameraPlaybackSettings): CameraPlaybackSettingsDraft {
  return {
    liveBufferLatencyMaxLatency: String(settings.liveBufferLatencyMaxLatency),
    liveBufferLatencyMinRemain: String(settings.liveBufferLatencyMinRemain),
  };
}

function readCameraPlaybackSettings(): CameraPlaybackSettings {
  const storedValue = localStorage.getItem(CAMERA_PLAYBACK_SETTINGS_KEY);

  if (!storedValue) {
    return DEFAULT_CAMERA_PLAYBACK_SETTINGS;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<CameraPlaybackSettings>;

    return {
      liveBufferLatencyMaxLatency:
        typeof parsed.liveBufferLatencyMaxLatency === 'number'
          ? parsed.liveBufferLatencyMaxLatency
          : DEFAULT_CAMERA_PLAYBACK_SETTINGS.liveBufferLatencyMaxLatency,
      liveBufferLatencyMinRemain:
        typeof parsed.liveBufferLatencyMinRemain === 'number'
          ? parsed.liveBufferLatencyMinRemain
          : DEFAULT_CAMERA_PLAYBACK_SETTINGS.liveBufferLatencyMinRemain,
    };
  } catch {
    return DEFAULT_CAMERA_PLAYBACK_SETTINGS;
  }
}

function parseLatencyValue(value: string, fallback: number): number {
  const nextValue = Number(value.replace(',', '.'));

  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : fallback;
}

function createSettingsFromDraft(draft: CameraPlaybackSettingsDraft, fallback: CameraPlaybackSettings): CameraPlaybackSettings {
  return {
    liveBufferLatencyMaxLatency: parseLatencyValue(
      draft.liveBufferLatencyMaxLatency,
      fallback.liveBufferLatencyMaxLatency,
    ),
    liveBufferLatencyMinRemain: parseLatencyValue(draft.liveBufferLatencyMinRemain, fallback.liveBufferLatencyMinRemain),
  };
}

// Меняет числовое значение поля на один шаг, оставляя его валидным для настроек буфера.
function stepLatencyDraftValue(value: string, direction: 1 | -1, fallback: number): string {
  const currentValue = parseLatencyValue(value, fallback);
  const nextValue = Math.max(0.1, currentValue + direction * 0.1);

  return (Math.round(nextValue * 10) / 10).toFixed(1);
}

type CameraPlaybackNumberFieldProps = {
  label: string;
  name: CameraPlaybackSettingName;
  value: string;
  fallback: number;
  onChange: (name: CameraPlaybackSettingName, value: string) => void;
};

// Поле настройки с собственными кнопками изменения значения вместо браузерных стрелок number-input.
function CameraPlaybackNumberField({ fallback, label, name, onChange, value }: CameraPlaybackNumberFieldProps) {
  return (
    <label>
      {label}
      <span className="camera-playback-settings__number-field">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
        />
        <span className="camera-playback-settings__stepper" aria-hidden="true">
          <button type="button" tabIndex={-1} onClick={() => onChange(name, stepLatencyDraftValue(value, 1, fallback))}>
            <ChevronUp size={12} />
          </button>
          <button type="button" tabIndex={-1} onClick={() => onChange(name, stepLatencyDraftValue(value, -1, fallback))}>
            <ChevronDown size={12} />
          </button>
        </span>
      </span>
    </label>
  );
}

export function VideoView({ cameras, error, isError, loading }: VideoViewProps) {
  const [playbackSettings, setPlaybackSettings] = useState<CameraPlaybackSettings>(() => readCameraPlaybackSettings());
  const [playbackSettingsDraft, setPlaybackSettingsDraft] = useState<CameraPlaybackSettingsDraft>(() =>
    toDraft(playbackSettings),
  );

  // Обновляет черновик настроек: применяются они только после нажатия "Применить".
  const updatePlaybackSettingsDraft = (name: CameraPlaybackSettingName, value: string) => {
    setPlaybackSettingsDraft((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const applyPlaybackSettings = () => {
    const nextSettings = createSettingsFromDraft(playbackSettingsDraft, playbackSettings);

    setPlaybackSettings(nextSettings);
    setPlaybackSettingsDraft(toDraft(nextSettings));
    localStorage.setItem(CAMERA_PLAYBACK_SETTINGS_KEY, JSON.stringify(nextSettings));
  };

  const resetPlaybackSettings = () => {
    setPlaybackSettings(DEFAULT_CAMERA_PLAYBACK_SETTINGS);
    setPlaybackSettingsDraft(toDraft(DEFAULT_CAMERA_PLAYBACK_SETTINGS));
    localStorage.setItem(CAMERA_PLAYBACK_SETTINGS_KEY, JSON.stringify(DEFAULT_CAMERA_PLAYBACK_SETTINGS));
  };

  return (
    <section className="video-section">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <Video size={14} />
            Видео
          </span>
          <h2>Видеопотоки буровой</h2>
        </div>
      </div>

      <div className="camera-playback-settings">
        <div>
          <span className="camera-playback-settings__eyebrow">Настройки воспроизведения с камер</span>
          <strong>Буфер live-видео</strong>
        </div>
        <CameraPlaybackNumberField
          fallback={playbackSettings.liveBufferLatencyMaxLatency}
          label="Max latency"
          name="liveBufferLatencyMaxLatency"
          value={playbackSettingsDraft.liveBufferLatencyMaxLatency}
          onChange={updatePlaybackSettingsDraft}
        />
        <CameraPlaybackNumberField
          fallback={playbackSettings.liveBufferLatencyMinRemain}
          label="Min remain"
          name="liveBufferLatencyMinRemain"
          value={playbackSettingsDraft.liveBufferLatencyMinRemain}
          onChange={updatePlaybackSettingsDraft}
        />
        <div className="camera-playback-settings__actions">
          <button type="button" onClick={applyPlaybackSettings}>
            Применить
          </button>
          <button type="button" onClick={resetPlaybackSettings}>
            По умолчанию
          </button>
        </div>
      </div>

      {loading ? <div className="empty-panel">Загрузка камер...</div> : null}
      {isError ? <div className="empty-panel">Не удалось загрузить камеры: {String(error)}</div> : null}
      {!loading && !isError && cameras.length === 0 ? <div className="empty-panel">Камеры для этой буровой не настроены</div> : null}

      {!loading && !isError && cameras.length > 0 ? (
        <CameraViewsContainer>
          {cameras.map((camera, index) => {
            const wsUrl = createWsUrl(camera);
            return (
              <CameraView
                key={`${camera.protocol}:${camera.source}`}
                playbackSettings={playbackSettings}
                title={`Камера ${index + 1}`}
                wsUrl={wsUrl}
              />
            );
          })}
        </CameraViewsContainer>
      ) : null}
    </section>
  );
}
