import mpegts from 'mpegts.js';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_UI_SETTINGS } from '../features/settings/model/defaults';
import type { UiSettings } from '../features/settings/model/settings.types';

type CameraViewProps = {
  playbackSettings?: CameraPlaybackSettings;
  title?: string;
  wsUrl: string;
};

export type CameraPlaybackSettings = UiSettings['player'];

export const DEFAULT_CAMERA_PLAYBACK_SETTINGS: CameraPlaybackSettings = DEFAULT_UI_SETTINGS.player;

const CAMERA_PLAYER_CONFIG = {
  // В mpegts.js 1.8.0 worker может прислать событие после destroy; основной поток здесь стабильнее освобождается.
  enableWorker: false,
  // Сохраняем входной stash-буфер: без него небольшие паузы между WebSocket-чанками сразу превращаются в подёргивания.
  enableStashBuffer: true,
  // Удаляем уже просмотренные данные из MediaSource, чтобы несколько камер не расходовали память без ограничений.
  autoCleanupSourceBuffer: true,
  // Если поток слишком сильно отстал, разрешаем mpegts.js перейти ближе к актуальной live-позиции.
  liveBufferLatencyChasing: true,
  // Во время ручной паузы не перематываем видео к live-позиции без команды пользователя.
  liveBufferLatencyChasingOnPaused: false,
  // Не меняем playbackRate: ускорение воспроизведения визуально воспринимается как подёргивание изображения.
  liveSync: false,
  // Для live-потока продолжаем принимать данные постоянно, даже если вперёд уже накоплен буфер.
  lazyLoad: false,
  // Начинаем загрузку сразу после attach, чтобы стартовый временной буфер формировался без дополнительной паузы.
  deferLoadAfterSourceOpen: false,
};

export function CameraView({ playbackSettings = DEFAULT_CAMERA_PLAYBACK_SETTINGS, title = 'Камера', wsUrl }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    let player: ReturnType<typeof mpegts.createPlayer> | null = null;
    const handlePlayerError = () => setError('Ошибка видеопотока');

    if (!video) {
      return;
    }

    const clearError = () => setError(null);
    video.addEventListener('playing', clearError);
    setError(null);

    if (!mpegts.isSupported()) {
      setError('Браузер не поддерживает MPEG-TS поток');
      return () => {
        video.removeEventListener('playing', clearError);
      };
    }

    player = mpegts.createPlayer(
      { type: 'mpegts', isLive: true, url: wsUrl, hasAudio: false },
      { ...CAMERA_PLAYER_CONFIG, ...playbackSettings },
    );

    player.on(mpegts.Events.ERROR, handlePlayerError);
    player.attachMediaElement(video);
    player.load();

    const playResult = player.play();
    if (playResult instanceof Promise) {
      void playResult.then(() => setError(null)).catch(() => undefined);
    }

    return () => {
      video.removeEventListener('playing', clearError);
      player?.off(mpegts.Events.ERROR, handlePlayerError);
      // destroy() уже выполняет pause, unload и detachMediaElement, поэтому достаточно одного вызова.
      player?.destroy();
    };
  }, [playbackSettings, wsUrl]);

  return (
    <article className="camera-view" data-testid="camera-view" data-camera-title={title}>
      <video ref={videoRef} className="camera-view__video" data-testid="camera-video" controls autoPlay muted playsInline />
      <div className="camera-view__caption">
        <strong>{title}</strong>
      </div>
      {error ? <div className="camera-view__error">{error}</div> : null}
    </article>
  );
}
