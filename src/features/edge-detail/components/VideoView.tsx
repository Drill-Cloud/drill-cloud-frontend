import { Video } from 'lucide-react';
import { CameraView } from '../../../components/CameraView';
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

export function VideoView({ cameras, error, isError, loading }: VideoViewProps) {
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

      {loading ? <div className="empty-panel">Загрузка камер...</div> : null}
      {isError ? <div className="empty-panel">Не удалось загрузить камеры: {String(error)}</div> : null}
      {!loading && !isError && cameras.length === 0 ? <div className="empty-panel">Камеры для этой буровой не настроены</div> : null}

      {!loading && !isError && cameras.length > 0 ? (
        <CameraViewsContainer>
          {cameras.map((camera, index) => {
            const wsUrl = createWsUrl(camera);
            return <CameraView key={`${camera.protocol}:${camera.source}`} title={`Камера ${index + 1}`} wsUrl={wsUrl} />;
          })}
        </CameraViewsContainer>
      ) : null}
    </section>
  );
}
