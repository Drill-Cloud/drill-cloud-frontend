import mpegts from 'mpegts.js';
import { useEffect, useRef, useState } from 'react';

type CameraViewProps = {
  title?: string;
  wsUrl: string;
};

export function CameraView({ title = 'Камера', wsUrl }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    let player: ReturnType<typeof mpegts.createPlayer> | null = null;

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
      { type: 'mpegts', isLive: true, url: wsUrl },
      { liveBufferLatencyChasing: true, liveBufferLatencyMaxLatency: 1.5 },
    );

    player.attachMediaElement(video);
    player.load();

    const playResult = player.play();
    if (playResult instanceof Promise) {
      void playResult.then(() => setError(null)).catch(() => setError('Не удалось запустить воспроизведение'));
    }

    return () => {
      video.removeEventListener('playing', clearError);
      player?.pause();
      player?.unload();
      player?.detachMediaElement();
      player?.destroy();
    };
  }, [wsUrl]);

  return (
    <article className="camera-view">
      <video ref={videoRef} className="camera-view__video" controls autoPlay muted playsInline />
      <div className="camera-view__caption">
        <strong>{title}</strong>
        <span>{wsUrl}</span>
      </div>
      {error ? <div className="camera-view__error">{error}</div> : null}
    </article>
  );
}
