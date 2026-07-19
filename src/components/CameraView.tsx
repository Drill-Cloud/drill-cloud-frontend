import mpegts from 'mpegts.js';
import { useEffect, useRef, useState } from 'react';

type CameraViewProps = {
  playbackSettings?: CameraPlaybackSettings;
  title?: string;
  wsUrl: string;
};

export type CameraPlaybackSettings = {
  liveBufferLatencyMaxLatency: number;
  liveBufferLatencyMinRemain: number;
};

export const DEFAULT_CAMERA_PLAYBACK_SETTINGS: CameraPlaybackSettings = {
  liveBufferLatencyMaxLatency: 5.0,
  liveBufferLatencyMinRemain: 2.0,
};

const CAMERA_PLAYER_CONFIG = {
  enableWorker: true,
  enableStashBuffer: true,
  stashInitialSize: 512,
  autoCleanupSourceBuffer: true,
  autoCleanupMaxBackwardDuration: 10,
  autoCleanupMinBackwardDuration: 5,
  liveBufferLatencyChasing: true,
  liveSync: false,
  lazyLoad: false,
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
      player?.pause();
      player?.unload();
      player?.detachMediaElement();
      player?.destroy();
    };
  }, [playbackSettings, wsUrl]);

  return (
    <article className="camera-view">
      <video ref={videoRef} className="camera-view__video" controls autoPlay muted playsInline />
      <div className="camera-view__caption">
        <strong>{title}</strong>
      </div>
      {error ? <div className="camera-view__error">{error}</div> : null}
    </article>
  );
}
